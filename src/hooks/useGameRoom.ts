import { useState, useEffect, useCallback, useRef } from 'react';
import { RoomData, PresenceInfo } from '../types/room';
import { GameState } from '../types/game';
import { GameEvent } from '../types/event';
import { CardColor } from '../types/card';
import { gameReducer, createInitialState } from '../engine/gameReducer';
import {
  subscribeToRoom,
  subscribeToEvents,
  emitGameEvent,
  leaveRoom,
} from '../firebase/roomService';
import {
  startPresenceHeartbeat,
  subscribeToPresence,
} from '../firebase/presenceService';
import { getPlayerProfile } from '../firebase/auth';

interface UseGameRoomReturn {
  room: RoomData | null;
  gameState: GameState;
  events: GameEvent[];
  presence: PresenceInfo[];
  isLoading: boolean;
  error: string | null;
  isHost: boolean;
  isMyTurn: boolean;
  // Acciones del juego
  startGame: () => Promise<void>;
  playCard: (cardId: string, chosenColor?: CardColor) => Promise<void>;
  chooseColor: (color: CardColor) => Promise<void>;
  drawCard: () => Promise<void>;
  passTurn: () => Promise<void>;
  callUno: () => Promise<void>;
  catchUno: (targetUid: string) => Promise<void>;
  skipInactivePlayer: (targetUid: string) => Promise<void>;
  requestRematch: () => Promise<void>;
  exitRoom: () => Promise<void>;
}

