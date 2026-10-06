import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialState } from '../gameReducer';
import { GameEvent } from '../../types/event';
import { Card } from '../../types/card';
import { isCardPlayable } from '../rules';

describe('Motor de Reglas Determinista de ALGEBRA UNO (gameReducer)', () => {
  const players2 = [
    { uid: 'u1', name: 'Ana', avatar: 'avatar1' },
    { uid: 'u2', name: 'Beto', avatar: 'avatar2' },
  ];

  const players3 = [
    { uid: 'u1', name: 'Ana', avatar: 'avatar1' },
    { uid: 'u2', name: 'Beto', avatar: 'avatar2' },
    { uid: 'u3', name: 'Carlos', avatar: 'avatar3' },
  ];

  const sampleGreenNumber: Card = {
    id: 'sample_g2',
    color: 'green',
    variable: 'Y',
    type: 'number',
    value: 2,
    expressionLatex: '2+Y=4',
    displayCornerLatex: '2+Y=4',
    explanationLatex: 'Y=2',
  };

  it('inicia la partida conservando la conservación total de las 108 cartas del mazo', () => {
    const startEvent: GameEvent = {
      seq: 1,
      uid: 'u1',
      type: 'start',
      payload: { seed: 10, players: players2 },
    };

    const state = gameReducer(createInitialState(), startEvent);
    expect(state.status).toBe('playing');
    expect(state.players).toHaveLength(2);

    // Suma total de cartas: manos de jugadores + mazo + pila de descarte = 108
    const totalHandCards = state.players.reduce((sum, p) => sum + p.hand.length, 0);
    const totalCardsInGame = totalHandCards + state.deck.length + state.discardPile.length;
    expect(totalCardsInGame).toBe(108);
  });

  it('respeta la regla de coincidencia algebraica por solución matemática (ej. Verde 2 sobre Rojo 2)', () => {
    const green2: Card = {
      id: 'g2',
      color: 'green',
      variable: 'Y',
      type: 'number',
      value: 2,
      expressionLatex: '2+Y=4',
      displayCornerLatex: '2+Y=4',
      explanationLatex: 'Y=2',
    };

    const red2: Card = {
      id: 'r2',
      color: 'red',
      variable: 'Z',
      type: 'number',
      value: 2,
      expressionLatex: '4Z=8',
      displayCornerLatex: '4Z=8',
      explanationLatex: 'Z=2',
    };

    // Rojo 2 sobre Verde 2: Aunque el color activo sea verde, como la solución de ambas es 2, es legal
    expect(isCardPlayable(red2, green2, 'green')).toBe(true);

    const red3: Card = {
      id: 'r3',
      color: 'red',
      variable: 'Z',
      type: 'number',
      value: 3,
      expressionLatex: 'Z-2=1',
      displayCornerLatex: 'Z-2=1',
      explanationLatex: 'Z=3',
    };

    // Rojo 3 sobre Verde 2 con color verde: No coincide color ni solución -> Ilegal
    expect(isCardPlayable(red3, green2, 'green')).toBe(false);
  });

  it('aplica el efecto de Bloqueo saltando al siguiente jugador', () => {
    let state = gameReducer(createInitialState(), {
      seq: 1,
      uid: 'u1',
      type: 'start',
      payload: { seed: 100, players: players3 },
    });

    // Configuramos estado base limpio para aislar la prueba de la carta de bloqueo
    state.currentTurnIndex = 0;
    state.activeColor = 'green';
    state.discardPile = [sampleGreenNumber];

    const dummyCard: Card = {
      id: 'dummy_card',
      color: 'red',
      variable: 'Z',
      type: 'number',
      value: 5,
      expressionLatex: '5',
      displayCornerLatex: '5',
      explanationLatex: '5',
    };

    const skipCard: Card = {
      id: 'skip_test',
      color: 'green',
      variable: 'Y',
      type: 'skip',
      expressionLatex: '0Y=1',
      displayCornerLatex: '0Y=1',
      explanationLatex: 'Salta turno',
    };

    state.players[0].hand = [skipCard, dummyCard];

    expect(state.currentTurnIndex).toBe(0);

    state = gameReducer(state, {
      seq: 2,
      uid: 'u1',
      type: 'play',
      payload: { cardId: 'skip_test' },
    });

    // Debe saltar a u2 (índice 1) y pasar el turno a u3 (índice 2)
    expect(state.currentTurnIndex).toBe(2);
  });

  it('con 2 jugadores, Cambio de Sentido funciona como Bloqueo', () => {
    let state = gameReducer(createInitialState(), {
      seq: 1,
      uid: 'u1',
      type: 'start',
      payload: { seed: 200, players: players2 },
    });

    state.currentTurnIndex = 0;
    state.activeColor = 'green';
    state.discardPile = [sampleGreenNumber];

    const dummyCard: Card = {
      id: 'dummy_card',
      color: 'red',
      variable: 'Z',
      type: 'number',
      value: 5,
      expressionLatex: '5',
      displayCornerLatex: '5',
      explanationLatex: '5',
    };

    const reverseCard: Card = {
      id: 'rev_test',
      color: 'green',
      variable: 'Y',
      type: 'reverse',
      expressionLatex: '(Y>2)(-1)',
      displayCornerLatex: '(Y>2)(-1)',
      explanationLatex: 'Sentido',
    };

    state.players[0].hand = [reverseCard, dummyCard];
    expect(state.currentTurnIndex).toBe(0);

    state = gameReducer(state, {
      seq: 2,
      uid: 'u1',
      type: 'play',
      payload: { cardId: 'rev_test' },
    });

    // En 2 jugadores salta al oponente, vuelve a ser el turno de u1
    expect(state.currentTurnIndex).toBe(0);
  });

  it('con 3 jugadores, Cambio de Sentido invierte la dirección de juego', () => {
    let state = gameReducer(createInitialState(), {
      seq: 1,
      uid: 'u1',
      type: 'start',
      payload: { seed: 300, players: players3 },
    });

    state.currentTurnIndex = 0;
    state.activeColor = 'green';
    state.discardPile = [sampleGreenNumber];

    const dummyCard: Card = {
      id: 'dummy_card',
      color: 'red',
      variable: 'Z',
      type: 'number',
      value: 5,
      expressionLatex: '5',
      displayCornerLatex: '5',
      explanationLatex: '5',
    };

    const reverseCard: Card = {
      id: 'rev_test_3',
      color: 'green',
      variable: 'Y',
      type: 'reverse',
      expressionLatex: '(Y>2)(-1)',
      displayCornerLatex: '(Y>2)(-1)',
      explanationLatex: 'Sentido',
    };

    state.players[0].hand = [reverseCard, dummyCard];
    expect(state.direction).toBe(1);

    state = gameReducer(state, {
      seq: 2,
      uid: 'u1',
      type: 'play',
      payload: { cardId: 'rev_test_3' },
    });

    expect(state.direction).toBe(-1);
    // En dirección -1 desde 0 pasa a Carlos (índice 2)
    expect(state.currentTurnIndex).toBe(2);
  });

  it('aplica la carta +2 obligando al siguiente a robar 2 cartas y saltar su turno', () => {
    let state = gameReducer(createInitialState(), {
      seq: 1,
      uid: 'u1',
      type: 'start',
      payload: { seed: 400, players: players3 },
    });

    state.currentTurnIndex = 0;
    state.activeColor = 'green';
    state.discardPile = [sampleGreenNumber];

    const dummyCard: Card = {
      id: 'dummy_card',
      color: 'red',
      variable: 'Z',
      type: 'number',
      value: 5,
      expressionLatex: '5',
      displayCornerLatex: '5',
      explanationLatex: '5',
    };

    const draw2Card: Card = {
      id: 'd2_test',
      color: 'green',
      variable: 'Y',
      type: 'draw2',
      expressionLatex: '(Y+3)+(Y-1)-2Y',
      displayCornerLatex: '(Y+3)+(Y-1)-2Y',
      explanationLatex: '=2',
    };

    state.players[0].hand = [draw2Card, dummyCard];
    const initialHandU2 = state.players[1].hand.length;

    state = gameReducer(state, {
      seq: 2,
      uid: 'u1',
      type: 'play',
      payload: { cardId: 'd2_test' },
    });

    // u2 debió robar 2 cartas (initialHandU2 + 2)
    expect(state.players[1].hand.length).toBe(initialHandU2 + 2);
    // El turno pasa a u3 (índice 2)
    expect(state.currentTurnIndex).toBe(2);
  });

  describe('Mecánica de Comodín +4 con Desafío (Challenge)', () => {
    it('al jugar +4 entra en estado pendingChallenge y el objetivo puede Aceptar (+4 y salta)', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 500, players: players3 },
      });

      state.currentTurnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [sampleGreenNumber];

      const wild4Card: Card = {
        id: 'w4_test',
        color: 'wild',
        variable: 'x',
        type: 'wild4',
        expressionLatex: '(x+5)+(x-1)-2x',
        displayCornerLatex: '(x+5)+(x-1)-2x',
        explanationLatex: '=4',
      };

      const dummyCard: Card = {
        id: 'dummy_card',
        color: 'red',
        variable: 'Z',
        type: 'number',
        value: 5,
        expressionLatex: '5',
        displayCornerLatex: '5',
        explanationLatex: '5',
      };

      state.players[0].hand = [wild4Card, dummyCard];

      state = gameReducer(state, {
        seq: 2,
        uid: 'u1',
        type: 'play',
        payload: { cardId: 'w4_test', chosenColor: 'blue' },
      });

      expect(state.status).toBe('pendingChallenge');
      expect(state.pendingChallenge).not.toBeNull();
      expect(state.pendingChallenge?.targetUid).toBe('u2');

      const handU2Before = state.players[1].hand.length;

      // u2 acepta el +4
      state = gameReducer(state, {
        seq: 3,
        uid: 'u2',
        type: 'accept+4',
        payload: {},
      });

      expect(state.status).toBe('playing');
      expect(state.players[1].hand.length).toBe(handU2Before + 4);
      // Turno avanza saltando a u2 -> pasa a u3
      expect(state.currentTurnIndex).toBe(2);
    });

    it('si el desafiado tenía cartas del color activo, el Desafío es Exitoso y el atacante roba 4', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 600, players: players2 },
      });

      state.currentTurnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [sampleGreenNumber];

      const wild4Card: Card = {
        id: 'w4_illegal',
        color: 'wild',
        variable: 'x',
        type: 'wild4',
        expressionLatex: '(x+5)-2x',
        displayCornerLatex: '(x+5)-2x',
        explanationLatex: '=4',
      };

      // Le agregamos una carta del color activo (verde) para que su +4 sea ilegal
      const matchingColorCard: Card = {
        id: 'matching_color',
        color: 'green',
        variable: 'Y',
        type: 'number',
        value: 1,
        expressionLatex: 'Y+1=2',
        displayCornerLatex: 'Y+1=2',
        explanationLatex: 'Y=1',
      };

      state.players[0].hand = [wild4Card, matchingColorCard];
      const handU1Before = state.players[0].hand.length;

      state = gameReducer(state, {
        seq: 2,
        uid: 'u1',
        type: 'play',
        payload: { cardId: 'w4_illegal' },
      });

      // u2 desafía el +4
      state = gameReducer(state, {
        seq: 3,
        uid: 'u2',
        type: 'challenge+4',
        payload: {},
      });

      // u1 cometió infracción -> u1 roba 4 cartas (handU1Before - 1 jugada + 4 robadas)
      expect(state.players[0].hand.length).toBe(handU1Before - 1 + 4);
      // u2 juega normalmente su turno
      expect(state.currentTurnIndex).toBe(1);
    });

    it('si el desafiado NO tenía cartas del color activo, el Desafío Falla y el retador roba 6', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 700, players: players2 },
      });

      state.currentTurnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [sampleGreenNumber];

      // Aseguramos que u1 NO tenga cartas del color activo (solo tiene el +4)
      const wild4Card: Card = {
        id: 'w4_legal',
        color: 'wild',
        variable: 'x',
        type: 'wild4',
        expressionLatex: '(x+5)-2x',
        displayCornerLatex: '(x+5)-2x',
        explanationLatex: '=4',
      };

      const nonMatchingDummy: Card = {
        id: 'dummy_non_matching',
        color: 'red',
        variable: 'Z',
        type: 'number',
        value: 5,
        expressionLatex: '5',
        displayCornerLatex: '5',
        explanationLatex: '5',
      };

      state.players[0].hand = [wild4Card, nonMatchingDummy];
      const handU2Before = state.players[1].hand.length;

      state = gameReducer(state, {
        seq: 2,
        uid: 'u1',
        type: 'play',
        payload: { cardId: 'w4_legal' },
      });

      // u2 desafía el +4
      state = gameReducer(state, {
        seq: 3,
        uid: 'u2',
        type: 'challenge+4',
        payload: {},
      });

      // Desafío falló: u2 roba 6 cartas (4 + 2 penalización)
      expect(state.players[1].hand.length).toBe(handU2Before + 6);
    });
  });

  describe('Regla de UNO y Atrapar', () => {
    it('si un jugador queda con 1 carta y no cantó UNO, otro jugador lo atrapa y roba 2 cartas', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 800, players: players2 },
      });

      state.currentTurnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [sampleGreenNumber];

      // Dejamos a u1 con 2 cartas
      state.players[0].hand = [
        {
          id: 'card_to_play',
          color: 'green',
          variable: 'Y',
          type: 'number',
          value: 1,
          expressionLatex: 'Y+1=2',
          displayCornerLatex: 'Y+1=2',
          explanationLatex: 'Y=1',
        },
        {
          id: 'card_remaining',
          color: 'red',
          variable: 'Z',
          type: 'number',
          value: 3,
          expressionLatex: 'Z=3',
          displayCornerLatex: 'Z=3',
          explanationLatex: 'Z=3',
        },
      ];

      // u1 juega y le queda 1 carta sin cantar UNO
      state = gameReducer(state, {
        seq: 2,
        uid: 'u1',
        type: 'play',
        payload: { cardId: 'card_to_play' },
      });

      expect(state.players[0].hand.length).toBe(1);
      expect(state.unoVulnerableUids).toContain('u1');

      // u2 atrapa a u1
      state = gameReducer(state, {
        seq: 3,
        uid: 'u2',
        type: 'catchUno',
        payload: { targetUid: 'u1' },
      });

      // u1 recibe 2 cartas de penalización (1 + 2 = 3 cartas)
      expect(state.players[0].hand.length).toBe(3);
      expect(state.unoVulnerableUids).not.toContain('u1');
    });

    it('si el jugador canta UNO a tiempo, queda protegido contra atrapar', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 900, players: players2 },
      });

      state.currentTurnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [sampleGreenNumber];

      state.players[0].hand = [
        {
          id: 'c1',
          color: 'green',
          variable: 'Y',
          type: 'number',
          value: 1,
          expressionLatex: '1',
          displayCornerLatex: '1',
          explanationLatex: '1',
        },
        {
          id: 'c2',
          color: 'red',
          variable: 'Z',
          type: 'number',
          value: 2,
          expressionLatex: '2',
          displayCornerLatex: '2',
          explanationLatex: '2',
        },
      ];

      // u1 canta UNO
      state = gameReducer(state, {
        seq: 2,
        uid: 'u1',
        type: 'uno',
        payload: {},
      });

      // u1 juega su penúltima carta
      state = gameReducer(state, {
        seq: 3,
        uid: 'u1',
        type: 'play',
        payload: { cardId: 'c1' },
      });

      expect(state.unoVulnerableUids).not.toContain('u1');

      // u2 intenta atraparlo
      const stateAfterCatch = gameReducer(state, {
        seq: 4,
        uid: 'u2',
        type: 'catchUno',
        payload: { targetUid: 'u1' },
      });

      // No surte efecto
      expect(stateAfterCatch.players[0].hand.length).toBe(1);
    });
  });

  describe('Re-barajado determinista al agotarse el mazo', () => {
    it('cuando el mazo se vacía, re-baraja el descarte conservando la carta superior', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 1000, players: players2 },
      });

      state.currentTurnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [sampleGreenNumber];

      // Vaciamos el mazo artificialmente y poblamos el descarte con 10 cartas
      const extraCards = state.deck.splice(0, 10);
      state.discardPile.push(...extraCards);
      state.deck = []; // Mazo vacío

      // Jugador roba una carta
      state = gameReducer(state, {
        seq: 2,
        uid: 'u1',
        type: 'draw',
        payload: {},
      });

      // El mazo se debió re-poblar a partir del descarte
      expect(state.deck.length).toBeGreaterThan(0);
      expect(state.discardPile.length).toBe(1); // Solo queda la superior
      expect(state.reshuffleCount).toBe(1);
    });
  });

  describe('Tests de Determinismo Estricto (Event Sourcing)', () => {
    it('dos clientes que reproducen el mismo registro de eventos producen EXACTAMENTE el mismo estado', () => {
      const eventLog: GameEvent[] = [
        {
          seq: 1,
          uid: 'u1',
          type: 'start',
          payload: { seed: 4242, players: players3 },
        },
        {
          seq: 2,
          uid: 'u1',
          type: 'draw',
          payload: {},
        },
      ];

      // Cliente A
      let stateA = createInitialState();
      for (const ev of eventLog) {
        stateA = gameReducer(stateA, ev);
      }

      // Cliente B
      let stateB = createInitialState();
      for (const ev of eventLog) {
        stateB = gameReducer(stateB, ev);
      }

      expect(JSON.stringify(stateA)).toBe(JSON.stringify(stateB));
    });

    it('eventos ilegales son completamente ignorados sin alterar el estado', () => {
      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: 'u1',
        type: 'start',
        payload: { seed: 5555, players: players2 },
      });

      const serializedBefore = JSON.stringify(state);

      // u2 intenta jugar fuera de turno
      state = gameReducer(state, {
        seq: 2,
        uid: 'u2',
        type: 'play',
        payload: { cardId: 'carta_falsa' },
      });

      // Estado debe permanecer inalterado
      expect(JSON.stringify(state)).toBe(serializedBefore);
    });
  });

  describe('Simulación de Partida Completa Autónoma (2 a 5 jugadores)', () => {
    function simulateFullGame(playerCount: number, seed: number) {
      const pList = Array.from({ length: playerCount }, (_, i) => ({
        uid: `p${i + 1}`,
        name: `Jugador ${i + 1}`,
        avatar: `avatar_${i + 1}`,
      }));

      let state = gameReducer(createInitialState(), {
        seq: 1,
        uid: pList[0].uid,
        type: 'start',
        payload: { seed, players: pList },
      });

      let seq = 2;
      let turnsCount = 0;
      const MAX_TURNS = 600; // Límite de seguridad contra bucles

      while (state.status !== 'finished' && turnsCount < MAX_TURNS) {
        turnsCount++;

        // Si está pendiente de color
        if (state.status === 'pendingColor' && state.pendingColorPlayerId) {
          state = gameReducer(state, {
            seq: seq++,
            uid: state.pendingColorPlayerId,
            type: 'chooseColor',
            payload: { color: 'green' },
          });
          continue;
        }

        // Si está pendiente de desafío
        if (state.status === 'pendingChallenge' && state.pendingChallenge) {
          state = gameReducer(state, {
            seq: seq++,
            uid: state.pendingChallenge.targetUid,
            type: 'accept+4',
            payload: {},
          });
          continue;
        }

        const currentPlayer = state.players[state.currentTurnIndex];
        const topCard = state.discardPile[state.discardPile.length - 1];

        // Cantar UNO preventivo si tiene 2 cartas
        if (currentPlayer.hand.length === 2 && !currentPlayer.hasCalledUno) {
          state = gameReducer(state, {
            seq: seq++,
            uid: currentPlayer.uid,
            type: 'uno',
            payload: {},
          });
        }

        // Buscar cartas jugables
        const playableCard = currentPlayer.hand.find((c) => isCardPlayable(c, topCard, state.activeColor));

        if (playableCard) {
          state = gameReducer(state, {
            seq: seq++,
            uid: currentPlayer.uid,
            type: 'play',
            payload: {
              cardId: playableCard.id,
              chosenColor: playableCard.color === 'wild' ? 'red' : undefined,
            },
          });
        } else {
          // Robar
          state = gameReducer(state, {
            seq: seq++,
            uid: currentPlayer.uid,
            type: 'draw',
            payload: {},
          });

          // Si robó una carta jugable, la juega
          if (state.drawnCardThisTurn) {
            state = gameReducer(state, {
              seq: seq++,
              uid: currentPlayer.uid,
              type: 'play',
              payload: {
                cardId: state.drawnCardThisTurn.id,
                chosenColor: state.drawnCardThisTurn.color === 'wild' ? 'blue' : undefined,
              },
            });
          }
        }
      }

      expect(state.status).toBe('finished');
      expect(state.winnerUid).not.toBeNull();
    }

    it('simula con éxito una partida completa de 2 jugadores', () => {
      simulateFullGame(2, 101);
    });

    it('simula con éxito una partida completa de 3 jugadores', () => {
      simulateFullGame(3, 202);
    });

    it('simula con éxito una partida completa de 4 jugadores', () => {
      simulateFullGame(4, 303);
    });

    it('simula con éxito una partida completa de 5 jugadores', () => {
      simulateFullGame(5, 404);
    });
  });
});
