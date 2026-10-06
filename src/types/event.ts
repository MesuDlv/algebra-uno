import { CardColor } from './card';

export type EventType =
  | 'start'
  | 'play'
  | 'draw'
  | 'pass'
  | 'chooseColor'
  | 'uno'
  | 'catchUno'
  | 'skipTimeout'
  | 'rematch'
  | 'playerLeft';

export interface BaseEvent {
  seq: number;
  uid: string;
  type: EventType;
  timestamp?: number;
}

export interface StartEventPayload {
  seed: number;
  players: Array<{ uid: string; name: string; avatar: string }>;
  helpMode?: boolean;
}

export interface PlayEventPayload {
  cardId: string;
  chosenColor?: CardColor; // Si es comodín y ya envía el color de inmediato
}

export interface ChooseColorEventPayload {
  color: CardColor;
}

export interface CatchUnoEventPayload {
  targetUid: string;
}

export interface SkipTimeoutEventPayload {
  targetUid: string;
}

export interface RematchEventPayload {
  seed: number;
}

export interface PlayerLeftEventPayload {
  leavingUid: string;
  name?: string;
}

export type EventPayload =
  | StartEventPayload
  | PlayEventPayload
  | ChooseColorEventPayload
  | CatchUnoEventPayload
  | SkipTimeoutEventPayload
  | RematchEventPayload
  | PlayerLeftEventPayload
  | Record<string, never>; // Para eventos sin payload como draw, pass, uno, etc.

export interface GameEvent extends BaseEvent {
  payload: EventPayload;
}
