import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { PresenceInfo } from '../types/room';

const HEARTBEAT_INTERVAL_MS = 15000; // 15 segundos
export const TIMEOUT_THRESHOLD_MS = 60000;  // 60 segundos de inactividad para considerar desconectado

/**
 * Inicia el latido de presencia periódico en Firestore para un jugador.
 * Retorna una función para detener el latido cuando el componente se desmonte o el jugador salga.
 */
export function startPresenceHeartbeat(
  roomId: string,
  uid: string,
  name: string
): () => void {
  if (!isFirebaseConfigured || !roomId || !uid) {
    return () => {};
  }

  const presenceDocRef = doc(db, 'rooms', roomId.toUpperCase(), 'presence', uid);

  const sendHeartbeat = async () => {
    try {
      await setDoc(presenceDocRef, {
        uid,
        name,
        lastSeen: serverTimestamp(),
      });
    } catch (err) {
      // Ignorar errores transitorios de red en el latido
      console.warn('Error en latido de presencia:', err);
    }
  };

  // Enviar primer latido de inmediato
  sendHeartbeat();

  // Configurar intervalo recurrente cada 15 segundos
  const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

  // Función de limpieza
  return () => {
    clearInterval(intervalId);
    // Intentar borrar la presencia al salir limpiamente
    deleteDoc(presenceDocRef).catch(() => {});
  };
}

/**
 * Escucha la presencia en tiempo real de todos los jugadores de la sala.
 */
export function subscribeToPresence(
  roomId: string,
  onPresenceUpdate: (presenceList: PresenceInfo[]) => void
): () => void {
  if (!isFirebaseConfigured || !roomId) {
    return () => {};
  }

  const presenceCol = collection(db, 'rooms', roomId.toUpperCase(), 'presence');

  return onSnapshot(
    presenceCol,
    (snapshot) => {
      const now = Date.now();
      const list: PresenceInfo[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const lastSeen = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : now;
        const isOnline = now - lastSeen < TIMEOUT_THRESHOLD_MS;

        list.push({
          uid: data.uid || docSnap.id,
          name: data.name || 'Jugador',
          lastSeen,
          isOnline,
        });
      });

      onPresenceUpdate(list);
    },
    (err) => {
      console.error('Error al escuchar presencia:', err);
    }
  );
}

/**
 * Evalúa si un jugador ha sobrepasado el límite de 60 segundos de inactividad.
 */
export function isPlayerTimedOut(lastSeenMillis: number): boolean {
  return Date.now() - lastSeenMillis > TIMEOUT_THRESHOLD_MS;
}
