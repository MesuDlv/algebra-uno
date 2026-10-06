import { Card, CardColor } from './card';

export interface PlayerState {
  uid: string;
  name: string;
  avatar: string;
  hand: Card[];
  hasCalledUno: boolean;
}

export type GameStatus = 
  | 'waiting'           // Esperando a que el creador inicie la partida
  | 'playing'           // En curso, turno de algún jugador
  | 'pendingColor'      // Esperando a que quien jugó un comodín elija color
  | 'finished';         // Partida terminada con un ganador

export interface GameState {
  status: GameStatus;
  seed: number;
  players: PlayerState[];
  currentTurnIndex: number;
  direction: 1 | -1;            // 1: Horario, -1: Antihorario
  deck: Card[];
  discardPile: Card[];
  activeColor: CardColor;
  pendingColorPlayerId: string | null;
  accumulatedDrawCount: number; // Cartas acumuladas por +2 o +4 (Regla de acumulación)
  drawnCardThisTurn: Card | null;  // Si robó carta este turno y puede jugarla
  reshuffleCount: number;
  winnerUid: string | null;
  helpMode: boolean;
  lastAction: string | null;
  unoVulnerableUids: string[];     // Jugadores con 1 carta que aún no cantaron UNO
}
