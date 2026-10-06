import { Card, CardColor, COLOR_VARIABLES } from '../types/card';

interface NumberEquationTemplate {
  latex: (v: string) => string;
  cornerLatex: (v: string) => string;
  explanation: (v: string, sol: number) => string;
  lhs: (val: number) => number;
  rhs: (val: number) => number;
}

// Plantillas matemáticas parametrizadas para ecuaciones numéricas 0-9
const NUMBER_EQUATION_TEMPLATES: Record<number, { a: NumberEquationTemplate; b: NumberEquationTemplate }> = {
  0: {
    a: {
      latex: (v) => `${v} + 5 = 5`,
      cornerLatex: (v) => `${v}+5=5`,
      explanation: (v, sol) => `${v} = 5 - 5 \\implies ${v} = ${sol}`,
      lhs: (val) => val + 5,
      rhs: () => 5,
    },
    b: {
      latex: (v) => `4${v} = 0`,
      cornerLatex: (v) => `4${v}=0`,
      explanation: (v, sol) => `${v} = \\frac{0}{4} \\implies ${v} = ${sol}`,
      lhs: (val) => 4 * val,
      rhs: () => 0,
    },
  },
  1: {
    a: {
      latex: (v) => `${v} + 3 = 4`,
      cornerLatex: (v) => `${v}+3=4`,
      explanation: (v, sol) => `${v} = 4 - 3 \\implies ${v} = ${sol}`,
      lhs: (val) => val + 3,
      rhs: () => 4,
    },
    b: {
      latex: (v) => `3${v} - 1 = 2`,
      cornerLatex: (v) => `3${v}-1=2`,
      explanation: (v, sol) => `3${v} = 3 \\implies ${v} = ${sol}`,
      lhs: (val) => 3 * val - 1,
      rhs: () => 2,
    },
  },
  2: {
    a: {
      latex: (v) => `2 + ${v} = 4`,
      cornerLatex: (v) => `2+${v}=4`,
      explanation: (v, sol) => `${v} = 4 - 2 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 + val,
      rhs: () => 4,
    },
    b: {
      latex: (v) => `4${v} = 8`,
      cornerLatex: (v) => `4${v}=8`,
      explanation: (v, sol) => `${v} = \\frac{8}{4} \\implies ${v} = ${sol}`,
      lhs: (val) => 4 * val,
      rhs: () => 8,
    },
  },
  3: {
    a: {
      latex: (v) => `${v} - 2 = 1`,
      cornerLatex: (v) => `${v}-2=1`,
      explanation: (v, sol) => `${v} = 1 + 2 \\implies ${v} = ${sol}`,
      lhs: (val) => val - 2,
      rhs: () => 1,
    },
    b: {
      latex: (v) => `2${v} + 3 = 9`,
      cornerLatex: (v) => `2${v}+3=9`,
      explanation: (v, sol) => `2${v} = 6 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 * val + 3,
      rhs: () => 9,
    },
  },
  4: {
    a: {
      latex: (v) => `3${v} = 12`,
      cornerLatex: (v) => `3${v}=12`,
      explanation: (v, sol) => `${v} = \\frac{12}{3} \\implies ${v} = ${sol}`,
      lhs: (val) => 3 * val,
      rhs: () => 12,
    },
    b: {
      latex: (v) => `2(${v} + 1) = 10`,
      cornerLatex: (v) => `2(${v}+1)=10`,
      explanation: (v, sol) => `${v} + 1 = 5 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 * (val + 1),
      rhs: () => 10,
    },
  },
  5: {
    a: {
      latex: (v) => `${v} + 7 = 12`,
      cornerLatex: (v) => `${v}+7=12`,
      explanation: (v, sol) => `${v} = 12 - 7 \\implies ${v} = ${sol}`,
      lhs: (val) => val + 7,
      rhs: () => 12,
    },
    b: {
      latex: (v) => `3${v} - 5 = 10`,
      cornerLatex: (v) => `3${v}-5=10`,
      explanation: (v, sol) => `3${v} = 15 \\implies ${v} = ${sol}`,
      lhs: (val) => 3 * val - 5,
      rhs: () => 10,
    },
  },
  6: {
    a: {
      latex: (v) => `2${v} + 2 = 14`,
      cornerLatex: (v) => `2${v}+2=14`,
      explanation: (v, sol) => `2${v} = 12 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 * val + 2,
      rhs: () => 14,
    },
    b: {
      latex: (v) => `4${v} = 24`,
      cornerLatex: (v) => `4${v}=24`,
      explanation: (v, sol) => `${v} = \\frac{24}{4} \\implies ${v} = ${sol}`,
      lhs: (val) => 4 * val,
      rhs: () => 24,
    },
  },
  7: {
    a: {
      latex: (v) => `${v} - 3 = 4`,
      cornerLatex: (v) => `${v}-3=4`,
      explanation: (v, sol) => `${v} = 4 + 3 \\implies ${v} = ${sol}`,
      lhs: (val) => val - 3,
      rhs: () => 4,
    },
    b: {
      latex: (v) => `2${v} - 5 = 9`,
      cornerLatex: (v) => `2${v}-5=9`,
      explanation: (v, sol) => `2${v} = 14 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 * val - 5,
      rhs: () => 9,
    },
  },
  8: {
    a: {
      latex: (v) => `3${v} = 24`,
      cornerLatex: (v) => `3${v}=24`,
      explanation: (v, sol) => `${v} = \\frac{24}{3} \\implies ${v} = ${sol}`,
      lhs: (val) => 3 * val,
      rhs: () => 24,
    },
    b: {
      latex: (v) => `2(${v} - 1) = 14`,
      cornerLatex: (v) => `2(${v}-1)=14`,
      explanation: (v, sol) => `${v} - 1 = 7 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 * (val - 1),
      rhs: () => 14,
    },
  },
  9: {
    a: {
      latex: (v) => `${v} + 6 = 15`,
      cornerLatex: (v) => `${v}+6=15`,
      explanation: (v, sol) => `${v} = 15 - 6 \\implies ${v} = ${sol}`,
      lhs: (val) => val + 6,
      rhs: () => 15,
    },
    b: {
      latex: (v) => `2${v} + 1 = 19`,
      cornerLatex: (v) => `2${v}+1=19`,
      explanation: (v, sol) => `2${v} = 18 \\implies ${v} = ${sol}`,
      lhs: (val) => 2 * val + 1,
      rhs: () => 19,
    },
  },
};

