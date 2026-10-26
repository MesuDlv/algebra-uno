import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeMatchEvents } from '../gameAnalysis';
import { GameEvent } from '../../types/event';
import { hasSeenTutorial, markTutorialAsSeen, TUTORIAL_STORAGE_KEY } from '../../components/tutorial/BetunTutorialModal';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;

describe('Revisión Táctica de Partida (gameAnalysis.ts)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });
  it('retorna reporte por defecto si no hay jugadas', () => {
    const report = analyzeMatchEvents([]);
    expect(report.totalMoves).toBe(0);
    expect(report.accuracy).toBeGreaterThan(0);
    expect(report.moves).toEqual([]);
  });

  it('analiza eventos reales identificando jugadas y precisión', () => {
    const mockEvents: GameEvent[] = [
      {
        seq: 1,
        uid: 'user1',
        type: 'start',
        payload: {
          seed: 42,
          players: [
            { uid: 'user1', name: 'Jugador 1', avatar: '🐱' },
            { uid: 'user2', name: 'Jugador 2', avatar: '🐶' },
          ],
          helpMode: true,
        },
      },
      {
        seq: 2,
        uid: 'user1',
        type: 'draw',
        payload: {},
      },
    ];

    const report = analyzeMatchEvents(mockEvents, 'user1');
    expect(report).toBeDefined();
    expect(typeof report.accuracy).toBe('number');
    expect(report.accuracy).toBeGreaterThanOrEqual(0);
    expect(report.accuracy).toBeLessThanOrEqual(100);
  });

  it('gestiona persistencia de tutorial visto (hasSeenTutorial / markTutorialAsSeen)', () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    expect(hasSeenTutorial()).toBe(false);

    markTutorialAsSeen();
    expect(hasSeenTutorial()).toBe(true);
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe('true');
  });
});
