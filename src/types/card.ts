export type CardColor = 'green' | 'red' | 'blue' | 'yellow' | 'wild';

export type CardVariable = 'Y' | 'Z' | 'F' | 'N' | 'x';

export type CardType = 
  | 'number'       // Ecuación con solución 0-9
  | 'skip'         // Indeterminación (/0)
  | 'reverse'      // Desigualdad invertida (* -1)
  | 'draw2'        // Expresión espejo que da 2
  | 'wild'         // Comodín cambio de color ("Sea x cualquier variable")
  | 'wild4';       // Comodín +4 espejo con desafío

export interface Card {
  id: string;                      // Identificador único (ej. "green_num_2_a", "wild4_1")
  color: CardColor;                // Color de la carta (green, red, blue, yellow, wild)
  variable: CardVariable;          // Letra central grande (Y, Z, F, N, x)
  type: CardType;                  // Tipo de carta
  value?: number;                  // Solución matemática (0-9 para numéricas, undefined para especiales)
  expressionLatex: string;         // Ecuación o expresión en LaTeX para KaTeX
  displayCornerLatex: string;      // Expresión compacta para las esquinas de la carta
  explanationLatex: string;        // Justificación paso a paso para el Modo Ayuda
  metadata?: {
    // Verificación matemática para testing riguroso
    evalFn?: (val: number) => number; // Para evaluar expresiones algebraicas f(x)
    equationLhs?: (val: number) => number;
    equationRhs?: (val: number) => number;
    denominator?: number;
    invertedFrom?: string;
  };
}

export const COLOR_VARIABLES: Record<Exclude<CardColor, 'wild'>, CardVariable> = {
  green: 'Y',
  red: 'Z',
  blue: 'F',
  yellow: 'N'
};

export const COLOR_HEX: Record<CardColor, string> = {
  green: '#009B48',
  red: '#ED1C24',
  blue: '#0055A5',
  yellow: '#FFDE00',
  wild: '#1E1E1E'
};

export const COLOR_NAMES_ES: Record<CardColor, string> = {
  green: 'Verde',
  red: 'Rojo',
  blue: 'Azul',
  yellow: 'Amarillo',
  wild: 'Comodín'
};
