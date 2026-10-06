import { Card, CardColor } from '../types/card';
import { GameState, PlayerState, PendingChallenge } from '../types/game';
import { GameEvent, StartEventPayload, PlayEventPayload, ChooseColorEventPayload, CatchUnoEventPayload, RematchEventPayload } from '../types/event';
import { generateFullDeck } from './deckGenerator';
import { createPRNG, shuffleArray } from './prng';
import { isCardPlayable, getNextPlayerIndex, isWild4ChallengeSuccessful } from './rules';

export function createInitialState(): GameState {
  return {
    status: 'waiting',
    seed: 0,
    players: [],
    currentTurnIndex: 0,
    direction: 1,
    deck: [],
    discardPile: [],
    activeColor: 'green',
    pendingColorPlayerId: null,
    pendingChallenge: null,
    drawnCardThisTurn: null,
    reshuffleCount: 0,
    winnerUid: null,
    helpMode: false,
    lastAction: null,
    unoVulnerableUids: [],
  };
}

/**
 * Función auxiliar para robar N cartas del mazo de forma determinista.
 * Si el mazo se agota, re-baraja la pila de descarte (excepto la carta superior)
 * usando createPRNG(seed + reshuffleCount * 10007).
 */
function drawCardsDeterministically(
  state: GameState,
  count: number
): { drawn: Card[]; nextDeck: Card[]; nextDiscard: Card[]; nextReshuffleCount: number } {
  let currentDeck = [...state.deck];
  let currentDiscard = [...state.discardPile];
  let reshuffleCount = state.reshuffleCount;
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      if (currentDiscard.length > 1) {
        // Conservar la carta superior de descarte en la mesa
        const topDiscard = currentDiscard[currentDiscard.length - 1];
        const cardsToReshuffle = currentDiscard.slice(0, currentDiscard.length - 1);
        
        reshuffleCount++;
        const prng = createPRNG(state.seed + reshuffleCount * 10007);
        currentDeck = shuffleArray(cardsToReshuffle, prng);
        currentDiscard = [topDiscard];
      } else {
        // No hay más cartas disponibles
        break;
      }
    }

    if (currentDeck.length > 0) {
      const card = currentDeck.pop()!;
      drawn.push(card);
    }
  }

  return {
    drawn,
    nextDeck: currentDeck,
    nextDiscard: currentDiscard,
    nextReshuffleCount: reshuffleCount,
  };
}

/**
 * REDUCER PURO Y DETERMINISTA.
 * reduce(estado, evento) -> nuevoEstado
 * Sin Firebase, sin React, sin Math.random(), sin Date.now().
 */
