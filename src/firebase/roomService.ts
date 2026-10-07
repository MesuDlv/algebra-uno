import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { ensureAnonymousAuth, PlayerProfile } from './auth';
import { RoomData, RoomMember } from '../types/room';
import { GameEvent } from '../types/event';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin 0, O, 1, I para evitar confusión visual

/**
 * Genera un código de sala de 5 caracteres alfanuméricos en mayúsculas.
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Crea una nueva sala en Firestore y registra al usuario creador como host.
 */
export async function createRoom(
  profile: PlayerProfile,
  helpMode = false,
  maxPlayers = 6,
  isSpectator = false
): Promise<string> {
  const user = await ensureAnonymousAuth();
  if (!user) throw new Error('No se pudo autenticar el usuario para crear la sala');

  const roomId = generateRoomCode();
  const roomRef = doc(db, 'rooms', roomId);

  const initialMember: RoomMember = {
    uid: user.uid,
    name: profile.name,
    avatar: profile.avatar,
    isHost: true,
    joinedAt: Date.now(),
    isSpectator,
  };

  const seed = Math.floor(Math.random() * 1000000) + 1;

  const roomData: RoomData = {
    id: roomId,
    hostUid: user.uid,
    status: 'waiting',
    members: [initialMember],
    maxPlayers: Math.min(Math.max(maxPlayers, 2), 6),
    helpMode,
    lastSeq: 0,
    createdAt: Date.now(),
    seed,
  };

  try {
    await setDoc(roomRef, roomData);
    return roomId;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (
      err?.code === 'permission-denied' ||
      err?.message?.toLowerCase().includes('permission')
    ) {
      throw new Error(
        'Permisos insuficientes en Firestore (PERMISSION_DENIED): Debes publicar las reglas de seguridad en Firebase Console (Firestore Database > Reglas).'
      );
    }
    throw error;
  }
}

/**
 * Obtiene la información actual de una sala por su código.
 */
export async function getRoom(roomId: string): Promise<RoomData | null> {
  if (!isFirebaseConfigured) return null;
  const roomRef = doc(db, 'rooms', roomId.toUpperCase());
  const snapshot = await getDoc(roomRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as RoomData;
}

/**
 * Une a un jugador a una sala existente si hay espacio disponible o como espectador.
 */
export async function joinRoom(
  roomId: string,
  profile: PlayerProfile,
  preferredSpectator?: boolean
): Promise<RoomData> {
  const user = await ensureAnonymousAuth();
  if (!user) throw new Error('No se pudo autenticar el usuario');

  const normalizedRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', normalizedRoomId);

  return await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) {
      throw new Error(`La sala "${normalizedRoomId}" no existe.`);
    }

    const room = snapshot.data() as RoomData;

    // Verificar si el jugador ya está dentro de la sala (reconexión o actualización)
    const existingMember = room.members.find((m) => m.uid === user.uid);
    if (existingMember) {
      const updatedMembers = room.members.map((m) =>
        m.uid === user.uid
          ? {
              ...m,
              name: profile.name,
              avatar: profile.avatar,
              isSpectator: preferredSpectator !== undefined ? preferredSpectator : m.isSpectator,
            }
          : m
      );
      transaction.update(roomRef, { members: updatedMembers });
      return { ...room, members: updatedMembers };
    }

    // Calcular si entra como espectador
    const activeMembersCount = room.members.filter((m) => !m.isSpectator).length;
    const isRoomFull = activeMembersCount >= room.maxPlayers;
    const isSpectator =
      preferredSpectator !== undefined
        ? preferredSpectator
        : room.status !== 'waiting' || isRoomFull;

    const newMember: RoomMember = {
      uid: user.uid,
      name: profile.name,
      avatar: profile.avatar,
      isHost: false,
      joinedAt: Date.now(),
      isSpectator,
    };

    const nextMembers = [...room.members, newMember];
    transaction.update(roomRef, { members: nextMembers });

    return { ...room, members: nextMembers };
  });
}

/**
 * Alterna el estado de un usuario entre jugador activo y espectador.
 */
export async function toggleSpectatorStatus(roomId: string, uid: string): Promise<boolean> {
  const roomRef = doc(db, 'rooms', roomId.toUpperCase());
  return await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) throw new Error('La sala no existe');
    const room = snapshot.data() as RoomData;
    const member = room.members.find((m) => m.uid === uid);
    if (!member) throw new Error('Jugador no encontrado en la sala');

    const willBeSpectator = !member.isSpectator;
    if (!willBeSpectator) {
      // Si quiere pasar a jugador activo, validar cupo disponible
      const activeCount = room.members.filter((m) => !m.isSpectator && m.uid !== uid).length;
      if (activeCount >= room.maxPlayers) {
        throw new Error(`La mesa está llena (máximo ${room.maxPlayers} jugadores).`);
      }
    }

    const nextMembers = room.members.map((m) =>
      m.uid === uid ? { ...m, isSpectator: willBeSpectator } : m
    );

    transaction.update(roomRef, { members: nextMembers });
    return willBeSpectator;
  });
}