// Generador completo de las 108 cartas
export function generateFullDeck(): Card[] {
  const deck: Card[] = [];
  const colors: Array<Exclude<CardColor, 'wild'>> = ['green', 'red', 'blue', 'yellow'];

  colors.forEach((color) => {
    const v = COLOR_VARIABLES[color];

    // 1. Carta "0" (1 por color)
    const t0 = color === 'green' || color === 'blue' 
      ? NUMBER_EQUATION_TEMPLATES[0].a 
      : NUMBER_EQUATION_TEMPLATES[0].b;
    deck.push({
      id: `${color}_num_0`,
      color,
      variable: v,
      type: 'number',
      value: 0,
      expressionLatex: t0.latex(v),
      displayCornerLatex: t0.cornerLatex(v),
      explanationLatex: t0.explanation(v, 0),
      metadata: {
        equationLhs: t0.lhs,
        equationRhs: t0.rhs,
      },
    });

    // 2. Cartas numéricas 1 a 9 (2 por número por color = 18 cartas)
    for (let num = 1; num <= 9; num++) {
      const template = NUMBER_EQUATION_TEMPLATES[num];

      // Versión A
      deck.push({
        id: `${color}_num_${num}_a`,
        color,
        variable: v,
        type: 'number',
        value: num,
        expressionLatex: template.a.latex(v),
        displayCornerLatex: template.a.cornerLatex(v),
        explanationLatex: template.a.explanation(v, num),
        metadata: {
          equationLhs: template.a.lhs,
          equationRhs: template.a.rhs,
        },
      });

      // Versión B
      deck.push({
        id: `${color}_num_${num}_b`,
        color,
        variable: v,
        type: 'number',
        value: num,
        expressionLatex: template.b.latex(v),
        displayCornerLatex: template.b.cornerLatex(v),
        explanationLatex: template.b.explanation(v, num),
        metadata: {
          equationLhs: template.b.lhs,
          equationRhs: template.b.rhs,
        },
      });
    }

    // 3. Cartas de Bloqueo (2 por color): Ecuaciones con 0·V = k (k ≠ 0) que implican división entre cero
    const skipExpressions = [
      {
        latex: `0${v} = 1`,
        corner: `0${v} = 1`,
        explanation: `0${v} = 1 \\implies ${v} = \\frac{1}{0} \\implies \\text{División entre cero / Sin solución (Salta turno)}`,
      },
      {
        latex: color === 'yellow' ? `2 + 0${v} = 4` : `0${v} = 4`,
        corner: color === 'yellow' ? `2 + 0${v} = 4` : `0${v} = 4`,
        explanation: color === 'yellow'
          ? `2 + 0${v} = 4 \\implies 0${v} = 2 \\implies ${v} = \\frac{2}{0} \\implies \\text{División entre cero (Salta turno)}`
          : `0${v} = 4 \\implies ${v} = \\frac{4}{0} \\implies \\text{División entre cero / Sin solución (Salta turno)}`,
      },
    ];

    skipExpressions.forEach((exp, idx) => {
      deck.push({
        id: `${color}_skip_${idx + 1}`,
        color,
        variable: v,
        type: 'skip',
        expressionLatex: exp.latex,
        displayCornerLatex: exp.corner,
        explanationLatex: exp.explanation,
        metadata: {
          denominator: 0,
        },
      });
    });

    // 4. Cartas de Cambio de Sentido (2 por color): Desigualdad compacta que invierte sentido por (-1)
    const reverseExpressions = [
      {
        latex: `(${v} > 2) \\cdot (-1) \\to -${v} < -2`,
        corner: `(${v} > 2) \\cdot (-1) \\to -${v} < -2`,
        explanation: `\\text{Al multiplicar por } (-1) \\text{ la desigualdad invierte su sentido } ( > \\to < )`,
        invertedFrom: `(${v} > 2) \\cdot (-1)`,
      },
      {
        latex: `(${v} \\le 3) \\cdot (-1) \\to -${v} \\ge -3`,
        corner: `(${v} \\le 3) \\cdot (-1) \\to -${v} \\ge -3`,
        explanation: `\\text{Al multiplicar por } (-1) \\text{ la desigualdad invierte su sentido } ( \\le \\to \\ge )`,
        invertedFrom: `(${v} \\le 3) \\cdot (-1)`,
      },
    ];

    reverseExpressions.forEach((exp, idx) => {
      deck.push({
        id: `${color}_reverse_${idx + 1}`,
        color,
        variable: v,
        type: 'reverse',
        expressionLatex: exp.latex,
        displayCornerLatex: exp.corner,
        explanationLatex: exp.explanation,
        metadata: {
          invertedFrom: exp.invertedFrom,
        },
      });
    });

    // 5. Cartas +2 (2 por color): Expresión espejo que simplifica a 2 (sin "= 2")
    const draw2Expressions = [
      {
        latex: `(${v} + 3) + (${v} - 1) - 2${v}`,
        corner: `(${v} + 3) + (${v} - 1) - 2${v}`,
        explanation: `2${v} - 2${v} + (3 - 1) = 2 \\quad \\forall ${v}`,
        evalFn: (val: number) => (val + 3) + (val - 1) - 2 * val,
      },
      {
        latex: `(2${v} + 5) - (2${v} + 3)`,
        corner: `(2${v} + 5) - (2${v} + 3)`,
        explanation: `(2${v} - 2${v}) + (5 - 3) = 2 \\quad \\forall ${v}`,
        evalFn: (val: number) => (2 * val + 5) - (2 * val + 3),
      },
    ];

    draw2Expressions.forEach((exp, idx) => {
      deck.push({
        id: `${color}_draw2_${idx + 1}`,
        color,
        variable: v,
        type: 'draw2',
        expressionLatex: exp.latex,
        displayCornerLatex: exp.corner,
        explanationLatex: exp.explanation,
        metadata: {
          evalFn: exp.evalFn,
        },
      });
    });
  });

  // 6. Comodines +4 (4 cartas): Expresión espejo en variable x que simplifica a 4 (sin "= 4")
  const wild4Expressions = [
    {
      latex: `(x + 5) + (x - 1) - 2x`,
      corner: `(x + 5) + (x - 1) - 2x`,
      explanation: `2x - 2x + (5 - 1) = 4 \\quad \\forall x`,
      evalFn: (x: number) => (x + 5) + (x - 1) - 2 * x,
    },
    {
      latex: `(2x + 7) - (2x + 3)`,
      corner: `(2x + 7) - (2x + 3)`,
      explanation: `(2x - 2x) + (7 - 3) = 4 \\quad \\forall x`,
      evalFn: (x: number) => (2 * x + 7) - (2 * x + 3),
    },
    {
      latex: `(3x + 6) + (x - 2) - 4x`,
      corner: `(3x + 6) + (x - 2) - 4x`,
      explanation: `4x - 4x + (6 - 2) = 4 \\quad \\forall x`,
      evalFn: (x: number) => (3 * x + 6) + (x - 2) - 4 * x,
    },
    {
      latex: `(x + 9) - (x + 5)`,
      corner: `(x + 9) - (x + 5)`,
      explanation: `(x - x) + (9 - 5) = 4 \\quad \\forall x`,
      evalFn: (x: number) => (x + 9) - (x + 5),
    },
  ];

  wild4Expressions.forEach((exp, idx) => {
    deck.push({
      id: `wild4_${idx + 1}`,
      color: 'wild',
      variable: 'x',
      type: 'wild4',
      expressionLatex: exp.latex,
      displayCornerLatex: exp.corner,
      explanationLatex: `${exp.explanation} \\implies \\text{Roba 4 cartas y elige color}`,
      metadata: {
        evalFn: exp.evalFn,
      },
    });
  });

  // 7. Comodines de Cambio de Color (4 cartas): "Sea x cualquier variable" con Y, Z, F, N
  for (let idx = 1; idx <= 4; idx++) {
    deck.push({
      id: `wild_${idx}`,
      color: 'wild',
      variable: 'x',
      type: 'wild',
      expressionLatex: `\\text{Sea } x \\in \\{Y, Z, F, N\\}`,
      displayCornerLatex: `x \\in \\{Y, Z, F, N\\}`,
      explanationLatex: `\\text{Comodín: Sea } x \\text{ cualquier variable. Elige color}`,
    });
  }

  return deck;
}
