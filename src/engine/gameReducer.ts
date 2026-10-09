import { Card, CardColor } from '../types/card';
import { GameState, PlayerState } from '../types/game';
import { GameEvent, StartEventPayload, PlayEventPayload, ChooseColorEventPayload, CatchUnoEventPayload, RematchEventPayload, PlayerLeftEventPayload } from '../types/event';
import { generateFullDeck } from './deckGenerator';
import { createPRNG, shuffleArray } from './prng';
import { isCardPlayable, getNextPlayerIndex } from './rules';

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
    accumulatedDrawCount: 0,
    drawnCardThisTurn: null,
    reshuffleCount: 0,
    winnerUid: null,
    helpMode: false,
    lastAction: null,
    unoVulnerableUids: [],
    blockedPlayerUid: null,
    actionCounter: 0,
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
      if (!payload || !payload.players || payload.players.length < 2 || payload.players.length > 6) {
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
        // En carta inicial, el primer jugador roba 2 cartas y es saltado
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
        accumulatedDrawCount: 0,
        drawnCardThisTurn: null,
        reshuffleCount: 0,
        winnerUid: null,
        helpMode: !!payload.helpMode,
        lastAction: `Partida iniciada. Carta inicial: ${openingCard.variable}`,
        unoVulnerableUids: [],
        blockedPlayerUid: null,
        actionCounter: 0,
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

      const topCard = state.discardPile[state.discardPile.length - 1];
      if (!isCardPlayable(cardToPlay, topCard, state.activeColor, state.accumulatedDrawCount)) {
        // En Modo Sin Ayuda: Si lanza una carta errónea (ej. creyendo que coincide),
        // recibe una penalización de 2 cartas y se le skipea el turno.
        if (!state.helpMode) {
          const penaltyDraw = drawCardsDeterministically(state, 2);
          const nextPlayers = state.players.map((p, idx) => {
            if (idx === playerIndex) {
              return {
                ...p,
                hand: [...p.hand, ...penaltyDraw.drawn],
                hasCalledUno: false,
              };
            }
            return p;
          });

          const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);
          const nextActionCounter = (state.actionCounter || 0) + 1;

          return {
            ...state,
            players: nextPlayers,
            deck: penaltyDraw.nextDeck,
            discardPile: penaltyDraw.nextDiscard,
            reshuffleCount: penaltyDraw.nextReshuffleCount,
            currentTurnIndex: nextTurnIndex,
            drawnCardThisTurn: null,
            lastAction: `¡${player.name} cometió un error de cálculo con ${cardToPlay.variable}! Come 2 cartas y pierde su turno.`,
            blockedPlayerUid: null,
            actionCounter: nextActionCounter,
          };
        }
        return state; // Jugada ilegal bloqueada en Modo Ayuda
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
      let nextPlayers = state.players.map((p, idx) => {
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
      let nextDiscardPile = [...state.discardPile, cardToPlay];

      // Verificar si ganó la partida (mano vacía)
      if (nextHand.length === 0) {
        return {
          ...state,
          status: 'finished',
          players: nextPlayers,
          discardPile: nextDiscardPile,
          winnerUid: player.uid,
          accumulatedDrawCount: 0,
          drawnCardThisTurn: null,
          lastAction: `¡${player.name} se quedó sin cartas y ha ganado la partida!`,
          blockedPlayerUid: null,
          actionCounter: (state.actionCounter || 0) + 1,
        };
      }

      // Efectos según el tipo de carta jugada
      let nextActiveColor = cardToPlay.color !== 'wild' ? cardToPlay.color : state.activeColor;
      let nextTurnIndex = playerIndex;
      let nextDirection = state.direction;
      let nextStatus: GameState['status'] = 'playing';
      let pendingColorPlayerId: string | null = null;
      let nextAccumulatedDrawCount = state.accumulatedDrawCount;
      let nextDeck = [...state.deck];
      let nextReshuffleCount = state.reshuffleCount;
      let blockedVictimUid: string | null = null;

      if (cardToPlay.type === 'number') {
        nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
      } else if (cardToPlay.type === 'skip') {
        // Salta al siguiente jugador y marca su UID para notificación exclusiva
        const victimIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        blockedVictimUid = state.players[victimIndex]?.uid || null;
        nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 2);
      } else if (cardToPlay.type === 'reverse') {
        if (state.players.length === 2) {
          // En 2 jugadores actúa como bloqueo: vuelve a jugar el mismo jugador
          const victimIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
          blockedVictimUid = state.players[victimIndex]?.uid || null;
          nextTurnIndex = playerIndex;
        } else {
          nextDirection = (nextDirection * -1) as 1 | -1;
          nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        }
      } else if (cardToPlay.type === 'draw2') {
        const victimIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        const victim = nextPlayers[victimIndex];
        const victimCanDefend = victim.hand.some((c) => c.type === 'draw2' || c.type === 'wild4');

        if (victimCanDefend) {
          nextTurnIndex = victimIndex;
          nextAccumulatedDrawCount = (state.accumulatedDrawCount || 0) + 2;
        } else {
          const countToEat = (state.accumulatedDrawCount || 0) + 2;
          const drawResult = drawCardsDeterministically(
            { ...state, deck: nextDeck, discardPile: nextDiscardPile, reshuffleCount: nextReshuffleCount },
            countToEat
          );
          nextDeck = drawResult.nextDeck;
          nextDiscardPile = drawResult.nextDiscard;
          nextReshuffleCount = drawResult.nextReshuffleCount;

          nextPlayers = nextPlayers.map((p, idx) => {
            if (idx === victimIndex) {
              return { ...p, hand: [...p.hand, ...drawResult.drawn], hasCalledUno: false };
            }
            return p;
          });

          nextTurnIndex = getNextPlayerIndex(victimIndex, state.players.length, nextDirection, 1);
          nextAccumulatedDrawCount = 0;
        }
      } else if (cardToPlay.type === 'wild') {
        if (payload.chosenColor && payload.chosenColor !== 'wild') {
          nextActiveColor = payload.chosenColor;
          nextDiscardPile[nextDiscardPile.length - 1] = {
            ...cardToPlay,
            color: payload.chosenColor,
          };
          nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
        } else {
          nextStatus = 'pendingColor';
          pendingColorPlayerId = player.uid;
        }
      } else if (cardToPlay.type === 'wild4') {
        if (payload.chosenColor && payload.chosenColor !== 'wild') {
          nextActiveColor = payload.chosenColor;
          nextDiscardPile[nextDiscardPile.length - 1] = {
            ...cardToPlay,
            color: payload.chosenColor,
          };
          const victimIndex = getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1);
          const victim = nextPlayers[victimIndex];
          const victimCanDefend = victim.hand.some((c) => c.type === 'draw2' || c.type === 'wild4');

          if (victimCanDefend) {
            nextTurnIndex = victimIndex;
            nextAccumulatedDrawCount = (state.accumulatedDrawCount || 0) + 4;
          } else {
            const countToEat = (state.accumulatedDrawCount || 0) + 4;
            const drawResult = drawCardsDeterministically(
              { ...state, deck: nextDeck, discardPile: nextDiscardPile, reshuffleCount: nextReshuffleCount },
              countToEat
            );
            nextDeck = drawResult.nextDeck;
            nextDiscardPile = drawResult.nextDiscard;
            nextReshuffleCount = drawResult.nextReshuffleCount;

            nextPlayers = nextPlayers.map((p, idx) => {
              if (idx === victimIndex) {
                return { ...p, hand: [...p.hand, ...drawResult.drawn], hasCalledUno: false };
              }
              return p;
            });

            nextTurnIndex = getNextPlayerIndex(victimIndex, state.players.length, nextDirection, 1);
            nextAccumulatedDrawCount = 0;
          }
        } else {
          nextStatus = 'pendingColor';
          pendingColorPlayerId = player.uid;
        }
      }

      let lastActionMsg = `${player.name} jugó ${cardToPlay.variable}`;
      if (cardToPlay.type === 'skip') {
        const victim = state.players[getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1)];
        lastActionMsg = `${player.name} jugó Bloqueo. ¡${victim.name} ha sido bloqueado!`;
      } else if (cardToPlay.type === 'reverse') {
        if (state.players.length === 2) {
          const victim = state.players[getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1)];
          lastActionMsg = `${player.name} jugó Reversa. ¡${victim.name} ha sido bloqueado!`;
        } else {
          const dirText = nextDirection === 1 ? 'Horario (↻)' : 'Antihorario (↺)';
          lastActionMsg = `${player.name} jugó Reversa. ¡Sentido cambiado a ${dirText}!`;
        }
      } else if (cardToPlay.type === 'draw2') {
        const victim = state.players[getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1)];
        if (nextAccumulatedDrawCount > 0) {
          lastActionMsg = `${player.name} jugó +2. ¡${victim.name} puede responder con +2/+4 o comer +${nextAccumulatedDrawCount}!`;
        } else {
          lastActionMsg = `${player.name} jugó +2. ¡${victim.name} comió ${(state.accumulatedDrawCount || 0) + 2} cartas y pierde su turno!`;
        }
      } else if (cardToPlay.type === 'wild4' && payload.chosenColor && payload.chosenColor !== 'wild') {
        const victim = state.players[getNextPlayerIndex(playerIndex, state.players.length, nextDirection, 1)];
        if (nextAccumulatedDrawCount > 0) {
          lastActionMsg = `${player.name} jugó +4 (${payload.chosenColor}). ¡${victim.name} puede responder con +2/+4 o comer +${nextAccumulatedDrawCount}!`;
        } else {
          lastActionMsg = `${player.name} jugó +4 (${payload.chosenColor}). ¡${victim.name} comió ${(state.accumulatedDrawCount || 0) + 4} cartas y pierde su turno!`;
        }
      } else if (cardToPlay.type === 'wild' && payload.chosenColor && payload.chosenColor !== 'wild') {
        lastActionMsg = `${player.name} jugó Comodín y cambió el color a ${payload.chosenColor}`;
      } else if (nextAccumulatedDrawCount > 0) {
        lastActionMsg = `${player.name} jugó ${cardToPlay.variable} (Acumulado: +${nextAccumulatedDrawCount})`;
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
        accumulatedDrawCount: nextAccumulatedDrawCount,
        drawnCardThisTurn: null,
        reshuffleCount: nextReshuffleCount,
        unoVulnerableUids,
        lastAction: lastActionMsg,
        blockedPlayerUid: blockedVictimUid,
        actionCounter: (state.actionCounter || 0) + 1,
      };
    }

    case 'chooseColor': {
      if (state.status !== 'pendingColor') return state;
      if (state.pendingColorPlayerId !== event.uid) return state;

      const payload = event.payload as ChooseColorEventPayload;
      if (!payload.color || payload.color === 'wild') return state;

      const topCard = state.discardPile[state.discardPile.length - 1];
      const playerIndex = state.players.findIndex((p) => p.uid === event.uid);
      const player = state.players[playerIndex];
      if (!player) return state;

      let nextDeck = [...state.deck];
      let nextDiscardPile = [...state.discardPile];
      let nextReshuffleCount = state.reshuffleCount;
      let nextPlayers = [...state.players];
      let nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);
      let nextAccumulatedDrawCount = 0;
      let lastActionMsg = `${player.name} eligió el color ${payload.color}`;

      // Actualizar el color en la carta superior de descarte para que coincida visualmente
      if (topCard && (topCard.type === 'wild' || topCard.type === 'wild4')) {
        nextDiscardPile[nextDiscardPile.length - 1] = {
          ...topCard,
          color: payload.color,
        };
      }

      // Si la carta recién jugada era un comodín +4 (wild4):
      if (topCard && topCard.type === 'wild4') {
        const victimIndex = nextTurnIndex;
        const victim = nextPlayers[victimIndex];
        const victimCanDefend = victim.hand.some((c) => c.type === 'draw2' || c.type === 'wild4');

        if (victimCanDefend) {
          nextTurnIndex = victimIndex;
          nextAccumulatedDrawCount = (state.accumulatedDrawCount || 0) + 4;
          lastActionMsg = `${player.name} eligió ${payload.color} (+4). ¡${victim.name} puede responder con +2/+4 o comer +${nextAccumulatedDrawCount}!`;
        } else {
          const countToEat = (state.accumulatedDrawCount || 0) + 4;
          const drawResult = drawCardsDeterministically(
            { ...state, deck: nextDeck, discardPile: nextDiscardPile, reshuffleCount: nextReshuffleCount },
            countToEat
          );
          nextDeck = drawResult.nextDeck;
          nextDiscardPile = drawResult.nextDiscard;
          nextReshuffleCount = drawResult.nextReshuffleCount;

          nextPlayers = nextPlayers.map((p, idx) => {
            if (idx === victimIndex) {
              return { ...p, hand: [...p.hand, ...drawResult.drawn], hasCalledUno: false };
            }
            return p;
          });

          nextTurnIndex = getNextPlayerIndex(victimIndex, state.players.length, state.direction, 1);
          nextAccumulatedDrawCount = 0;
          lastActionMsg = `${player.name} eligió ${payload.color} (+4). ¡${victim.name} comió ${countToEat} cartas y pierde su turno!`;
        }
      }

      return {
        ...state,
        status: 'playing',
        activeColor: payload.color,
        pendingColorPlayerId: null,
        players: nextPlayers,
        deck: nextDeck,
        discardPile: nextDiscardPile,
        reshuffleCount: nextReshuffleCount,
        currentTurnIndex: nextTurnIndex,
        accumulatedDrawCount: nextAccumulatedDrawCount,
        lastAction: lastActionMsg,
        blockedPlayerUid: null,
        actionCounter: (state.actionCounter || 0) + 1,
      };
    }

    case 'draw': {
      if (state.status !== 'playing') return state;
      const playerIndex = state.currentTurnIndex;
      const player = state.players[playerIndex];
      if (!player || player.uid !== event.uid) return state;
      if (state.drawnCardThisTurn) return state; // Ya robó este turno

      // Si hay cartas acumuladas pendientes (+2 o +4) y el jugador roba (no se defiende con otro +2 o +4):
      if (state.accumulatedDrawCount > 0) {
        const countToDraw = state.accumulatedDrawCount;
        const drawResult = drawCardsDeterministically(state, countToDraw);

        const nextPlayers = state.players.map((p, idx) => {
          if (idx === playerIndex) {
            return { ...p, hand: [...p.hand, ...drawResult.drawn] };
          }
          return p;
        });

        // Al comerse la penalización acumulada, el jugador es saltado y pierde el turno
        const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);

        return {
          ...state,
          players: nextPlayers,
          deck: drawResult.nextDeck,
          discardPile: drawResult.nextDiscard,
          reshuffleCount: drawResult.nextReshuffleCount,
          accumulatedDrawCount: 0,
          currentTurnIndex: nextTurnIndex,
          drawnCardThisTurn: null,
          lastAction: `${player.name} no se defendió y robó ${countToDraw} cartas acumuladas`,
          blockedPlayerUid: null,
          actionCounter: (state.actionCounter || 0) + 1,
        };
      }

      // Turno normal sin cartas acumuladas: "Come hasta que pueda lanzar"
      // Roba sucesivamente del mazo hasta obtener una carta que sea jugable
      const drawnCards: Card[] = [];
      let foundPlayableCard: Card | null = null;
      let currentDeck = [...state.deck];
      let currentDiscard = [...state.discardPile];
      let currentReshuffleCount = state.reshuffleCount;
      const topCard = state.discardPile[state.discardPile.length - 1];

      // Límite de seguridad de 108 iteraciones para evitar bucles si no hay coincidencia posible
      const MAX_DRAW_ATTEMPTS = 108;
      let attempts = 0;

      while (!foundPlayableCard && attempts < MAX_DRAW_ATTEMPTS) {
        attempts++;
        const drawResult = drawCardsDeterministically(
          { ...state, deck: currentDeck, discardPile: currentDiscard, reshuffleCount: currentReshuffleCount },
          1
        );
        if (drawResult.drawn.length === 0) {
          // No hay más cartas disponibles en el mazo ni en descarte
          break;
        }

        const drawnCard = drawResult.drawn[0];
        drawnCards.push(drawnCard);
        currentDeck = drawResult.nextDeck;
        currentDiscard = drawResult.nextDiscard;
        currentReshuffleCount = drawResult.nextReshuffleCount;

        if (isCardPlayable(drawnCard, topCard, state.activeColor, 0)) {
          foundPlayableCard = drawnCard;
          break;
        }
      }

      if (drawnCards.length === 0) return state;

      const nextPlayers = state.players.map((p, idx) => {
        if (idx === playerIndex) {
          return { ...p, hand: [...p.hand, ...drawnCards] };
        }
        return p;
      });

      if (foundPlayableCard) {
        // Encontró carta jugable: el jugador sigue en turno y puede lanzarla
        return {
          ...state,
          players: nextPlayers,
          deck: currentDeck,
          discardPile: currentDiscard,
          reshuffleCount: currentReshuffleCount,
          drawnCardThisTurn: foundPlayableCard,
          lastAction:
            drawnCards.length === 1
              ? `${player.name} robó 1 carta jugable`
              : `${player.name} comió ${drawnCards.length} cartas hasta que pudo lanzar`,
          blockedPlayerUid: null,
          actionCounter: (state.actionCounter || 0) + 1,
        };
      }

      // Si se agotó el mazo sin encontrar carta jugable (caso extremo de mazo vacío sin coincidencia)
      const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);
      return {
        ...state,
        players: nextPlayers,
        deck: currentDeck,
        discardPile: currentDiscard,
        reshuffleCount: currentReshuffleCount,
        currentTurnIndex: nextTurnIndex,
        drawnCardThisTurn: null,
        lastAction: `${player.name} comió ${drawnCards.length} cartas sin coincidencia y pasó turno`,
        blockedPlayerUid: null,
        actionCounter: (state.actionCounter || 0) + 1,
      };
    }

    case 'pass': {
      if (state.status !== 'playing') return state;
      if (state.players[state.currentTurnIndex]?.uid !== event.uid) return state;
      if (!state.drawnCardThisTurn || state.accumulatedDrawCount > 0) return state; // Solo puede pasar si robó en turno normal

      const nextTurnIndex = getNextPlayerIndex(state.currentTurnIndex, state.players.length, state.direction, 1);

      return {
        ...state,
        currentTurnIndex: nextTurnIndex,
        drawnCardThisTurn: null,
        lastAction: `${state.players[state.currentTurnIndex].name} decidió no jugar la carta robada`,
        blockedPlayerUid: null,
        actionCounter: (state.actionCounter || 0) + 1,
      };
    }

    case 'uno': {
      const playerIndex = state.players.findIndex((p) => p.uid === event.uid);
      if (playerIndex === -1) return state;

      const player = state.players[playerIndex];
      // Solo puede cantar UNO si le queda exactamente 1 carta
      if (player.hand.length !== 1) return state;

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
      if (payload.targetUid === event.uid) return state;

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
        blockedPlayerUid: null,
        actionCounter: (state.actionCounter || 0) + 1,
      };
    }

    case 'skipTimeout': {
      if (state.status !== 'playing') return state;
      const playerIndex = state.currentTurnIndex;
      const player = state.players[playerIndex];
      if (!player) return state;

      // Si había penalización acumulada activa, el jugador inactivo roba la penalización completa
      if (state.accumulatedDrawCount > 0) {
        const countToDraw = state.accumulatedDrawCount;
        const drawResult = drawCardsDeterministically(state, countToDraw);
        const nextPlayers = state.players.map((p, idx) => {
          if (idx === playerIndex) {
            return { ...p, hand: [...p.hand, ...drawResult.drawn] };
          }
          return p;
        });
        const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);
        return {
          ...state,
          players: nextPlayers,
          deck: drawResult.nextDeck,
          discardPile: drawResult.nextDiscard,
          reshuffleCount: drawResult.nextReshuffleCount,
          accumulatedDrawCount: 0,
          currentTurnIndex: nextTurnIndex,
          drawnCardThisTurn: null,
          lastAction: `${player.name} tardó demasiado y robó ${countToDraw} cartas acumuladas`,
          blockedPlayerUid: null,
          actionCounter: (state.actionCounter || 0) + 1,
        };
      }

      const nextTurnIndex = getNextPlayerIndex(playerIndex, state.players.length, state.direction, 1);
      return {
        ...state,
        currentTurnIndex: nextTurnIndex,
        drawnCardThisTurn: null,
        lastAction: `Turno de ${player.name} saltado por inactividad`,
        blockedPlayerUid: null,
        actionCounter: (state.actionCounter || 0) + 1,
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

    case 'playerLeft': {
      if (state.status !== 'playing' && state.status !== 'pendingColor') return state;
      const payload = event.payload as PlayerLeftEventPayload;
      const leavingUid = payload?.leavingUid || event.uid;

      const leavingPlayerIndex = state.players.findIndex((p) => p.uid === leavingUid);
      if (leavingPlayerIndex === -1) return state;

      const leavingPlayer = state.players[leavingPlayerIndex];
      const nextPlayers = state.players.filter((p) => p.uid !== leavingUid);

      // Si queda 1 solo jugador: victoria automática por abandono
      if (nextPlayers.length <= 1) {
        const remainingWinner = nextPlayers[0];
        return {
          ...state,
          status: 'finished',
          players: nextPlayers,
          winnerUid: remainingWinner ? remainingWinner.uid : null,
          accumulatedDrawCount: 0,
          drawnCardThisTurn: null,
          lastAction: remainingWinner
            ? `¡${remainingWinner.name} gana la partida! (${leavingPlayer.name} ha abandonado la partida).`
            : `${leavingPlayer.name} ha abandonado la partida.`,
        };
      }

      // Si quedan 2 o más jugadores: reacomodar el turno
      let nextTurnIndex = state.currentTurnIndex;
      if (leavingPlayerIndex < nextTurnIndex) {
        nextTurnIndex = (nextTurnIndex - 1) % nextPlayers.length;
      } else if (leavingPlayerIndex === nextTurnIndex) {
        nextTurnIndex = nextTurnIndex % nextPlayers.length;
      }

      let nextStatus = state.status;
      let nextPendingColor = state.pendingColorPlayerId;
      if (state.pendingColorPlayerId === leavingUid) {
        nextStatus = 'playing';
        nextPendingColor = null;
      }

      return {
        ...state,
        status: nextStatus,
        players: nextPlayers,
        currentTurnIndex: nextTurnIndex,
        pendingColorPlayerId: nextPendingColor,
        lastAction: `${leavingPlayer.name} abandonó la partida.`,
      };
    }

    default:
      return state;
  }
}