/**
 * Actualiza el perfil (nombre y avatar) de un miembro dentro de la sala activa.
 */
export async function updateMemberProfileInRoom(
  roomId: string,
  uid: string,
  name: string,
  avatar: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId.toUpperCase());
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) return;
    const room = snapshot.data() as RoomData;
    const nextMembers = room.members.map((m) =>
      m.uid === uid ? { ...m, name, avatar } : m
    );
    transaction.update(roomRef, { members: nextMembers });
  });
}

/**
 * Remueve a un jugador de la sala (abandono de partida o lobby).
 * Si la partida estaba en curso, emite el evento 'playerLeft' para que el juego declare victoria por abandono.
 */
export async function leaveRoom(roomId: string, uid: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId.toUpperCase());

  // Si la partida estaba en juego, emitir evento playerLeft para sincronizar a todos los jugadores
  try {
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      const room = roomSnap.data() as RoomData;
      if (room.status === 'playing') {
        const leavingMember = room.members.find((m) => m.uid === uid);
        if (leavingMember && !leavingMember.isSpectator) {
          await emitGameEvent(roomId, {
            uid,
            type: 'playerLeft',
            payload: { leavingUid: uid, name: leavingMember.name },
          });
        }
      }
    }
  } catch (err) {
    console.warn('Aviso al emitir evento playerLeft al salir:', err);
  }

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.data() as RoomData;
    const nextMembers = room.members.filter((m) => m.uid !== uid);

    if (nextMembers.length === 0) {
      // Sala vacía: marcar como terminada
      transaction.update(roomRef, { status: 'finished', members: [] });
      return;
    }

    // Si el que se fue era el host, transferimos el host al siguiente jugador activo
    if (room.hostUid === uid) {
      const nextActiveHost = nextMembers.find((m) => !m.isSpectator) || nextMembers[0];
      nextActiveHost.isHost = true;
      transaction.update(roomRef, {
        members: nextMembers,
        hostUid: nextActiveHost.uid,
      });
    } else {
      transaction.update(roomRef, { members: nextMembers });
    }
  });
}

/**
 * Escucha cambios en tiempo real del documento de la sala.
 */
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: RoomData | null) => void
): () => void {
  const roomRef = doc(db, 'rooms', roomId.toUpperCase());
  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
      } else {
        onUpdate(snapshot.data() as RoomData);
      }
    },
    (error) => {
      console.error('Error al suscribirse a la sala:', error);
    }
  );
}

/**
 * Emite un evento en el log inmutable secuencial (Event Sourcing) usando transacciones de Firestore.
/**
 * Elimina recursivamente campos con valor 'undefined' para evitar errores de Firestore
 * ("Function Transaction.set() called with invalid data. Unsupported field value: undefined").
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = sanitizeFirestoreData(value);
    }
  }
  return result as T;
}

/**
 * Emite un evento en el log inmutable secuencial (Event Sourcing) usando transacciones de Firestore.
 * Garantiza seq = lastSeq + 1 sin colisiones concurrentes.
 */
export async function emitGameEvent(
  roomId: string,
  eventWithoutSeq: Omit<GameEvent, 'seq'>
): Promise<number> {
  const roomRef = doc(db, 'rooms', roomId.toUpperCase());

  return await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists()) {
      throw new Error(`La sala "${roomId}" no existe.`);
    }

    const roomData = roomSnapshot.data() as RoomData;
    const nextSeq = (roomData.lastSeq || 0) + 1;

    const eventRef = doc(db, 'rooms', roomId.toUpperCase(), 'events', String(nextSeq));

    const fullEvent: GameEvent = {
      ...eventWithoutSeq,
      seq: nextSeq,
    };

    // Guardar evento y actualizar lastSeq atómicamente, sanitizando posibles campos 'undefined'
    const sanitizedEvent = sanitizeFirestoreData(fullEvent);
    transaction.set(eventRef, {
      ...sanitizedEvent,
      timestamp: serverTimestamp(),
    });

    const updates: Partial<RoomData> = { lastSeq: nextSeq };
    if (eventWithoutSeq.type === 'start') {
      updates.status = 'playing';
    }

    transaction.update(roomRef, updates);

    return nextSeq;
  });
}

/**
 * Escucha en tiempo real la lista completa de eventos de la sala en orden ascendente (seq 1, 2, 3...).
 */
export function subscribeToEvents(
  roomId: string,
  onEventsUpdate: (events: GameEvent[]) => void
): () => void {
  const eventsCol = collection(db, 'rooms', roomId.toUpperCase(), 'events');
  const eventsQuery = query(
    eventsCol,
    orderBy('seq', 'asc')
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const allEvents: GameEvent[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          seq: data.seq,
          uid: data.uid,
          type: data.type,
          payload: data.payload,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
        };
      });
      onEventsUpdate(allEvents);
    },
    (error) => {
      console.error('Error al escuchar eventos de la sala:', error);
    }
  );
}

