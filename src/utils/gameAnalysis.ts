import { GameEvent, PlayEventPayload } from '../types/event';
import { GameState } from '../types/game';
import { Card } from '../types/card';
import { gameReducer, createInitialState } from '../engine/gameReducer';
import { isCardPlayable } from '../engine/rules';

export type MoveRating =
  | 'good'        // 🟢 Buena Jugada (Cambio de variable / color por mismo valor, o jugada estándar)
  | 'brilliant'   // 💎 Jugada Maestra (Cambio de variable / color por misma solución matemática)
  | 'inaccuracy'  // 🟡 Mala Jugada / Oportunidad Perdida (Tenía carta para cambio de variable por mismo valor y no la usó)
  | 'blunder';    // 🔴 Mala Jugada / Error Grave (Penalización por cálculo erróneo en Modo Sin Ayuda)

export interface AnalyzedMove {
  id: string;
  moveNumber: number;
  playerUid: string;
  playerName: string;
  playerAvatar: string;
  actionType: 'play' | 'draw' | 'blunder_play' | 'caught_uno';
  rating: MoveRating;
  title: string;
  description: string;
  cardPlayed?: Card;
  topCard?: Card;
  equationLatex?: string;
  solutionLatex?: string;
  explanationLatex?: string;
  missedCard?: Card;
  isVariableChange?: boolean;
}

export interface MatchAnalysisReport {
  accuracy: number; // 0-100%
  totalMoves: number;
  goodCount: number;
  badCount: number;
  moves: AnalyzedMove[];
}

/**
 * Reconstruye la partida evento por evento para generar un reporte
 * de análisis técnico enfocado en cambios de variable y errores de cálculo.
 */
