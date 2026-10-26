import { describe, it, expect } from 'vitest';
import {
  formatInputToLatex,
  evaluateUserMathInput,
  evaluateAlgebraicExpression,
  checkUserQuizAnswer,
  checkIsolateAnswer,
  checkSolveAnswer,
  getCardDespejeLatex,
  getCardSolutionLatex,
} from '../PostMatchQuizModal';
import { Card } from '../../../types/card';

describe('PostMatchQuizModal math helpers', () => {
  describe('formatInputToLatex', () => {
    it('formats simple fraction into vertical LaTeX frac', () => {
      expect(formatInputToLatex('12/3')).toBe('\\frac{12}{3}');
    });

    it('formats incomplete fraction without question mark "?" when user just clicked slash', () => {
      expect(formatInputToLatex('12/')).toBe('12 / ');
      expect(formatInputToLatex('/')).toBe('/ ');
    });

    it('formats multiple assignment or combined expression ("ambas en una misma")', () => {
      expect(formatInputToLatex('N = 12/3 = 4')).toBe('N = \\frac{12}{3} = 4');
      expect(formatInputToLatex('12/3 = 4')).toBe('\\frac{12}{3} = 4');
      expect(formatInputToLatex('2x - 2x + 4 = 4')).toBe('2x - 2x + 4 = 4');
    });

    it('formats variable assignment with fraction into vertical LaTeX frac', () => {
      expect(formatInputToLatex('n = 12/3')).toBe('N = \\frac{12}{3}');
      expect(formatInputToLatex('Y = (12+5)/5')).toBe('Y = \\frac{12+5}{5}');
      expect(formatInputToLatex('y = 12+5/5')).toBe('Y = \\frac{12+5}{5}');
    });

    it('formats direct values and expressions without slash', () => {
      expect(formatInputToLatex('4')).toBe('4');
      expect(formatInputToLatex('N = 4')).toBe('N = 4');
      expect(formatInputToLatex('+2')).toBe('+2');
    });

    it('handles empty input gracefully', () => {
      expect(formatInputToLatex('')).toBe('');
      expect(formatInputToLatex('   ')).toBe('');
    });
  });

  describe('evaluateAlgebraicExpression and evaluateUserMathInput', () => {
    it('evaluates direct integers', () => {
      expect(evaluateUserMathInput('4')).toBe(4);
      expect(evaluateUserMathInput('N = 4')).toBe(4);
    });

    it('evaluates fractions (despejes)', () => {
      expect(evaluateUserMathInput('12/3')).toBe(4);
      expect(evaluateUserMathInput('N = 12/3')).toBe(4);
      expect(evaluateUserMathInput('(12+5)/5')).toBeCloseTo(3.4);
      expect(evaluateUserMathInput('12+5/5')).toBeCloseTo(3.4);
    });

    it('evaluates addition and subtraction', () => {
      expect(evaluateUserMathInput('12 - 7')).toBe(5);
      expect(evaluateUserMathInput('N = 1 + 2')).toBe(3);
    });

    it('evaluates comodín reductions where variable cancels out', () => {
      expect(evaluateAlgebraicExpression('2x - 2x + 4')).toBe(4);
      expect(evaluateAlgebraicExpression('(2x + 7) - (2x + 3)')).toBe(4);
      expect(evaluateAlgebraicExpression('2Y - 2Y + 2')).toBe(2);
      expect(evaluateAlgebraicExpression('(2Y + 5) - (2Y + 3)')).toBe(2);
      expect(evaluateAlgebraicExpression('7 - 3')).toBe(4);
      expect(evaluateAlgebraicExpression('5 - 3')).toBe(2);
    });

    it('rejects expressions where variable does NOT cancel out', () => {
      expect(evaluateAlgebraicExpression('2x + 4')).toBeNull();
      expect(evaluateAlgebraicExpression('3N - 2')).toBeNull();
    });
  });

  const card3N12: Card = {
    id: 'yellow_num_4_a',
    color: 'yellow',
    variable: 'N',
    type: 'number',
    value: 4,
    expressionLatex: '3N = 12',
    displayCornerLatex: '3N=12',
    explanationLatex: 'N = \\frac{12}{3} \\implies N = 4',
  };

  const wild4Card: Card = {
    id: 'wild4_1',
    color: 'wild',
    variable: 'x',
    type: 'wild4',
    expressionLatex: '(x + 5) + (x - 1) - 2x',
    displayCornerLatex: '+4',
    explanationLatex: '2x - 2x + (5 - 1) = 4',
  };

  const draw2Card: Card = {
    id: 'green_draw2_1',
    color: 'green',
    variable: 'Y',
    type: 'draw2',
    expressionLatex: '(Y + 3) + (Y - 1) - 2Y',
    displayCornerLatex: '+2',
    explanationLatex: '2Y - 2Y + (3 - 1) = 2',
  };

  describe('checkIsolateAnswer (preguntas dedicadas de Despeje / Distribución)', () => {
    it('accepts fraction isolation and rejects bare numbers for standard equations', () => {
      expect(checkIsolateAnswer('12/3', card3N12)).toBe(true);
      expect(checkIsolateAnswer('N = 12/3', card3N12)).toBe(true);
      expect(checkIsolateAnswer('n = 12/3', card3N12)).toBe(true);
      expect(checkIsolateAnswer('N = 12/3 = 4', card3N12)).toBe(true);

      // Bare numbers must NOT pass when the question specifically asks to isolate
      expect(checkIsolateAnswer('4', card3N12)).toBe(false);
      expect(checkIsolateAnswer('N = 4', card3N12)).toBe(false);
      expect(checkIsolateAnswer('12/4', card3N12)).toBe(false);
    });

    it('accepts algebraic distribution for comodines and rejects bare numbers', () => {
      expect(checkIsolateAnswer('2x - 2x + 4', wild4Card)).toBe(true);
      expect(checkIsolateAnswer('2x - 2x + 7 - 3', wild4Card)).toBe(true);
      expect(checkIsolateAnswer('7 - 3', wild4Card)).toBe(true);
      expect(checkIsolateAnswer('2Y - 2Y + 2', draw2Card)).toBe(true);
      expect(checkIsolateAnswer('5 - 3', draw2Card)).toBe(true);

      // Bare numbers without distribution must fail Step 1 isolate/distribute
      expect(checkIsolateAnswer('4', wild4Card)).toBe(false);
      expect(checkIsolateAnswer('+4', wild4Card)).toBe(false);
      expect(checkIsolateAnswer('2', draw2Card)).toBe(false);
      expect(checkIsolateAnswer('+2', draw2Card)).toBe(false);
    });
  });

  describe('checkSolveAnswer (preguntas dedicadas de Hallar Valor Final)', () => {
    it('accepts final numerical values for standard equations', () => {
      expect(checkSolveAnswer('4', card3N12)).toBe(true);
      expect(checkSolveAnswer('N = 4', card3N12)).toBe(true);
      expect(checkSolveAnswer('n = 4', card3N12)).toBe(true);
      expect(checkSolveAnswer('N = 12/3 = 4', card3N12)).toBe(true);
      expect(checkSolveAnswer('5', card3N12)).toBe(false);
    });

    it('accepts final numerical values for comodines (+4 y +2)', () => {
      expect(checkSolveAnswer('4', wild4Card)).toBe(true);
      expect(checkSolveAnswer('+4', wild4Card)).toBe(true);
      expect(checkSolveAnswer('2', draw2Card)).toBe(true);
      expect(checkSolveAnswer('+2', draw2Card)).toBe(true);
      expect(checkSolveAnswer('2', wild4Card)).toBe(false);
      expect(checkSolveAnswer('4', draw2Card)).toBe(false);
    });
  });

  describe('two_step questions (Paso 1: Despejar/Distribuir -> Paso 2: Resolver)', () => {
    it('validates Step 1 and Step 2 independently for standard equations', () => {
      // Paso 1: Despejar
      expect(checkUserQuizAnswer('N = 12/3', card3N12, 'two_step', 1)).toBe(true);
      expect(checkUserQuizAnswer('12/3', card3N12, 'two_step', 1)).toBe(true);
      expect(checkUserQuizAnswer('4', card3N12, 'two_step', 1)).toBe(false); // No despejó

      // Paso 2: Resolver
      expect(checkUserQuizAnswer('4', card3N12, 'two_step', 2)).toBe(true);
      expect(checkUserQuizAnswer('N = 4', card3N12, 'two_step', 2)).toBe(true);
      expect(checkUserQuizAnswer('5', card3N12, 'two_step', 2)).toBe(false);
    });

    it('validates Step 1 and Step 2 independently for comodines (+4 y +2)', () => {
      // Paso 1: Distribuir comodín
      expect(checkUserQuizAnswer('2x - 2x + 4', wild4Card, 'two_step', 1)).toBe(true);
      expect(checkUserQuizAnswer('7 - 3', wild4Card, 'two_step', 1)).toBe(true);
      expect(checkUserQuizAnswer('4', wild4Card, 'two_step', 1)).toBe(false); // No distribuyó

      // Paso 2: Resolver comodín
      expect(checkUserQuizAnswer('4', wild4Card, 'two_step', 2)).toBe(true);
      expect(checkUserQuizAnswer('+4', wild4Card, 'two_step', 2)).toBe(true);
      expect(checkUserQuizAnswer('2', wild4Card, 'two_step', 2)).toBe(false);
    });
  });

  describe('getCardDespejeLatex & getCardSolutionLatex helpers', () => {
    it('returns proper LaTeX representations for cards', () => {
      expect(getCardDespejeLatex(card3N12)).toContain('\\frac{12}{3}');
      expect(getCardSolutionLatex(card3N12)).toBe('N = 4');

      expect(getCardDespejeLatex(wild4Card)).toBe('2x - 2x + (7 - 3) = 4');
      expect(getCardSolutionLatex(wild4Card)).toBe('+4');

      expect(getCardSolutionLatex(draw2Card)).toBe('+2');
    });
  });

  describe('checkUserQuizAnswer (retrocompatibilidad)', () => {
    it('accepts isolated fraction step, final numeric answer, AND both combined in one for 3N = 12', () => {
      // 1. Solo despeje
      expect(checkUserQuizAnswer('12/3', card3N12)).toBe(true);
      expect(checkUserQuizAnswer('N = 12/3', card3N12)).toBe(true);
      expect(checkUserQuizAnswer('n = 12/3', card3N12)).toBe(true);

      // 2. Solo valor final
      expect(checkUserQuizAnswer('4', card3N12)).toBe(true);
      expect(checkUserQuizAnswer('N = 4', card3N12)).toBe(true);

      // 3. Ambas en una misma expresión
      expect(checkUserQuizAnswer('N = 12/3 = 4', card3N12)).toBe(true);
      expect(checkUserQuizAnswer('12/3 = 4', card3N12)).toBe(true);
      expect(checkUserQuizAnswer('n = 12/3 = 4', card3N12)).toBe(true);

      // 4. Respuestas incorrectas
      expect(checkUserQuizAnswer('5', card3N12)).toBe(false);
      expect(checkUserQuizAnswer('12/4', card3N12)).toBe(false);
      expect(checkUserQuizAnswer('N = 12/3 = 5', card3N12)).toBe(false);
    });

    it('validates draw2 (+2) cards with algebraic reduction, both combined or value', () => {
      expect(checkUserQuizAnswer('2', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('+2', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('2Y - 2Y + 2', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('2Y - 2Y + 2 = 2', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('(2Y + 5) - (2Y + 3)', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('(2Y + 5) - (2Y + 3) = 2', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('5 - 3 = 2', draw2Card)).toBe(true);
      expect(checkUserQuizAnswer('3', draw2Card)).toBe(false);
    });

    it('validates wild4 (+4) cards with algebraic reduction, both combined or value', () => {
      expect(checkUserQuizAnswer('4', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('+4', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('2x - 2x + 4', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('2x - 2x + 4 = 4', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('(2x + 7) - (2x + 3)', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('(2x + 7) - (2x + 3) = 4', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('7 - 3 = 4', wild4Card)).toBe(true);
      expect(checkUserQuizAnswer('2', wild4Card)).toBe(false);
    });

    it('validates skip division by zero cards', () => {
      const skipCard: Card = {
        id: 'red_skip_1',
        color: 'red',
        variable: 'Z',
        type: 'skip',
        expressionLatex: '0Z = 1',
        displayCornerLatex: '0Z=1',
        explanationLatex: '0Z = 1 \\implies Z = \\frac{1}{0}',
      };

      expect(checkUserQuizAnswer('1/0', skipCard)).toBe(true);
      expect(checkUserQuizAnswer('0', skipCard)).toBe(true);
      expect(checkUserQuizAnswer('sin solucion', skipCard)).toBe(true);
      expect(checkUserQuizAnswer('1', skipCard)).toBe(false);
    });
  });
});

