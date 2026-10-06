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
  id: string;                    // Identificador único (ej. "green_2_a", "wild4_1")
  color: CardColor;              // Color de la carta
  variable: CardVariable;        // Letra central (Y, Z, F, N o x)
  type: CardType;                // Tipo de carta
  value?: number;                // Valor numérico (0-9 para cartas numéricas)
  expressionLatex: string;       // Ecuación o expresión en formato LaTeX para KaTeX
  explanationLatex?: string;     // Pasos o justificación matemática (para modo ayuda)
}
