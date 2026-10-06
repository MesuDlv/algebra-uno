import { describe, it, expect } from 'vitest';
import { generateFullDeck } from '../deckGenerator';
import { CardColor } from '../../types/card';

describe('Generador del Mazo ALGEBRA UNO (deckGenerator)', () => {
  const deck = generateFullDeck();

  it('genera exactamente 108 cartas', () => {
    expect(deck).toHaveLength(108);
  });

  it('tiene IDs únicos para todas las 108 cartas', () => {
    const ids = deck.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(108);
  });

  it('respeta la asignación de variables por color (Verde=Y, Rojo=Z, Azul=F, Amarillo=N, Comodín=x)', () => {
    deck.forEach((card) => {
      if (card.color === 'green') expect(card.variable).toBe('Y');
      else if (card.color === 'red') expect(card.variable).toBe('Z');
      else if (card.color === 'blue') expect(card.variable).toBe('F');
      else if (card.color === 'yellow') expect(card.variable).toBe('N');
      else if (card.color === 'wild') expect(card.variable).toBe('x');
    });
  });

  it('contiene la distribución exacta de 25 cartas por cada uno de los 4 colores (100 cartas)', () => {
    const standardColors: Array<Exclude<CardColor, 'wild'>> = ['green', 'red', 'blue', 'yellow'];

    standardColors.forEach((color) => {
      const colorCards = deck.filter((c) => c.color === color);
      expect(colorCards).toHaveLength(25);

      // 1 de valor 0
      const zeroCards = colorCards.filter((c) => c.type === 'number' && c.value === 0);
      expect(zeroCards).toHaveLength(1);

      // 2 de cada número del 1 al 9 (18 cartas)
      for (let n = 1; n <= 9; n++) {
        const numCards = colorCards.filter((c) => c.type === 'number' && c.value === n);
        expect(numCards).toHaveLength(2);
      }

      // 2 de Bloqueo
      const skipCards = colorCards.filter((c) => c.type === 'skip');
      expect(skipCards).toHaveLength(2);

      // 2 de Cambio de Sentido
      const reverseCards = colorCards.filter((c) => c.type === 'reverse');
      expect(reverseCards).toHaveLength(2);

      // 2 de +2
      const draw2Cards = colorCards.filter((c) => c.type === 'draw2');
      expect(draw2Cards).toHaveLength(2);
    });
  });

  it('contiene exactamente 4 comodines de cambio de color y 4 comodines +4 (8 cartas comodín)', () => {
    const wildCards = deck.filter((c) => c.color === 'wild' && c.type === 'wild');
    expect(wildCards).toHaveLength(4);

    const wild4Cards = deck.filter((c) => c.color === 'wild' && c.type === 'wild4');
    expect(wild4Cards).toHaveLength(4);
  });

  describe('Verificación Matemática Rigurosa', () => {
    it('todas las ecuaciones numéricas tienen como ÚNICA solución entera en [-50, 50] su valor (0-9)', () => {
      const numberCards = deck.filter((c) => c.type === 'number');

      numberCards.forEach((card) => {
        expect(card.value).toBeDefined();
        const expectedSolution = card.value!;
        const { equationLhs, equationRhs } = card.metadata || {};

        expect(equationLhs).toBeDefined();
        expect(equationRhs).toBeDefined();

        // 1. Probar que para el valor esperado, la ecuación se cumple: LHS === RHS
        const lhsAtSol = equationLhs!(expectedSolution);
        const rhsAtSol = equationRhs!(expectedSolution);
        expect(lhsAtSol).toBe(rhsAtSol);

        // 2. Probar que NO existe otra solución entera en el rango [-50, 50]
        for (let t = -50; t <= 50; t++) {
          if (t === expectedSolution) continue;
          const lhs = equationLhs!(t);
          const rhs = equationRhs!(t);
          expect(lhs).not.toBe(rhs);
        }
      });
    });

    it('todas las expresiones espejo de +2 simplifican a 2 y no contienen "= 2"', () => {
      const draw2Cards = deck.filter((c) => c.type === 'draw2');
      const testValues = [-100, -10, -1, 0, 1, 2, 5, 23, 77, 999];

      draw2Cards.forEach((card) => {
        expect(card.expressionLatex).not.toContain('= 2');
        const evalFn = card.metadata?.evalFn;
        expect(evalFn).toBeDefined();

        testValues.forEach((val) => {
          expect(evalFn!(val)).toBe(2);
        });
      });
    });

    it('todas las expresiones espejo de comodines +4 simplifican a 4 y no contienen "= 4"', () => {
      const wild4Cards = deck.filter((c) => c.type === 'wild4');
      const testValues = [-100, -10, -1, 0, 1, 2, 4, 15, 88, 1000];

      wild4Cards.forEach((card) => {
        expect(card.expressionLatex).not.toContain('= 4');
        const evalFn = card.metadata?.evalFn;
        expect(evalFn).toBeDefined();

        testValues.forEach((x) => {
          expect(evalFn!(x)).toBe(4);
        });
      });
    });

    it('todas las cartas de bloqueo son igualdades que terminan en 1/0 o 4/0 (sin 0/0)', () => {
      const skipCards = deck.filter((c) => c.type === 'skip');

      skipCards.forEach((card) => {
        expect(card.metadata?.denominator).toBe(0);
        // Debe ser una igualdad que termina en = \frac{1}{0} o = \frac{4}{0}
        expect(card.expressionLatex).toMatch(/=\s*\\frac\{[14]\}\{0\}/);
        expect(card.expressionLatex).not.toContain('\\frac{0}{0}');
      });
    });

    it('todas las cartas de cambio de sentido multiplican por (-1) e invierten la desigualdad', () => {
      const reverseCards = deck.filter((c) => c.type === 'reverse');

      reverseCards.forEach((card) => {
        expect(card.expressionLatex).toContain('(-1)');
        expect(card.expressionLatex).toContain('\\to');

        // Comprobar que si el original tenía '>', la consecuencia tiene '<' (o '\le' a '\ge')
        const parts = card.expressionLatex.split('\\to');
        const lhs = parts[0];
        const rhs = parts[1];

        if (lhs.includes('>')) {
          expect(rhs).toContain('<');
        } else if (lhs.includes('\\le')) {
          expect(rhs).toContain('\\ge');
        } else if (lhs.includes('<')) {
          expect(rhs).toContain('>');
        } else if (lhs.includes('\\ge')) {
          expect(rhs).toContain('\\le');
        }
      });
    });

    it('todas las cartas tienen explicación matemática para el Modo Ayuda', () => {
      deck.forEach((card) => {
        expect(card.explanationLatex).toBeDefined();
        expect(card.explanationLatex.length).toBeGreaterThan(0);
      });
    });
  });
});
