import { Card, CardColor } from '../types/card';

/**
 * Determina si una carta puede ser jugada legalmente sobre la mesa actual.
 * Reglas de ALGEBRA UNO:
 * - Comodines (wild y wild4) siempre se pueden jugar.
 * - Coincidencia por color: el color de la carta coincide con el color activo.
 * - Coincidencia por solución matemática (numéricas): sobre un valor se puede jugar otra carta con la misma solución (ej. Verde 2 sobre Rojo 2).
 * - Coincidencia por tipo de acción: bloqueo sobre bloqueo, sentido sobre sentido, +2 sobre +2.
 */
export function isCardPlayable(card: Card, topCard: Card, activeColor: CardColor): boolean {
  // 1. Los comodines se pueden jugar siempre
  if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
    return true;
  }

  // 2. Coincidencia por color activo
  if (card.color === activeColor) {
    return true;
  }

  // 3. Coincidencia de cartas numéricas por valor matemático (solución de la ecuación)
  if (card.type === 'number' && topCard.type === 'number' && card.value !== undefined && topCard.value !== undefined) {
    if (card.value === topCard.value) {
      return true;
    }
  }

  // 4. Coincidencia de cartas de acción por el mismo tipo (independientemente del color)
  if (card.type !== 'number' && card.type === topCard.type) {
    return true;
  }

  return false;
}

/**
 * Obtiene la lista de cartas de la mano que son legales para jugar.
 */
export function getPlayableCards(hand: Card[], topCard: Card, activeColor: CardColor): Card[] {
  return hand.filter((c) => isCardPlayable(c, topCard, activeColor));
}

/**
 * Calcula el índice del siguiente jugador considerando la dirección y el número de pasos (ej. saltos).
 */
export function getNextPlayerIndex(
  currentIndex: number,
  totalPlayers: number,
  direction: 1 | -1,
  steps = 1
): number {
  if (totalPlayers <= 0) return 0;
  const rawIndex = (currentIndex + direction * steps) % totalPlayers;
  return (rawIndex + totalPlayers) % totalPlayers;
}

/**
 * Evalúa el desafío al Comodín +4 según la regla oficial del UNO:
 * Un jugador solo puede jugar legalmente un +4 si NO tiene en su mano cartas del color activo.
 * Retorna true si el desafiado cometió infracción (tenía cartas del color activo -> Desafío Exitoso).
 * Retorna false si el desafiado jugó legalmente (no tenía cartas del color activo -> Desafío Fallido).
 */
export function isWild4ChallengeSuccessful(handBeforePlay: Card[], activeColorBeforeWild4: CardColor): boolean {
  return handBeforePlay.some((c) => c.color === activeColorBeforeWild4);
}