export function analyzeMatchEvents(
  events: GameEvent[],
  targetUid?: string
): MatchAnalysisReport {
  let state: GameState = createInitialState();
  const analyzedMoves: AnalyzedMove[] = [];
  let moveCounter = 1;

  for (const event of events) {
    const prevState = state;
    const nextState = gameReducer(prevState, event);
    state = nextState;

    if (event.type === 'play') {
      const payload = event.payload as PlayEventPayload;
      const player = prevState.players[prevState.currentTurnIndex];
      if (!player) continue;

      const card = player.hand.find((c) => c.id === payload.cardId);
      const topCard = prevState.discardPile[prevState.discardPile.length - 1];

      if (card && topCard) {
        const isLegal = isCardPlayable(card, topCard, prevState.activeColor, prevState.accumulatedDrawCount);

        if (!isLegal) {
          // MALA JUGADA: Error de cálculo en Modo Sin Ayuda
          analyzedMoves.push({
            id: `move_${moveCounter}`,
            moveNumber: moveCounter++,
            playerUid: player.uid,
            playerName: player.name,
            playerAvatar: player.avatar,
            actionType: 'blunder_play',
            rating: 'blunder',
            title: 'Mala Jugada: Error de Cálculo (Modo Sin Ayuda)',
            description: `Lanzaste ${card.variable} creyendo que coincidía, pero su solución era ${card.value ?? '?'}, mientras que la mesa requería color ${topCard.color.toUpperCase()} o solución ${topCard.value}. Fuiste penalizado con 2 cartas.`,
            cardPlayed: card,
            topCard,
            equationLatex: card.expressionLatex,
            solutionLatex: card.value !== undefined ? `${card.variable} = ${card.value}` : undefined,
            explanationLatex: card.explanationLatex || (card.value !== undefined ? `${card.variable} = ${card.value}` : undefined),
          });
        } else {
          // Jugada legal:
          // Verificar si fue un cambio de color / variable por coincidencia matemática de mismo valor
          const isCrossColorValueMatch =
            card.type === 'number' &&
            topCard.type === 'number' &&
            card.color !== topCard.color &&
            typeof card.value === 'number' &&
            card.value === topCard.value;

          // Verificar si el jugador tenía en la mano una carta de OTRO color con el mismo valor numérico y NO la usó
          const missedCrossColorCard = player.hand.find(
            (c) =>
              c.id !== card.id &&
              c.type === 'number' &&
              topCard.type === 'number' &&
              c.color !== topCard.color &&
              typeof c.value === 'number' &&
              c.value === topCard.value
          );

          if (isCrossColorValueMatch) {
            // BUENA JUGADA: Cambió de variable/color por tener el mismo valor
            analyzedMoves.push({
              id: `move_${moveCounter}`,
              moveNumber: moveCounter++,
              playerUid: player.uid,
              playerName: player.name,
              playerAvatar: player.avatar,
              actionType: 'play',
              rating: 'good',
              title: '¡Buena Jugada! Cambio de Variable por Mismo Valor',
              description: `Hiciste un cambio de variable excelente de ${topCard.color.toUpperCase()} a ${card.color.toUpperCase()} porque ambas ecuaciones tienen el mismo resultado (${card.value}).`,
              cardPlayed: card,
              topCard,
              equationLatex: card.expressionLatex,
              solutionLatex: `${card.variable} = ${card.value}`,
              explanationLatex: card.explanationLatex,
              isVariableChange: true,
            });
          } else if (missedCrossColorCard && card.color === topCard.color) {
            // MALA JUGADA: Oportunidad perdida de cambio de variable
            analyzedMoves.push({
              id: `move_${moveCounter}`,
              moveNumber: moveCounter++,
              playerUid: player.uid,
              playerName: player.name,
              playerAvatar: player.avatar,
              actionType: 'play',
              rating: 'inaccuracy',
              title: 'Mala Jugada: Oportunidad de Cambio de Variable Perdida',
              description: `Tenías en tu mano una carta de otra familia (${missedCrossColorCard.variable}, ${missedCrossColorCard.color.toUpperCase()}) con el mismo valor (${missedCrossColorCard.value}) para cambiar de variable, pero no la aprovechaste.`,
              cardPlayed: card,
              topCard,
              missedCard: missedCrossColorCard,
              equationLatex: missedCrossColorCard.expressionLatex,
              solutionLatex: `${missedCrossColorCard.variable} = ${missedCrossColorCard.value}`,
              explanationLatex: missedCrossColorCard.explanationLatex,
            });
          }
        }
      }
    } else if (event.type === 'draw') {
      const player = prevState.players[prevState.currentTurnIndex];
      const topCard = prevState.discardPile[prevState.discardPile.length - 1];

      if (player && topCard) {
        // Verificar si tenía una carta para cambiar de variable por mismo valor y en su lugar robó
        const missedCrossColorCard = player.hand.find(
          (c) =>
            c.type === 'number' &&
            topCard.type === 'number' &&
            c.color !== topCard.color &&
            typeof c.value === 'number' &&
            c.value === topCard.value
        );

        if (missedCrossColorCard) {
          analyzedMoves.push({
            id: `move_${moveCounter}`,
            moveNumber: moveCounter++,
            playerUid: player.uid,
            playerName: player.name,
            playerAvatar: player.avatar,
            actionType: 'draw',
            rating: 'inaccuracy',
            title: 'Mala Jugada: Robaste Teniendo Cambio de Variable',
            description: `Robaste del mazo cuando podías haber jugado ${missedCrossColorCard.variable} (${missedCrossColorCard.color.toUpperCase()}) para cambiar de color por mismo valor (${missedCrossColorCard.value}).`,
            topCard,
            missedCard: missedCrossColorCard,
            equationLatex: missedCrossColorCard.expressionLatex,
            solutionLatex: `${missedCrossColorCard.variable} = ${missedCrossColorCard.value}`,
            explanationLatex: missedCrossColorCard.explanationLatex,
          });
        }
      }
    }
  }

  // Filtrar para el usuario local si se provee targetUid
  const filteredMoves = targetUid
    ? analyzedMoves.filter((m) => m.playerUid === targetUid)
    : analyzedMoves;

  const relevantMoves = filteredMoves.length > 0 ? filteredMoves : analyzedMoves;

  let goodCount = 0;
  let badCount = 0;
  let scoreSum = 0;

  relevantMoves.forEach((m) => {
    if (m.rating === 'good' || m.rating === 'brilliant') {
      goodCount++;
      scoreSum += 100;
    } else {
      badCount++;
      scoreSum += 20;
    }
  });

  const accuracy =
    relevantMoves.length > 0
      ? Math.round(scoreSum / relevantMoves.length)
      : 90;

  return {
    accuracy,
    totalMoves: relevantMoves.length,
    goodCount,
    badCount,
    moves: relevantMoves,
  };
}
