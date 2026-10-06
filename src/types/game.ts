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
  | 'pendingChallenge'  // Esperando a que el siguiente jugador Acepte o Desafíe el +4
  | 'finished';         // Partida terminada con un ganador

export interface PendingChallenge {
  wild4Card: Card;
  playedByUid: string;
  targetUid: string;
  activeColorBeforeWild4: CardColor;
  // Registro de la mano previa del desafiado para validar legalidad
  handBeforePlay: Card[];
}

export interface GameState {
  status: GameStatus;
  seed: number;
  players: PlayerState[];
  currentTurnIndex: number;
  direction: 1 | -1;          // 1: Horario, -1: Antihorario
  deck: Card[];
  discardPile: Card[];
  activeColor: CardColor;
  pendingColorPlayerId: string | null;
  pendingChallenge: PendingChallenge | null;
  drawnCardThisTurn: Card | null;  // Si robó carta este turno y puede jugarla
  reshuffleCount: number;
  winnerUid: string | null;
  helpMode: boolean;
  lastAction: string | null;
  unoVulnerableUids: string[];     // Jugadores con 1 carta que aún no cantaron UNO
}
