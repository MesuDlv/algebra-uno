export interface RoomMember {
  uid: string;
  name: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface RoomData {
  id: string;              // Código de 5 letras/números (ej. 'K7X9B')
  hostUid: string;
  status: RoomStatus;
  members: RoomMember[];
  maxPlayers: number;      // 2 a 5 jugadores
  helpMode: boolean;       // Muestra explicaciones paso a paso de las ecuaciones
  lastSeq: number;         // Último número de secuencia emitido en /events/{seq}
  createdAt: number;
  seed: number;            // Semilla PRNG compartida para la partida
}

export interface PresenceInfo {
  uid: string;
  name: string;
  lastSeen: number;        // Timestamp en milisegundos
  isOnline: boolean;
}