export function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'start': {
      const payload = event.payload as StartEventPayload;
      if (!payload || !payload.players || payload.players.length < 2 || payload.players.length > 5) {
        return state; // Evento ilegal: ignorado
      }

      const seed = payload.seed || 12345;
      const prng = createPRNG(seed);
      let fullDeck = shuffleArray(generateFullDeck(), prng);

      // Repartir 7 cartas a cada jugador
      const players: PlayerState[] = payload.players.map((p) => {
        const hand = fullDeck.splice(fullDeck.length - 7, 7);
        return {
          uid: p.uid,
          name: p.name,
          avatar: p.avatar,
          hand,
          hasCalledUno: false,
        };
      });

      // Extraer carta inicial volteada del mazo
      // Si la carta es Wild4, se regresa al mazo hasta voltear una que no sea Wild4
      let topCardIndex = fullDeck.length - 1;
      while (topCardIndex >= 0 && fullDeck[topCardIndex].type === 'wild4') {
        // Mover al fondo y probar la siguiente
        const wild4 = fullDeck.pop()!;
        fullDeck.unshift(wild4);
        topCardIndex = fullDeck.length - 1;
      }

      const openingCard = fullDeck.pop()!;
      const discardPile = [openingCard];

      let activeColor: CardColor = openingCard.color !== 'wild' ? openingCard.color : 'green';
      let currentTurnIndex = 0;
      let direction: 1 | -1 = 1;
      let pendingColorPlayerId: string | null = null;
      let status: GameState['status'] = 'playing';

      // Efecto de la carta inicial según las reglas oficiales de UNO
      if (openingCard.type === 'number') {
        currentTurnIndex = 0;
      } else if (openingCard.type === 'skip') {
        currentTurnIndex = getNextPlayerIndex(0, players.length, 1, 1); // Salta al primer jugador
      } else if (openingCard.type === 'reverse') {
        if (players.length === 2) {
          currentTurnIndex = 1; // En 2 jugadores salta al primero
        } else {
          direction = -1;
          currentTurnIndex = players.length - 1; // Juega el de la derecha
        }
      } else if (openingCard.type === 'draw2') {
        // El primer jugador roba 2 cartas y es saltado
        const drawResult = drawCardsDeterministically(
          { ...createInitialState(), deck: fullDeck, discardPile, seed },
          2
        );
        players[0].hand.push(...drawResult.drawn);
        fullDeck = drawResult.nextDeck;
        currentTurnIndex = getNextPlayerIndex(0, players.length, 1, 1);
      } else if (openingCard.type === 'wild') {
        // El primer jugador elige el color inicial
        status = 'pendingColor';
        pendingColorPlayerId = players[0].uid;
      }

      return {
        ...state,
        status,
        seed,
        players,
        currentTurnIndex,
        direction,
        deck: fullDeck,
        discardPile,
        activeColor,
        pendingColorPlayerId,
        pendingChallenge: null,
        drawnCardThisTurn: null,
        reshuffleCount: 0,
        winnerUid: null,
        helpMode: !!payload.helpMode,
        lastAction: `Partida iniciada. Carta inicial: ${openingCard.variable}`,
        unoVulnerableUids: [],
      };
    }

    case 'play': {
      if (state.status !== 'playing') return state;

      const playerIndex = state.currentTurnIndex;
      const player = state.players[playerIndex];
      if (!player || player.uid !== event.uid) return state; // No es el turno de este jugador

      const payload = event.payload as PlayEventPayload;
      const cardIndex = player.hand.findIndex((c) => c.id === payload.cardId);
      if (cardIndex === -1) return state; // No tiene la carta

      const cardToPlay = player.hand[cardIndex];

      // Si robó carta este turno, SOLO puede jugar la carta que robó
      if (state.drawnCardThisTurn && state.drawnCardThisTurn.id !== cardToPlay.id) {
        return state;
      }

      const topCard = state.discardPile[state.discardPile.length - 1];
      if (!isCardPlayable(cardToPlay, topCard, state.activeColor)) {
        return state; // Jugada ilegal
      }

      // Remover la carta de la mano del jugador
      const nextHand = [...player.hand];
      nextHand.splice(cardIndex, 1);

      // Gestión de UNO: Si le queda 1 carta y no cantó UNO, queda vulnerable
      const unoVulnerableUids = [...state.unoVulnerableUids];
      if (nextHand.length === 1 && !player.hasCalledUno) {
        if (!unoVulnerableUids.includes(player.uid)) {
          unoVulnerableUids.push(player.uid);
        }
      }

      // Actualizar jugadores
      const nextPlayers = state.players.map((p, idx) => {
        if (idx === playerIndex) {
          return {
            ...p,
            hand: nextHand,
            hasCalledUno: nextHand.length === 1 && p.hasCalledUno,
          };
        }
        return p;
      });

      // Poner la carta en la pila de descarte
      const nextDiscardPile = [...state.discardPile, cardToPlay];

      // Verificar si ganó la partida
      if (nextHand.length === 0) {
        return {
          ...state,
          status: 'finished',
          players: nextPlayers,
          discardPile: nextDiscardPile,
          winnerUid: player.uid,
          drawnCardThisTurn: null,
          lastAction: `¡${player.name} se quedó sin cartas y ha ganado la partida!`,
        };
      }

      // Efectos según el tipo de carta jugada
      let nextActiveColor = cardToPlay.color !== 'wild' ? cardToPlay.color : state.activeColor;
      let nextTurnIndex = playerIndex;
      let nextDirection = state.direction;
      let nextStatus: GameState['status'] = 'playing';
      let pendingColorPlayerId: string | null = null;
      let pendingChallenge: PendingChallenge | null = null;
      let nextDeck = [...state.deck];
      let nextReshuffleCount = state.reshuffleCount;

      if (cardToPlay.type === 'number') {
        nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
      } else if (cardToPlay.type === 'skip') {
        // Salta al siguiente jugador
        nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 2);
      } else if (cardToPlay.type === 'reverse') {
        if (state.players.length === 2) {
          // En 2 jugadores actúa como bloqueo: vuelve a jugar el mismo jugador
          nextTurnIndex = playerIndex;
        } else {
          nextDirection = (nextDirection * -1) as 1 | -1;
          nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        }
      } else if (cardToPlay.type === 'draw2') {
        // Siguiente jugador roba 2 cartas y es saltado
        const targetPlayerIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        const drawResult = drawCardsDeterministically(
          { ...state, deck: nextDeck, discardPile: nextDiscardPile, reshuffleCount: nextReshuffleCount },
          2
        );
        nextDeck = drawResult.nextDeck;
        nextReshuffleCount = drawResult.nextReshuffleCount;
        nextPlayers[targetPlayerIndex].hand.push(...drawResult.drawn);

        // Turno pasa después del jugador saltado
        nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 2);
      } else if (cardToPlay.type === 'wild') {
        if (payload.chosenColor && payload.chosenColor !== 'wild') {
          nextActiveColor = payload.chosenColor;
          nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        } else {
          nextStatus = 'pendingColor';
          pendingColorPlayerId = player.uid;
        }
      } else if (cardToPlay.type === 'wild4') {
        // Entra en estado de Desafío para el siguiente jugador
        const targetPlayerIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        const targetPlayer = state.players[targetPlayerIndex];

        nextStatus = 'pendingChallenge';
        pendingChallenge = {
          wild4Card: cardToPlay,
          playedByUid: player.uid,
          targetUid: targetPlayer.uid,
          activeColorBeforeWild4: state.activeColor,
          handBeforePlay: player.hand,
        };

        if (payload.chosenColor && payload.chosenColor !== 'wild') {
          nextActiveColor = payload.chosenColor;
        }
      }

      return {
        ...state,
        status: nextStatus,
        players: nextPlayers,
        deck: nextDeck,
        discardPile: nextDiscardPile,
        currentTurnIndex: nextTurnIndex,
        direction: nextDirection,
        activeColor: nextActiveColor,
        pendingColorPlayerId,
        pendingChallenge,
        drawnCardThisTurn: null,
        reshuffleCount: nextReshuffleCount,
        unoVulnerableUids,
        lastAction: `${player.name} jugó ${cardToPlay.variable}`,
      };
    }

    case 'chooseColor': {
      if (state.status !== 'pendingColor') return state;
      if (state.pendingColorPlayerId !== event.uid) return state;

      const payload = event.payload as ChooseColorEventPayload;
      if (!payload.color || payload.color === 'wild') return state;

      const nextTurnIndex = getNextPlayerIndex(state.currentTurnIndex, state.players.length, state.direction, 1);

      return {
        ...state,
        status: 'playing',
        activeColor: payload.color,
        pendingColorPlayerId: null,
        currentTurnIndex: nextTurnIndex,
        lastAction: `Color activo cambiado a ${payload.color}`,
      };
    }

    case 'accept+4': {
      if (state.status !== 'pendingChallenge' || !state.pendingChallenge) return state;
      if (state.pendingChallenge.targetUid !== event.uid) return state;

      const targetPlayerIndex = state.players.findIndex((p) => p.uid === event.uid);
      const drawResult = drawCardsDeterministically(state, 4);

      const nextPlayers = state.players.map((p, idx) => {
        if (idx === targetPlayerIndex) {
          return { ...p, hand: [...p.hand, ...drawResult.drawn] };
        }
        return p;
      });

      // El turno avanza saltando al jugador que robó
      const nextTurnIndex = getNextPlayerIndex(targetPlayerIndex, state.players.length, state.direction, 1);

      return {
        ...state,
        status: 'playing',
        players: nextPlayers,
        deck: drawResult.nextDeck,
        discardPile: drawResult.nextDiscard,
        reshuffleCount: drawResult.nextReshuffleCount,
        pendingChallenge: null,
        currentTurnIndex: nextTurnIndex,
        lastAction: `${state.players[targetPlayerIndex].name} aceptó el +4 y roba 4 cartas`,
      };
    }

    case 'challenge+4': {
      if (state.status !== 'pendingChallenge' || !state.pendingChallenge) return state;
      if (state.pendingChallenge.targetUid !== event.uid) return state;

      const { playedByUid, targetUid, handBeforePlay, activeColorBeforeWild4 } = state.pendingChallenge;
      const isIllegal = isWild4ChallengeSuccessful(handBeforePlay, activeColorBeforeWild4);

      const challengerIndex = state.players.findIndex((p) => p.uid === targetUid);
      const playedByIndex = state.players.findIndex((p) => p.uid === playedByUid);

      let nextPlayers = [...state.players];
      let nextDeck = state.deck;
      let nextDiscard = state.discardPile;
      let nextReshuffleCount = state.reshuffleCount;
      let nextTurnIndex = challengerIndex;

      if (isIllegal) {
        // Desafío Exitoso: El desafiado jugó el +4 teniendo el color activo. Roba 4 cartas él.
        const drawResult = drawCardsDeterministically(state, 4);
        nextDeck = drawResult.nextDeck;
        nextDiscard = drawResult.nextDiscard;
        nextReshuffleCount = drawResult.nextReshuffleCount;

        nextPlayers = nextPlayers.map((p, idx) => {
          if (idx === playedByIndex) {
            return { ...p, hand: [...p.hand, ...drawResult.drawn] };
          }
          return p;
        });

        // El retador juega su turno normal
        nextTurnIndex = challengerIndex;
      } else {
        // Desafío Fallido: El desafiado no tenía el color activo. El retador roba 6 (4 + 2 penalización) y es saltado.
        const drawResult = drawCardsDeterministically(state, 6);
        nextDeck = drawResult.nextDeck;
        nextDiscard = drawResult.nextDiscard;
        nextReshuffleCount = drawResult.nextReshuffleCount;

        nextPlayers = nextPlayers.map((p, idx) => {
          if (idx === challengerIndex) {
            return { ...p, hand: [...p.hand, ...drawResult.drawn] };
          }
          return p;
        });

        // Retador pierde su turno
        nextTurnIndex = getNextPlayerIndex(challengerIndex, state.players.length, state.direction, 1);
      }

      return {
        ...state,
        status: 'playing',
        players: nextPlayers,
        deck: nextDeck,
        discardPile: nextDiscard,
        reshuffleCount: nextReshuffleCount,
        pendingChallenge: null,
        currentTurnIndex: nextTurnIndex,
        lastAction: isIllegal
          ? `¡Desafío exitoso! ${state.players[playedByIndex].name} cometió infracción y roba 4 cartas.`
          : `Desafío fallido. ${state.players[challengerIndex].name} roba 6 cartas y pierde el turno.`,
      };
    }

    case 'draw': {
      if (state.status !== 'playing') return state;
      if (state.players[state.currentTurnIndex]?.uid !== event.uid) return state;
      if (state.drawnCardThisTurn) return state; // Ya robó este turno

      const drawResult = drawCardsDeterministically(state, 1);
      if (drawResult.drawn.length === 0) return state; // No hay cartas

      const drawnCard = drawResult.drawn[0];
      const playerIndex = state.currentTurnIndex;
      const topCard = state.discardPile[state.discardPile.length - 1];

      const nextPlayers = state.players.map((p, idx) => {
        if (idx === playerIndex) {
          return { ...p, hand: [...p.hand, drawnCard] };
        }
        return p;
      });

      const isPlayable = isCardPlayable(drawnCard, topCard, state.activeColor);

      if (isPlayable) {
        // Puede jugarla o pasar
        return {
          ...state,
          players: nextPlayers,
          deck: drawResult.nextDeck,
          discardPile: drawResult.nextDiscard,
          reshuffleCount: drawResult.nextReshuffleCount,
          drawnCardThisTurn: drawnCard,
          lastAction: `${state.players[playerIndex].name} robó una carta jugable`,
        };
      }

      // Si no es jugable, pasa automáticamente el turno
      const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);

      return {
        ...state,
        players: nextPlayers,
        deck: drawResult.nextDeck,
        discardPile: drawResult.nextDiscard,
        reshuffleCount: drawResult.nextReshuffleCount,
        currentTurnIndex: nextTurnIndex,
        drawnCardThisTurn: null,
        lastAction: `${state.players[playerIndex].name} robó carta y pasó turno`,
      };
    }

    case 'pass': {
      if (state.status !== 'playing') return state;
      if (state.players[state.currentTurnIndex]?.uid !== event.uid) return state;
      if (!state.drawnCardThisTurn) return state; // Solo puede pasar si ya robó

      const nextTurnIndex = getNextPlayerIndex(state.currentTurnIndex, state.players.length, state.direction, 1);

      return {
        ...state,
        currentTurnIndex: nextTurnIndex,
        drawnCardThisTurn: null,
        lastAction: `${state.players[state.currentTurnIndex].name} decidió no jugar la carta robada`,
      };
    }

    case 'uno': {
      // Un jugador canta UNO
      const playerIndex = state.players.findIndex((p) => p.uid === event.uid);
      if (playerIndex === -1) return state;

      const player = state.players[playerIndex];
      // Si tiene 1 carta o 2 cartas (para pre-cantar), se protege
      if (player.hand.length > 2) return state;

      const nextPlayers = state.players.map((p, idx) => {
        if (idx === playerIndex) {
          return { ...p, hasCalledUno: true };
        }
        return p;
      });

      const unoVulnerableUids = state.unoVulnerableUids.filter((uid) => uid !== player.uid);

      return {
        ...state,
        players: nextPlayers,
        unoVulnerableUids,
        lastAction: `¡${player.name} cantó UNO!`,
      };
    }

    case 'catchUno': {
      const payload = event.payload as CatchUnoEventPayload;
      if (!payload || !payload.targetUid) return state;
      if (payload.targetUid === event.uid) return state; // No te puedes atrapar a ti mismo

      if (!state.unoVulnerableUids.includes(payload.targetUid)) return state;

      const targetPlayerIndex = state.players.findIndex((p) => p.uid === payload.targetUid);
      if (targetPlayerIndex === -1) return state;

      const targetPlayer = state.players[targetPlayerIndex];
      if (targetPlayer.hand.length !== 1) return state;

      // Penalización: El jugador atrapado roba 2 cartas
      const drawResult = drawCardsDeterministically(state, 2);
      const nextPlayers = state.players.map((p, idx) => {
        if (idx === targetPlayerIndex) {
          return { ...p, hand: [...p.hand, ...drawResult.drawn], hasCalledUno: false };
        }
        return p;
      });

      const unoVulnerableUids = state.unoVulnerableUids.filter((uid) => uid !== payload.targetUid);

      return {
        ...state,
        players: nextPlayers,
        deck: drawResult.nextDeck,
        discardPile: drawResult.nextDiscard,
        reshuffleCount: drawResult.nextReshuffleCount,
        unoVulnerableUids,
        lastAction: `¡${targetPlayer.name} fue atrapado sin cantar UNO! Roba 2 cartas de penalización`,
      };
    }

    case 'skipTimeout': {
      if (state.status !== 'playing') return state;
      const playerIndex = state.currentTurnIndex;
      const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);

      return {
        ...state,
        currentTurnIndex: nextTurnIndex,
        drawnCardThisTurn: null,
        lastAction: `Turno de ${state.players[playerIndex].name} saltado por inactividad`,
      };
    }

    case 'rematch': {
      const payload = event.payload as RematchEventPayload;
      const rematchEvent: GameEvent = {
        seq: 1,
        uid: event.uid,
        type: 'start',
        payload: {
          seed: payload.seed || state.seed + 1,
          players: state.players.map((p) => ({ uid: p.uid, name: p.name, avatar: p.avatar })),
          helpMode: state.helpMode,
        },
      };
      return gameReducer(createInitialState(), rematchEvent);
    }

    default:
      return state;
  }
}