export function useGameRoom(roomId: string | null, currentUserUid: string | null): UseGameRoomReturn {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const eventsMapRef = useRef<Map<number, GameEvent>>(new Map());
  const lastProcessedSeqRef = useRef<number>(0);
  const profile = getPlayerProfile();

  // 1. Suscripción a la sala en tiempo real
  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribeRoom = subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
      setIsLoading(false);
      if (!roomData) {
        setError('La sala no fue encontrada o ha sido cerrada.');
      }
    });

    return () => {
      unsubscribeRoom();
    };
  }, [roomId]);

  // 2. Latido de presencia
  useEffect(() => {
    if (!roomId || !currentUserUid) return;

    const stopHeartbeat = startPresenceHeartbeat(roomId, currentUserUid, profile.name);
    const unsubscribePresence = subscribeToPresence(roomId, (presenceList) => {
      setPresence(presenceList);
    });

    return () => {
      stopHeartbeat();
      unsubscribePresence();
    };
  }, [roomId, currentUserUid, profile.name]);

  // 3. Suscripción y reproducción secuencial de eventos (Event Sourcing)
  useEffect(() => {
    if (!roomId) return;

    // Reset de estado local al cambiar de sala
    eventsMapRef.current.clear();
    lastProcessedSeqRef.current = 0;
    setGameState(createInitialState());
    setEvents([]);

    const unsubscribeEvents = subscribeToEvents(roomId, (newEvent) => {
      eventsMapRef.current.set(newEvent.seq, newEvent);

      // Reconstruir incrementalmente en orden estricto de seq
      setEvents((prevEvents) => {
        const nextEvents = [...prevEvents];
        if (!nextEvents.some((e) => e.seq === newEvent.seq)) {
          nextEvents.push(newEvent);
          nextEvents.sort((a, b) => a.seq - b.seq);
        }
        return nextEvents;
      });

      setGameState((currentState) => {
        let state = currentState;
        // Aplicar todos los eventos consecutivos que estén listos
        while (eventsMapRef.current.has(lastProcessedSeqRef.current + 1)) {
          const nextSeq = lastProcessedSeqRef.current + 1;
          const eventToProcess = eventsMapRef.current.get(nextSeq)!;
          state = gameReducer(state, eventToProcess);
          lastProcessedSeqRef.current = nextSeq;
        }
        return state;
      });
    });

    return () => {
      unsubscribeEvents();
    };
  }, [roomId]);

  const isHost = Boolean(room && currentUserUid && room.hostUid === currentUserUid);
  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn = Boolean(
    gameState.status === 'playing' &&
    currentPlayer &&
    currentPlayer.uid === currentUserUid
  );

  // Iniciar la partida (Host)
  const startGame = useCallback(async () => {
    if (!roomId || !currentUserUid || !isHost || !room) return;
    if (room.members.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para iniciar la partida.');
    }

    const startPayload = {
      seed: room.seed || Math.floor(Math.random() * 1000000) + 1,
      players: room.members.map((m) => ({
        uid: m.uid,
        name: m.name,
        avatar: m.avatar,
      })),
      helpMode: room.helpMode,
    };

    await emitGameEvent(roomId, {
      uid: currentUserUid,
      type: 'start',
      payload: startPayload,
    });
  }, [roomId, currentUserUid, isHost, room]);

  // Jugar una carta
  const playCard = useCallback(
    async (cardId: string, chosenColor?: CardColor) => {
      if (!roomId || !currentUserUid) return;
      await emitGameEvent(roomId, {
        uid: currentUserUid,
        type: 'play',
        payload: { cardId, chosenColor },
      });
    },
    [roomId, currentUserUid]
  );

  // Elegir color tras jugar comodín
  const chooseColor = useCallback(
    async (color: CardColor) => {
      if (!roomId || !currentUserUid) return;
      await emitGameEvent(roomId, {
        uid: currentUserUid,
        type: 'chooseColor',
        payload: { color },
      });
    },
    [roomId, currentUserUid]
  );

  // Robar cartas ("comer hasta poder lanzar" o penalización acumulada)
  const drawCard = useCallback(async () => {
    if (!roomId || !currentUserUid) return;
    await emitGameEvent(roomId, {
      uid: currentUserUid,
      type: 'draw',
      payload: {},
    });
  }, [roomId, currentUserUid]);

  // Pasar turno (cuando ya robó en turno normal)
  const passTurn = useCallback(async () => {
    if (!roomId || !currentUserUid) return;
    await emitGameEvent(roomId, {
      uid: currentUserUid,
      type: 'pass',
      payload: {},
    });
  }, [roomId, currentUserUid]);

  // Cantar UNO
  const callUno = useCallback(async () => {
    if (!roomId || !currentUserUid) return;
    await emitGameEvent(roomId, {
      uid: currentUserUid,
      type: 'uno',
      payload: {},
    });
  }, [roomId, currentUserUid]);

  // Atrapar rival sin cantar UNO
  const catchUno = useCallback(
    async (targetUid: string) => {
      if (!roomId || !currentUserUid) return;
      await emitGameEvent(roomId, {
        uid: currentUserUid,
        type: 'catchUno',
        payload: { targetUid },
      });
    },
    [roomId, currentUserUid]
  );

  // Saltar turno por inactividad (> 60s)
  const skipInactivePlayer = useCallback(
    async (targetUid: string) => {
      if (!roomId || !currentUserUid) return;
      await emitGameEvent(roomId, {
        uid: currentUserUid,
        type: 'skipTimeout',
        payload: { targetUid },
      });
    },
    [roomId, currentUserUid]
  );

  // Revancha con nueva semilla
  const requestRematch = useCallback(async () => {
    if (!roomId || !currentUserUid) return;
    const nextSeed = Math.floor(Math.random() * 1000000) + 1;
    await emitGameEvent(roomId, {
      uid: currentUserUid,
      type: 'rematch',
      payload: { seed: nextSeed },
    });
  }, [roomId, currentUserUid]);

  // Salir de la sala
  const exitRoom = useCallback(async () => {
    if (roomId && currentUserUid) {
      await leaveRoom(roomId, currentUserUid);
    }
  }, [roomId, currentUserUid]);

  return {
    room,
    gameState,
    events,
    presence,
    isLoading,
    error,
    isHost,
    isMyTurn,
    startGame,
    playCard,
    chooseColor,
    drawCard,
    passTurn,
    callUno,
    catchUno,
    skipInactivePlayer,
    requestRematch,
    exitRoom,
  };
}
