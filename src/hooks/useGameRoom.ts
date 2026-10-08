import { useState, useEffect, useCallback } from 'react';
import { RoomData, PresenceInfo } from '../types/room';
import { GameState } from '../types/game';
import { GameEvent } from '../types/event';
import { CardColor } from '../types/card';
import { gameReducer, createInitialState } from '../engine/gameReducer';
import { isCardPlayable } from '../engine/rules';
import {
  subscribeToRoom,
  subscribeToEvents,
  emitGameEvent,
  leaveRoom,
  setMemberSpectator,
  addBotToRoom,
  removeBotFromRoom,
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
  disqualifyPlayer: (targetUid: string) => Promise<void>;
  requestRematch: () => Promise<void>;
  exitRoom: () => Promise<void>;
  addBot: (botName?: string, botAvatar?: string) => Promise<void>;
  removeBot: (botUid: string) => Promise<void>;
}

export function useGameRoom(roomId: string | null, currentUserUid: string | null): UseGameRoomReturn {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    setGameState(createInitialState());
    setEvents([]);

    const unsubscribeEvents = subscribeToEvents(roomId, (allEvents) => {
      // Reconstruir estado determinísticamente de forma pura desde la lista de eventos
      let calculatedState = createInitialState();
      for (const ev of allEvents) {
        calculatedState = gameReducer(calculatedState, ev);
      }

      setEvents(allEvents);
      setGameState(calculatedState);
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
    const activePlayers = room.members.filter((m) => !m.isSpectator);
    if (activePlayers.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para iniciar la partida.');
    }

    const startPayload = {
      seed: room.seed || Math.floor(Math.random() * 1000000) + 1,
      players: activePlayers.map((m) => ({
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
      const playPayload: { cardId: string; chosenColor?: CardColor } = { cardId };
      if (chosenColor) {
        playPayload.chosenColor = chosenColor;
      }
      await emitGameEvent(roomId, {
        uid: currentUserUid,
        type: 'play',
        payload: playPayload,
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

  // Descalificar jugador desconectado tras 60 segundos
  const disqualifyPlayer = useCallback(
    async (targetUid: string) => {
      if (!roomId || !currentUserUid) return;
      try {
        await setMemberSpectator(roomId, targetUid, true);
      } catch (err) {
        console.warn('Aviso al marcar espectador en disqualifyPlayer:', err);
      }
      await emitGameEvent(roomId, {
        uid: currentUserUid,
        type: 'playerLeft',
        payload: { leavingUid: targetUid },
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
      if (gameState.status === 'playing' || gameState.status === 'pendingColor') {
        try {
          await emitGameEvent(roomId, {
            uid: currentUserUid,
            type: 'playerLeft',
            payload: { leavingUid: currentUserUid },
          });
        } catch (err) {
          console.warn('Aviso al emitir playerLeft desde exitRoom:', err);
        }
      }
      await leaveRoom(roomId, currentUserUid);
    }
  }, [roomId, currentUserUid, gameState.status]);

  // Añadir bot a la sala
  const addBot = useCallback(
    async (botName = '🤖 Bot Pitágoras', botAvatar = '🧠') => {
      if (!roomId) return;
      await addBotToRoom(roomId, botName, botAvatar);
    },
    [roomId]
  );

  // Remover bot de la sala
  const removeBot = useCallback(
    async (botUid: string) => {
      if (!roomId) return;
      await removeBotFromRoom(roomId, botUid);
    },
    [roomId]
  );

  // Lógica de Inteligencia Artificial de Bot para partidas de prueba / práctica
  useEffect(() => {
    if (!roomId || !isHost) return;

    // 1. Si el bot debe elegir color
    if (gameState.status === 'pendingColor' && gameState.pendingColorPlayerId?.startsWith('bot_')) {
      const botUid = gameState.pendingColorPlayerId;
      const colors: CardColor[] = ['green', 'red', 'blue', 'yellow'];
      const timer = setTimeout(async () => {
        try {
          const chosen = colors[Math.floor(Math.random() * colors.length)];
          await emitGameEvent(roomId, {
            uid: botUid,
            type: 'chooseColor',
            payload: { color: chosen },
          });
        } catch (err) {
          console.warn('Error en bot chooseColor:', err);
        }
      }, 800);
      return () => clearTimeout(timer);
    }

    // 2. Si es el turno normal de un bot
    if (gameState.status !== 'playing') return;
    const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];
    if (!currentTurnPlayer || !currentTurnPlayer.uid.startsWith('bot_')) return;

    const botUid = currentTurnPlayer.uid;
    const topCard =
      gameState.discardPile.length > 0
        ? gameState.discardPile[gameState.discardPile.length - 1]
        : null;

    if (!topCard) return;

    const timer = setTimeout(async () => {
      try {
        // Si el bot tiene 2 cartas, canta UNO preventivamente
        if (currentTurnPlayer.hand.length === 2 && !currentTurnPlayer.hasCalledUno) {
          await emitGameEvent(roomId, { uid: botUid, type: 'uno', payload: {} });
        }

        // Si ya robó carta este turno
        if (gameState.drawnCardThisTurn) {
          const drawn = gameState.drawnCardThisTurn;
          if (isCardPlayable(drawn, topCard, gameState.activeColor, 0)) {
            const colors: CardColor[] = ['green', 'red', 'blue', 'yellow'];
            const chosenColor =
              drawn.color === 'wild' || drawn.type === 'wild' || drawn.type === 'wild4'
                ? colors[Math.floor(Math.random() * colors.length)]
                : undefined;
            await emitGameEvent(roomId, {
              uid: botUid,
              type: 'play',
              payload: { cardId: drawn.id, chosenColor },
            });
          } else {
            await emitGameEvent(roomId, {
              uid: botUid,
              type: 'pass',
              payload: {},
            });
          }
          return;
        }

        // Buscar cartas jugables
        const playableCards = currentTurnPlayer.hand.filter((card) =>
          isCardPlayable(card, topCard, gameState.activeColor, gameState.accumulatedDrawCount)
        );

        if (playableCards.length > 0) {
          // Jugar una carta elegida
          const chosenCard = playableCards[0];
          const colors: CardColor[] = ['green', 'red', 'blue', 'yellow'];
          const chosenColor =
            chosenCard.color === 'wild' || chosenCard.type === 'wild' || chosenCard.type === 'wild4'
              ? colors[Math.floor(Math.random() * colors.length)]
              : undefined;

          await emitGameEvent(roomId, {
            uid: botUid,
            type: 'play',
            payload: { cardId: chosenCard.id, chosenColor },
          });
        } else {
          // No tiene carta: robar
          await emitGameEvent(roomId, {
            uid: botUid,
            type: 'draw',
            payload: {},
          });
        }
      } catch (err) {
        console.warn('Error en turno del bot:', err);
      }
    }, 1100);

    return () => clearTimeout(timer);
  }, [
    roomId,
    isHost,
    gameState.status,
    gameState.currentTurnIndex,
    gameState.pendingColorPlayerId,
    gameState.drawnCardThisTurn,
    gameState.accumulatedDrawCount,
    gameState.activeColor,
    gameState.discardPile,
    gameState.players,
  ]);

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
    disqualifyPlayer,
    requestRematch,
    exitRoom,
    addBot,
    removeBot,
  };
}
