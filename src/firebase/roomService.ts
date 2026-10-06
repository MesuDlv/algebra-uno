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
  where,
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
  maxPlayers = 5
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
  };

  const seed = Math.floor(Math.random() * 1000000) + 1;

  const roomData: RoomData = {
    id: roomId,
    hostUid: user.uid,
    status: 'waiting',
    members: [initialMember],
    maxPlayers: Math.min(Math.max(maxPlayers, 2), 5),
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
 * Une a un jugador a una sala existente si hay espacio disponible.
 */
export async function joinRoom(roomId: string, profile: PlayerProfile): Promise<RoomData> {
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

    // Verificar si el jugador ya está dentro de la sala (reconexión)
    const existingMember = room.members.find((m) => m.uid === user.uid);
    if (existingMember) {
      // Si cambió su nombre o avatar, actualizamos su información
      const updatedMembers = room.members.map((m) =>
        m.uid === user.uid ? { ...m, name: profile.name, avatar: profile.avatar } : m
      );
      transaction.update(roomRef, { members: updatedMembers });
      return { ...room, members: updatedMembers };
    }

    // Si la partida ya empezó o la sala está llena de jugadores activos, entra como ESPECTADOR
    const activeMembersCount = room.members.filter((m) => !m.isSpectator).length;
    const isRoomFull = activeMembersCount >= room.maxPlayers;
    const isSpectator = room.status !== 'waiting' || isRoomFull;

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

    // Guardar evento y actualizar lastSeq atómicamente
    transaction.set(eventRef, {
      ...fullEvent,
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
 * Escucha en tiempo real la secuencia de eventos de la sala en orden ascendente (seq 1, 2, 3...).
 */
export function subscribeToEvents(
  roomId: string,
  onEventReceived: (event: GameEvent) => void,
  fromSeq = 1
): () => void {
  const eventsCol = collection(db, 'rooms', roomId.toUpperCase(), 'events');
  const eventsQuery = query(
    eventsCol,
    where('seq', '>=', fromSeq),
    orderBy('seq', 'asc')
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const gameEvent: GameEvent = {
            seq: data.seq,
            uid: data.uid,
            type: data.type,
            payload: data.payload,
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
          };
          onEventReceived(gameEvent);
        }
      });
    },
    (error) => {
      console.error('Error al escuchar eventos de la sala:', error);
    }
  );
}
