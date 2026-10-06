import { Card, CardColor } from '../types/card';

/**
 * Determina si una carta puede ser jugada legalmente sobre la mesa actual.
 * Reglas de ALGEBRA UNO con ACUMULACIÓN DE ROBO (+2 y +4):
 * - Si hay cartas acumuladas pendientes de robar (accumulatedDrawCount > 0):
 *   SOLO se puede defender jugando otro +2 o +4 para acumular el castigo.
 * - En turno normal (sin acumulación pendiente):
 *   * Comodines (wild y wild4) siempre se pueden jugar.
 *   * Coincidencia por color activo.
 *   * Coincidencia de numéricas por solución de la ecuación.
 *   * Coincidencia de acción por el mismo tipo (bloqueo sobre bloqueo, etc.).
 */
export function isCardPlayable(
  card: Card,
  topCard: Card,
  activeColor: CardColor,
  accumulatedDrawCount = 0
): boolean {
  // 1. Si hay una penalización acumulada activa (+2 o +4), SOLO se puede responder con +2 o +4
  if (accumulatedDrawCount > 0) {
    return card.type === 'draw2' || card.type === 'wild4';
  }

  // 2. Los comodines se pueden jugar siempre en turno normal
  if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
    return true;
  }

  // 3. Coincidencia por color activo
  if (card.color === activeColor) {
    return true;
  }

  // 4. Coincidencia de cartas numéricas por valor matemático (solución de la ecuación)
  if (card.type === 'number' && topCard.type === 'number' && card.value !== undefined && topCard.value !== undefined) {
    if (card.value === topCard.value) {
      return true;
    }
  }

  // 5. Coincidencia de cartas de acción por el mismo tipo (independientemente del color)
  if (card.type !== 'number' && card.type === topCard.type) {
    return true;
  }

  return false;
}

/**
 * Obtiene la lista de cartas de la mano que son legales para jugar.
 */
export function getPlayableCards(
  hand: Card[],
  topCard: Card,
  activeColor: CardColor,
  accumulatedDrawCount = 0
): Card[] {
  return hand.filter((c) => isCardPlayable(c, topCard, activeColor, accumulatedDrawCount));
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
