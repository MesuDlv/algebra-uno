import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, CardVariable, COLOR_NAMES_ES } from '../../types/card';
import { Card as VisualCard } from '../card/Card';
import { MathView } from '../common/MathView';
import { soundEffects } from '../../utils/audio';
import { addCoins } from '../../utils/economy';
import {
  Brain,
  Sparkles,
  Coins,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Calculator,
  Check,
  X,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateFullDeck } from '../../engine/deckGenerator';

export type QuizQuestionMode = 'isolate' | 'solve' | 'two_step';

export interface UserPlayedCardQuizItem {
  id: string;
  turnNumber?: number;
  isUserPlayed: boolean;
  card: CardType;
  mode?: QuizQuestionMode;
}

interface PostMatchQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPodium?: () => void;
  onOpenReview?: () => void;
  onFinish?: () => void;
  onExitToLobby?: () => void;
  quizItems?: UserPlayedCardQuizItem[];
  playedCards?: CardType[];
  hasAlreadyCompleted?: boolean;
  earnedCoinsTotal?: number;
  onQuizCompleted?: (coinsEarned: number) => void;
}

const REWARD_PER_CORRECT = 35; // Monedas por cada acierto

/**
 * Convierte una expresión escrita por el usuario a formato LaTeX para KaTeX.
 * Soporta asignaciones múltiples (ej. "N = 12/3 = 4"), fracciones verticales y expresiones algebraicas.
 */
export function formatInputToLatex(input: string, _fallbackVariable?: string): string {
  if (!input || !input.trim()) return '';
  const s = input.trim();

  // Si tiene "=", dividir en segmentos para formatear cada término (ej. "N = 12/3 = 4")
  if (s.includes('=')) {
    const segments = s.split('=').map((seg) => seg.trim());
    const formatted = segments.map((seg) => formatSingleSegmentToLatex(seg));
    return formatted.join(' = ');
  }

  return formatSingleSegmentToLatex(s);
}

function formatSingleSegmentToLatex(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();

  // Si es solo una letra de variable: "N", "x", "Y"
  if (/^[A-Za-z]$/.test(s)) {
    return s.toUpperCase();
  }

  // Manejo de división / fracción:
  if (s.includes('/')) {
    const slashIdx = s.indexOf('/');
    let num = s.slice(0, slashIdx).trim();
    let den = s.slice(slashIdx + 1).trim();

    // Si aún no hay denominador (el usuario acaba de presionar "/"):
    // Mostrar "num / " limpiamente sin romper con un signo de interrogación "?"
    if (!den) {
      const cleanNum = num ? num.replace(/\*/g, '\\cdot ') : '';
      return cleanNum ? `${cleanNum} / ` : '/ ';
    }

    if (num.startsWith('(') && num.endsWith(')')) {
      num = num.slice(1, -1).trim();
    }
    if (den.startsWith('(') && den.endsWith(')')) {
      den = den.slice(1, -1).trim();
    }

    const numLatex = num ? num.replace(/\*/g, '\\cdot ') : '0';
    const denLatex = den ? den.replace(/\*/g, '\\cdot ') : '';
    return `\\frac{${numLatex}}{${denLatex}}`;
  }

  return s.replace(/\*/g, '\\cdot ');
}

/**
 * Evalúa expresiones aritméticas sencillas de forma segura.
 */
function evaluateArithmetic(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  const clean = raw.trim();
  if (!/^[\d\s+\-*().]+$/.test(clean)) return null;

  try {
    const val = new Function(`"use strict"; return (${clean});`)();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return val;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Evalúa expresiones matemáticas, admitiendo:
 * 1) Números directos: 4, +4, 2, +2
 * 2) Fracciones / Despejes: 12/3, (12+5)/5, 12+5/5
 * 3) Operaciones aritméticas: 12 - 7, 7 - 3, 5 - 1
 * 4) Expresiones con variables de comodines que se cancelan: 2x - 2x + 4, 2Y - 2Y + 2
 */
export function evaluateAlgebraicExpression(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  let expr = raw.trim();

  // Si empieza con variable sola ej. "N =" o "Y =", retirarlo
  expr = expr.replace(/^[A-Za-z]\s*=\s*/, '').trim();
  if (!expr) return null;

  // Fracciones simples sin variables
  const varsList = ['x', 'X', 'y', 'Y', 'z', 'Z', 'f', 'F', 'n', 'N'];
  const hasVar = varsList.some((v) => expr.includes(v));

  if (!hasVar && expr.includes('/')) {
    const parts = expr.split('/');
    if (parts.length === 2) {
      const numVal = evaluateArithmetic(parts[0].trim());
      const denVal = evaluateArithmetic(parts[1].trim());
      if (numVal !== null && denVal !== null && denVal !== 0) {
        return numVal / denVal;
      }
    }
  }

  // Si contiene variables algebraicas (comodines o despejes con variables como 2x - 2x + 4):
  if (hasVar) {
    // Normalizar multiplicaciones implícitas: 2x -> 2*x, 3N -> 3*N, 2(x) -> 2*(x)
    let norm = expr
      .replace(/(\d+)\s*([A-Za-z])/g, '$1*$2')
      .replace(/(\d+)\s*\(/g, '$1*(')
      .replace(/\)\s*(\d+)/g, ')*$1');

    // Evaluar en 2 valores distintos para verificar que la variable se cancela
    const test1 = 1;
    const test2 = 7;

    let sub1 = norm;
    let sub2 = norm;
    for (const v of varsList) {
      const reg = new RegExp(`(?<=[^A-Za-z]|^)${v}(?=[^A-Za-z]|$)`, 'g');
      sub1 = sub1.replace(reg, `(${test1})`);
      sub2 = sub2.replace(reg, `(${test2})`);
    }

    const val1 = evaluateArithmetic(sub1);
    const val2 = evaluateArithmetic(sub2);

    if (val1 !== null && val2 !== null && Math.abs(val1 - val2) < 0.001) {
      return val1;
    }
  }

  return evaluateArithmetic(expr);
}

/**
 * Evalúa el input matemático del usuario (función retrocompatible para testing).
 */
export function evaluateUserMathInput(raw: string): number | null {
  return evaluateAlgebraicExpression(raw);
}

/**
 * Retorna la representación del despeje esperado para mostrar en feedback.
 */
export function getCardDespejeLatex(card: CardType): string {
  if (!card) return '';
  if (card.type === 'skip') {
    return `${card.variable} = \\frac{1}{0}`;
  }
  if (card.type === 'wild4') {
    return '2x - 2x + (7 - 3) = 4';
  }
  if (card.type === 'draw2') {
    return `2${card.variable} - 2${card.variable} + (5 - 3) = 2`;
  }
  if (card.explanationLatex) {
    const fracMatch = card.explanationLatex.match(/\\frac\{[^}]+\}\{[^}]+\}/);
    if (fracMatch) {
      return `${card.variable} = ${fracMatch[0]}`;
    }
  }
  return card.expressionLatex;
}

/**
 * Retorna la representación del valor o solución final esperada.
 */
export function getCardSolutionLatex(card: CardType): string {
  if (!card) return '';
  if (card.type === 'skip') {
    return '\\text{Sin solución (División entre 0)}';
  }
  if (card.type === 'wild4') {
    return '+4';
  }
  if (card.type === 'draw2') {
    return '+2';
  }
  return `${card.variable} = ${card.value ?? '?'}`;
}

/**
 * Verifica la respuesta cuando la pregunta pide DESPEJAR o DISTRIBUIR.
 * - Para cartas numéricas: exige la expresión con fracción o despeje (ej. "N = 12/3", "12/3", "(12+5)/5").
 *   NO acepta solo el valor final directo (ej. "4"), ya que el objetivo pedagógico es despejar.
 * - Para comodines (+4, +2): exige la distribución o agrupación algebraica (ej. "2x - 2x + 4", "2x - 2x + 7 - 3", "7 - 3").
 *   NO acepta solo "+4" o "4" sin distribución.
 * - Para skip: exige la división entre cero (ej. "1/0", "0Z = 1").
 */
export function checkIsolateAnswer(input: string, card: CardType): boolean {
  if (!input || !input.trim() || !card) return false;
  const cleanInput = input.trim();
  const lowerInput = cleanInput.toLowerCase().replace(/\s+/g, '');

  if (card.type === 'skip') {
    return lowerInput.includes('/0') || lowerInput.includes('sinsolucion');
  }

  // Comodines (+4 y +2):
  if (card.type === 'wild4' || card.type === 'draw2') {
    const targetVal = card.type === 'wild4' ? 4 : 2;
    const noSpaces = cleanInput.replace(/\s+/g, '');
    // Si solo puso el número final "4" o "+4" o "2" o "+2", NO es un paso de distribución
    if (['4', '+4', '2', '+2'].includes(noSpaces)) {
      return false;
    }

    // Debe contener variables que se cancelan (ej. 2x - 2x + 4) o la resta/suma distribuida (ej. 7 - 3)
    const hasDistOp = cleanInput.includes('-') || cleanInput.includes('+') || cleanInput.includes('*');
    if (!hasDistOp) return false;

    // Si tiene '=', tomar los segmentos que contienen la distribución
    const segments = cleanInput
      .split('=')
      .map((s) => s.trim())
      .filter((s) => s && !/^[A-Za-z]$/.test(s));

    if (segments.length > 0) {
      let anyMatched = false;
      for (const seg of segments) {
        if (seg.includes('-') || seg.includes('+')) {
          const val = evaluateAlgebraicExpression(seg);
          if (val !== null && Math.abs(val - targetVal) < 0.001) {
            anyMatched = true;
          }
        }
      }
      if (anyMatched) return true;
    }

    const fullVal = evaluateAlgebraicExpression(cleanInput);
    return fullVal !== null && Math.abs(fullVal - targetVal) < 0.001;
  }

  // Cartas numéricas estándar:
  const targetVal = typeof card.value === 'number' ? card.value : undefined;
  if (targetVal === undefined) return false;

  // Si solo puso el número final directo (ej. "4" o "N = 4" sin fracción):
  const rawNoVar = cleanInput.replace(/^[A-Za-z]\s*=\s*/, '').trim();
  if (!rawNoVar.includes('/') && !rawNoVar.includes('+') && !rawNoVar.includes('-')) {
    return false;
  }

  // Si tiene '=' (ej. "N = 12/3 = 4" o "N = 12/3"):
  const segments = cleanInput
    .split('=')
    .map((s) => s.trim())
    .filter((s) => s && !/^[A-Za-z]$/.test(s));

  if (segments.length > 0) {
    let hasFraction = false;
    let allValid = true;

    for (const seg of segments) {
      if (seg.includes('/') || seg.includes('+') || seg.includes('-')) {
        hasFraction = true;
      }
      const val = evaluateAlgebraicExpression(seg);
      if (val === null || Math.abs(val - targetVal) >= 0.001) {
        allValid = false;
      }
    }

    if (hasFraction && allValid) return true;
  }

  // Verificación directa de la fracción
  const fullVal = evaluateAlgebraicExpression(cleanInput);
  if (fullVal !== null && Math.abs(fullVal - targetVal) < 0.001 && cleanInput.includes('/')) {
    return true;
  }

  // Verificación simbólica con explanationLatex
  if (card.explanationLatex) {
    const fracMatch = card.explanationLatex.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
    if (fracMatch) {
      const expNum = fracMatch[1].trim();
      const expDen = fracMatch[2].trim();
      if (rawNoVar === `${expNum}/${expDen}` || rawNoVar === `(${expNum})/${expDen}`) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifica la respuesta cuando la pregunta pide RESOLVER / HALLAR EL VALOR FINAL.
 * - Para cartas numéricas: exige o acepta el valor numérico (ej. "4", "N = 4", "n = 4").
 * - Para comodines (+4, +2): acepta el valor final ("4", "+4", "2", "+2").
 * - Para skip: acepta "0", "sin solucion", "indeterminado".
 */
export function checkSolveAnswer(input: string, card: CardType): boolean {
  if (!input || !input.trim() || !card) return false;
  const cleanInput = input.trim();
  const lowerInput = cleanInput.toLowerCase().replace(/\s+/g, '');

  if (card.type === 'skip') {
    return (
      lowerInput.includes('/0') ||
      lowerInput.includes('sinsolucion') ||
      lowerInput.includes('indeterminado') ||
      lowerInput === '0'
    );
  }

  const targetVal =
    typeof card.value === 'number'
      ? card.value
      : card.type === 'draw2'
      ? 2
      : card.type === 'wild4'
      ? 4
      : undefined;

  if (targetVal === undefined) return false;

  // Atajos directos
  if (card.type === 'draw2' && (lowerInput === '2' || lowerInput === '+2')) return true;
  if (card.type === 'wild4' && (lowerInput === '4' || lowerInput === '+4')) return true;

  // Si tiene '=', tomar el último segmento (que suele ser el valor final calculado)
  const segments = cleanInput
    .split('=')
    .map((s) => s.trim())
    .filter((s) => s && !/^[A-Za-z]$/.test(s));

  if (segments.length > 0) {
    const lastSeg = segments[segments.length - 1];
    const val = evaluateAlgebraicExpression(lastSeg);
    if (val !== null && Math.abs(val - targetVal) < 0.001) {
      return true;
    }
  }

  const fullVal = evaluateAlgebraicExpression(cleanInput);
  return fullVal !== null && Math.abs(fullVal - targetVal) < 0.001;
}

/**
 * Función principal para comprobar respuesta, adaptable por modo y paso de la pregunta.
 */
export function checkUserQuizAnswer(
  input: string,
  card: CardType,
  mode?: QuizQuestionMode,
  step: 1 | 2 = 1
): boolean {
  if (!input || !input.trim() || !card) return false;

  if (mode === 'isolate' || (mode === 'two_step' && step === 1)) {
    return checkIsolateAnswer(input, card);
  }
  if (mode === 'solve' || (mode === 'two_step' && step === 2)) {
    return checkSolveAnswer(input, card);
  }

  // Fallback general: acepta despeje o resolución
  return checkIsolateAnswer(input, card) || checkSolveAnswer(input, card);
}

export const PostMatchQuizModal: React.FC<PostMatchQuizModalProps> = ({
  isOpen,
  onClose,
  onOpenPodium,
  onOpenReview,
  onFinish,
  onExitToLobby,
  quizItems = [],
  playedCards = [],
  hasAlreadyCompleted = false,
  earnedCoinsTotal = 0,
  onQuizCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [calculatorInput, setCalculatorInput] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // Control para preguntas de 2 pasos ('two_step')
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Completed, setStep1Completed] = useState<boolean>(false);
  const [step1Correct, setStep1Correct] = useState<boolean>(false);
  const [step1UserAnswer, setStep1UserAnswer] = useState<string>('');

  const resetQuestionState = () => {
    setCalculatorInput('');
    setCurrentStep(1);
    setStep1Completed(false);
    setStep1Correct(false);
    setStep1UserAnswer('');
    setHasSubmitted(false);
    setIsCorrect(false);
  };

  // Reiniciar estado si se abre la prueba y no había sido completada previamente
  useEffect(() => {
    if (isOpen && !hasAlreadyCompleted) {
      setCurrentIndex(0);
      resetQuestionState();
      setCorrectAnswersCount(0);
      setTotalCoinsEarned(0);
      setIsQuizCompleted(false);
    }
  }, [isOpen, hasAlreadyCompleted]);

  // Consolidar preguntas de cartas usadas por el usuario y complementos de la partida
  const finalQuizCards: UserPlayedCardQuizItem[] = useMemo(() => {
    let baseList: UserPlayedCardQuizItem[] = [];

    if (quizItems && quizItems.length > 0) {
      baseList = quizItems.slice(0, 4);
    } else {
      // Fallback si no vinieron quizItems construidos
      const numberCards = (playedCards || []).filter(
        (c) => c && c.expressionLatex
      );

      const uniqueMap = new Map<string, UserPlayedCardQuizItem>();
      numberCards.forEach((c, idx) => {
        if (!uniqueMap.has(c.expressionLatex)) {
          uniqueMap.set(c.expressionLatex, {
            id: `item_${idx}`,
            turnNumber: idx + 1,
            isUserPlayed: true,
            card: c,
          });
        }
      });

      if (uniqueMap.size < 4) {
        try {
          const fullDeck = generateFullDeck().filter((c) => c.expressionLatex);
          const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
          for (const c of shuffled) {
            if (!uniqueMap.has(c.expressionLatex)) {
              uniqueMap.set(c.expressionLatex, {
                id: `fallback_${c.id}`,
                turnNumber: undefined,
                isUserPlayed: false,
                card: c,
              });
            }
            if (uniqueMap.size >= 4) break;
          }
        } catch (err) {
          console.warn('Error fallback deck:', err);
        }
      }

      baseList = Array.from(uniqueMap.values()).slice(0, 4);
    }

    // Variedad pedagógica:
    // Pregunta 1: 'isolate' (Despeje / Distribuir)
    // Pregunta 2: 'solve' (Resolver valor numérico)
    // Pregunta 3: 'two_step' (Paso 1: Despejar -> Paso 2: Resolver)
    // Pregunta 4: 'two_step' (Paso 1: Distribuir comodín / despejar -> Paso 2: Resolver)
    const modesCycle: QuizQuestionMode[] = ['isolate', 'solve', 'two_step', 'two_step'];

    return baseList.map((item, idx) => ({
      ...item,
      mode: item.mode || modesCycle[idx % modesCycle.length],
    }));
  }, [quizItems, playedCards]);

  const currentItem = finalQuizCards[currentIndex] || finalQuizCards[0];
  const currentCard = currentItem?.card;
  const currentMode: QuizQuestionMode = currentItem?.mode || 'isolate';
  const isKeypadDisabled = hasSubmitted || (currentMode === 'two_step' && currentStep === 1 && step1Completed);

  // Manejo de pulsaciones del teclado táctil interactivo
  const handleKeypadPress = useCallback(
    (val: string) => {
      soundEffects.calculatorClick();
      if (hasSubmitted || (currentMode === 'two_step' && currentStep === 1 && step1Completed)) return;

      if (val === 'clear') {
        setCalculatorInput('');
      } else if (val === 'backspace') {
        setCalculatorInput((prev) => prev.slice(0, -1));
      } else if (['Y', 'Z', 'F', 'N', 'x'].includes(val)) {
        setCalculatorInput((prev) => {
          if (!prev && currentMode !== 'solve' && currentStep !== 2) {
            if (currentCard?.type === 'wild4' || currentCard?.type === 'draw2') {
              return val;
            }
            return `${val} = `;
          }
          return prev + val;
        });
      } else if (val === '=') {
        setCalculatorInput((prev) => {
          if (!prev) return '= ';
          if (prev.endsWith(' ')) return `${prev}= `;
          return `${prev} = `;
        });
      } else if (val === '/') {
        setCalculatorInput((prev) => {
          if (!prev) return '/';
          return `${prev.trim()}/`;
        });
      } else if (['+', '-', '*'].includes(val)) {
        setCalculatorInput((prev) => {
          if (!prev) return val;
          if (prev.endsWith(' ')) return `${prev}${val} `;
          return `${prev} ${val} `;
        });
      } else {
        // Caracteres numéricos y paréntesis
        if (calculatorInput.length < 35) {
          setCalculatorInput((prev) => prev + val);
        }
      }
    },
    [hasSubmitted, currentMode, currentStep, step1Completed, currentCard, calculatorInput]
  );

  // Enviar y verificar respuesta según el modo y paso activo
  const handleSubmitAnswer = () => {
    if (hasSubmitted || !currentCard || !calculatorInput.trim()) return;

    if (currentMode === 'two_step') {
      if (currentStep === 1) {
        // Validar Paso 1: Despejar o Distribuir
        const isStep1Ok = checkIsolateAnswer(calculatorInput, currentCard);
        setStep1Completed(true);
        setStep1Correct(isStep1Ok);
        setStep1UserAnswer(calculatorInput);

        if (isStep1Ok) {
          soundEffects.quizCorrect();
          setTotalCoinsEarned((prev) => prev + 20);
          addCoins(20);
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 },
          });
        } else {
          soundEffects.quizIncorrect();
        }
      } else {
        // Validar Paso 2: Resolver
        setHasSubmitted(true);
        const isStep2Ok = checkSolveAnswer(calculatorInput, currentCard);
        setIsCorrect(isStep2Ok);

        if (isStep2Ok) {
          soundEffects.quizCorrect();
          setCorrectAnswersCount((prev) => prev + 1);
          setTotalCoinsEarned((prev) => prev + 20);
          addCoins(20);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } else {
          soundEffects.quizIncorrect();
        }
      }
    } else if (currentMode === 'isolate') {
      setHasSubmitted(true);
      const ok = checkIsolateAnswer(calculatorInput, currentCard);
      setIsCorrect(ok);
      if (ok) {
        soundEffects.quizCorrect();
        setCorrectAnswersCount((prev) => prev + 1);
        setTotalCoinsEarned((prev) => prev + REWARD_PER_CORRECT);
        addCoins(REWARD_PER_CORRECT);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        soundEffects.quizIncorrect();
      }
    } else {
      // currentMode === 'solve'
      setHasSubmitted(true);
      const ok = checkSolveAnswer(calculatorInput, currentCard);
      setIsCorrect(ok);
      if (ok) {
        soundEffects.quizCorrect();
        setCorrectAnswersCount((prev) => prev + 1);
        setTotalCoinsEarned((prev) => prev + REWARD_PER_CORRECT);
        addCoins(REWARD_PER_CORRECT);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        soundEffects.quizIncorrect();
      }
    }
  };

  const handleNextQuestion = () => {
    soundEffects.drawCard();
    if (currentIndex < finalQuizCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetQuestionState();
    } else {
      // Fin de la prueba
      setIsQuizCompleted(true);
      soundEffects.victory();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });

      const finalCoins = totalCoinsEarned;
      if (onQuizCompleted) {
        onQuizCompleted(finalCoins);
      }
    }
  };

  // Atajos de teclado físico para usuarios en computadora
  useEffect(() => {
    if (!isOpen || isQuizCompleted || hasAlreadyCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasSubmitted) {
        if (e.key === 'Enter') {
          handleNextQuestion();
        }
        return;
      }

      if (currentMode === 'two_step' && currentStep === 1 && step1Completed) {
        if (e.key === 'Enter') {
          setCurrentStep(2);
          setCalculatorInput('');
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (['+', '-', '*', '/', '(', ')'].includes(e.key)) {
        handleKeypadPress(e.key);
      } else if (['y', 'Y', 'z', 'Z', 'f', 'F', 'n', 'N', 'x', 'X'].includes(e.key)) {
        handleKeypadPress(e.key.toUpperCase());
      } else if (e.key === '=') {
        handleKeypadPress('=');
      } else if (e.key === 'Backspace') {
        handleKeypadPress('backspace');
      } else if (e.key === 'Enter') {
        if (calculatorInput.trim()) {
          handleSubmitAnswer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    hasSubmitted,
    isQuizCompleted,
    hasAlreadyCompleted,
    currentMode,
    currentStep,
    step1Completed,
    calculatorInput,
    handleKeypadPress,
    handleSubmitAnswer,
    handleNextQuestion,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg rounded-3xl bg-slate-950 border-2 border-amber-400/80 p-5 sm:p-6 shadow-[0_0_80px_rgba(245,158,11,0.4)] text-slate-100 relative overflow-hidden"
          >
            {/* Ambientación dorada y moderna */}
            <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Encabezado */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <Brain className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Prueba Matemática de Partida</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-yellow-300 font-bold border border-amber-400/40">
                      +{REWARD_PER_CORRECT} 🪙 / acierto
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Despeja la incógnita o halla su valor final con el teclado
                  </p>
                </div>
              </div>

              {/* Contador de monedas y botón cerrar para volver al podio */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-yellow-300 text-xs font-black">
                  <Coins className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  <span>+{hasAlreadyCompleted ? earnedCoinsTotal : totalCoinsEarned}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenPodium || onClose}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Volver al podio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ========================================================
                CASO 1: LA PRUEBA YA FUE REALIZADA EN ESTA PARTIDA (BLOQUEO DE REINTENTOS)
            ======================================================== */}
            {hasAlreadyCompleted ? (
              <div className="text-center py-6 space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(52,211,153,0.4)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Prueba Ya Realizada
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Ya completaste la prueba de esta partida. Por políticas de integridad competitiva, solo se permite un intento por juego.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/60 text-yellow-300 text-sm font-black shadow-lg">
                  <Coins className="w-4 h-4 text-yellow-300" />
                  <span>+{earnedCoinsTotal} Monedas ya acreditadas</span>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={onOpenPodium || onClose}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Volver al Podio</span>
                  </button>

                  {onOpenReview && (
                    <button
                      type="button"
                      onClick={onOpenReview}
                      className="flex-1 py-3 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400/50 text-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <TrendingUp className="w-4 h-4 text-cyan-300" />
                      <span>Ver Análisis Táctico</span>
                    </button>
                  )}

                  {onExitToLobby && (
                    <button
                      type="button"
                      onClick={onExitToLobby}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salir a la Sala</span>
                    </button>
                  )}
                </div>
              </div>

            /* ========================================================
                CASO 2: VISTA FINAL DE PRUEBA COMPLETADA
            ======================================================== */
            ) : isQuizCompleted ? (
              <div className="text-center py-6 space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border-2 border-amber-400 text-yellow-300 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    ¡Prueba Finalizada con Éxito!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Acertaste <strong className="text-yellow-300">{correctAnswersCount}</strong> de{' '}
                    <strong>{finalQuizCards.length}</strong> operaciones matemáticas.
                  </p>
                </div>

                {/* Caja de monedas ganadas */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/60 text-yellow-300 text-base font-black shadow-lg">
                  <Coins className="w-5 h-5 text-yellow-300 animate-bounce" />
                  <span>+{totalCoinsEarned} Monedas Acreditadas a tu Perfil</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/40 text-emerald-300 text-xs">
                  <p className="font-semibold">
                    ✅ Opciones desbloqueadas: Ya puedes volver al podio para pedir revancha o salir libremente a la sala.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onFinish) onFinish();
                      if (onOpenPodium) onOpenPodium();
                      else onClose();
                    }}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Volver al Podio</span>
                  </button>

                  {onOpenReview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onFinish) onFinish();
                        onOpenReview();
                      }}
                      className="flex-1 py-3 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400/50 text-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <TrendingUp className="w-4 h-4 text-cyan-300" />
                      <span>Ver Análisis</span>
                    </button>
                  )}

                  {onExitToLobby && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => {
                        if (onFinish) onFinish();
                        onExitToLobby();
                      }}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salir a la Sala</span>
                    </motion.button>
                  )}
                </div>
              </div>

            /* ========================================================
                CASO 3: SIN CARTAS VÁLIDAS
            ======================================================== */
            ) : !currentCard ? (
              <div className="text-center py-8 space-y-3 relative z-10">
                <p className="text-xs text-slate-300">
                  Esta partida no tuvo suficientes cartas con ecuaciones para formular la prueba.
                </p>
                <button
                  type="button"
                  onClick={onOpenPodium || onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
                >
                  Volver al Podio
                </button>
              </div>

            /* ========================================================
                CASO 4: PREGUNTA ACTIVA CON TECLADO TÁCTIL Y FRACCIÓN VERTICAL
            ======================================================== */
            ) : (
              <div className="space-y-3 relative z-10">
                {/* Barra superior de progreso de preguntas */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-amber-300">
                    Pregunta {currentIndex + 1} de {finalQuizCards.length}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentItem.isUserPlayed && currentItem.turnNumber
                      ? `Jugada #${currentItem.turnNumber} de tu partida`
                      : 'Carta de la partida'}
                  </span>
                </div>

                {/* Badge contextual de la carta jugada y modo de pregunta */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        currentItem.isUserPlayed
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {currentItem.isUserPlayed
                          ? `Tu jugada #${currentItem.turnNumber}`
                          : 'Carta de la mesa'}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        currentMode === 'two_step'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : currentMode === 'isolate'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {currentMode === 'two_step'
                        ? `2 Pasos • Paso ${currentStep} de 2`
                        : currentMode === 'isolate'
                        ? currentCard.type === 'wild4' || currentCard.type === 'draw2'
                          ? 'Distribuir Ecuaciones'
                          : 'Despejar Incógnita'
                        : 'Resolver Valor Final'}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {COLOR_NAMES_ES[currentCard.color] || currentCard.color} ({currentCard.variable})
                  </span>
                </div>

                {/* Resumen compacto del Paso 1 cuando estamos en el Paso 2 */}
                {currentMode === 'two_step' && currentStep === 2 && (
                  <div
                    className={`p-2 rounded-xl border text-[11px] flex items-center justify-between font-mono ${
                      step1Correct
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <span>
                      Paso 1 ({currentCard.type === 'wild4' || currentCard.type === 'draw2' ? 'Distribución' : 'Despeje'}):{' '}
                      <strong className="text-white">{step1UserAnswer || '(omitido)'}</strong>
                    </span>
                    <span className="font-bold">
                      {step1Correct ? '✅ Acertado (+20 🪙)' : '❌ Fallado'}
                    </span>
                  </div>
                )}

                {/* Tarjeta Visual de la Carta Jugada con KaTeX */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
                  {/* Carta física miniatura */}
                  <div className="flex-shrink-0">
                    <VisualCard card={currentCard} size="xs" />
                  </div>

                  {/* Operación y pregunta */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {currentMode === 'two_step'
                        ? currentStep === 1
                          ? currentCard.type === 'wild4' || currentCard.type === 'draw2'
                            ? 'Paso 1: Distribuir Ecuaciones'
                            : 'Paso 1: Despejar la Incógnita'
                          : currentCard.type === 'wild4' || currentCard.type === 'draw2'
                          ? 'Paso 2: Sumar / Restar Términos'
                          : 'Paso 2: Hallar Valor Final'
                        : currentMode === 'isolate'
                        ? currentCard.type === 'wild4' || currentCard.type === 'draw2'
                          ? 'Distribuir Ecuaciones'
                          : 'Despejar Incógnita'
                        : 'Hallar Valor Final'}
                    </div>

                    <div className="text-xl sm:text-2xl font-black text-white font-mono bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 inline-block max-w-full overflow-x-auto shadow-inner">
                      <MathView math={currentCard.expressionLatex} />
                    </div>

                    <p className="text-[11px] text-amber-200/90 font-medium leading-tight">
                      {currentMode === 'two_step'
                        ? currentStep === 1
                          ? currentCard.type === 'wild4'
                            ? 'Paso 1 de 2: Distribuye los paréntesis para agrupar términos con 2x (ej. 2x - 2x + 7 - 3 o 2x - 2x + 4):'
                            : currentCard.type === 'draw2'
                            ? `Paso 1 de 2: Distribuye los paréntesis para agrupar términos con 2${currentCard.variable} (ej. 2${currentCard.variable} - 2${currentCard.variable} + 5 - 3 o 5 - 3):`
                            : currentCard.type === 'skip'
                            ? 'Paso 1 de 2: Escribe la división entre cero que genera la carta (ej. 1/0):'
                            : `Paso 1 de 2: Despeja la incógnita ${currentCard.variable} (ej. ${currentCard.variable} = 12/3 o 12/3):`
                          : currentCard.type === 'wild4'
                          ? 'Paso 2 de 2: Ahora suma o resta los números para hallar el valor final del comodín (+4 o 4):'
                          : currentCard.type === 'draw2'
                          ? 'Paso 2 de 2: Ahora suma o resta los números para hallar el valor final del comodín (+2 o 2):'
                          : currentCard.type === 'skip'
                          ? 'Paso 2 de 2: Indica el resultado matemático (ej. sin solución o 0):'
                          : `Paso 2 de 2: Ahora calcula el valor numérico final de ${currentCard.variable} (ej. ${currentCard.value}):`
                        : currentMode === 'isolate'
                        ? currentCard.type === 'wild4'
                          ? 'Distribuye los paréntesis para agrupar términos con 2x (ej. 2x - 2x + 7 - 3 o 2x - 2x + 4):'
                          : currentCard.type === 'draw2'
                          ? `Distribuye los paréntesis para agrupar términos con 2${currentCard.variable} (ej. 2${currentCard.variable} - 2${currentCard.variable} + 5 - 3 o 5 - 3):`
                          : currentCard.type === 'skip'
                          ? 'Escribe la división entre cero que genera la indeterminación (ej. 1/0):'
                          : `Despeja la incógnita ${currentCard.variable} (ej. ${currentCard.variable} = 12/3 o 12/3):`
                        : currentCard.type === 'wild4'
                        ? 'Calcula el valor numérico final del comodín (+4 o 4):'
                        : currentCard.type === 'draw2'
                        ? 'Calcula cuántas cartas hace robar el comodín (+2 o 2):'
                        : currentCard.type === 'skip'
                        ? 'Indica el resultado matemático (ej. sin solución o 0):'
                        : `Calcula el valor numérico final de ${currentCard.variable} (ej. ${currentCard.value}):`}
                    </p>
                  </div>
                </div>

                {/* ========================================================
                    PANTALLA MATEMÁTICA EN TIEMPO REAL CON FRACCIÓN VERTICAL
                ======================================================== */}
                <div className="p-3 rounded-2xl bg-slate-950 border-2 border-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.2)] space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {currentMode === 'two_step'
                          ? `Pantalla (${currentStep === 1 ? 'Paso 1: Despeje/Distribución' : 'Paso 2: Valor Final'})`
                          : currentMode === 'isolate'
                          ? 'Pantalla de Despeje / Distribución'
                          : 'Pantalla de Resolución'}
                      </span>
                    </span>
                    {calculatorInput && !hasSubmitted && !(currentMode === 'two_step' && currentStep === 1 && step1Completed) && (
                      <button
                        type="button"
                        onClick={() => setCalculatorInput('')}
                        className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer font-bold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="min-h-[64px] flex items-center justify-center p-2 rounded-xl bg-black/70 border border-white/15 text-yellow-300 font-mono text-xl sm:text-2xl font-black overflow-x-auto shadow-inner">
                    {calculatorInput.trim() ? (
                      <MathView math={formatInputToLatex(calculatorInput, currentCard.variable)} displayMode={true} />
                    ) : (
                      <span className="text-slate-500 text-xs sm:text-sm font-sans font-normal italic">
                        {currentMode === 'two_step'
                          ? currentStep === 1
                            ? currentCard.type === 'wild4'
                              ? 'Paso 1: ej. 2x - 2x + 4 o 7 - 3'
                              : `Paso 1: ej. ${currentCard.variable} = 12/3 o 12/3`
                            : currentCard.type === 'wild4'
                            ? 'Paso 2: ej. 4 o +4'
                            : `Paso 2: ej. ${currentCard.value ?? '?'}`
                          : currentMode === 'isolate'
                          ? currentCard.type === 'wild4'
                            ? 'ej. 2x - 2x + 4 o 7 - 3'
                            : `ej. ${currentCard.variable} = 12/3 o 12/3`
                          : currentCard.type === 'wild4'
                          ? 'ej. 4 o +4'
                          : `ej. ${currentCard.value ?? '?'}`}
                      </span>
                    )}
                  </div>

                  {calculatorInput.trim() && (
                    <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] text-slate-400 font-mono">
                      <span>Texto escrito: <strong className="text-amber-300">{calculatorInput}</strong></span>
                      <span className="text-[10px] text-slate-500">Usa / para fracción</span>
                    </div>
                  )}
                </div>

                {/* ========================================================
                    TECLADO TÁCTIL MATEMÁTICO INTEGRAL (SIN OPCIONES MÚLTIPLES)
                ======================================================== */}
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-white/10 space-y-2">
                  {/* Fila 1: Variables de la baraja */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Variables:
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['Y', 'Z', 'F', 'N', 'x'] as CardVariable[]).map((v) => {
                        const isCurrent = currentCard.variable === v;
                        const colorBadge =
                          v === 'Y'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                            : v === 'Z'
                            ? 'bg-rose-950/70 text-rose-300 border-rose-500/40 hover:bg-rose-900/80'
                            : v === 'F'
                            ? 'bg-sky-950/70 text-sky-300 border-sky-500/40 hover:bg-sky-900/80'
                            : v === 'N'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-500/40 hover:bg-amber-900/80'
                            : 'bg-purple-950/70 text-purple-300 border-purple-500/40 hover:bg-purple-900/80';

                        return (
                          <button
                            key={v}
                            type="button"
                            disabled={isKeypadDisabled}
                            onClick={() => handleKeypadPress(v)}
                            className={`py-2 rounded-xl font-mono text-sm sm:text-base font-black border transition cursor-pointer active:scale-95 disabled:opacity-40 ${colorBadge} ${
                              isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950' : ''
                            }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fila 2: Operadores y símbolos */}
                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress('=')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-amber-300 font-mono text-sm font-black active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      =
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress('/')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-amber-300 font-mono text-sm font-black active:scale-95 cursor-pointer disabled:opacity-40"
                      title="Fracción / División"
                    >
                      /
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress('(')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-slate-200 font-mono text-sm font-bold active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      (
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress(')')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-slate-200 font-mono text-sm font-bold active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      )
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled || !calculatorInput}
                      onClick={() => handleKeypadPress('clear')}
                      className="py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-mono text-xs font-black active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      C
                    </button>
                  </div>

                  {/* Fila 3 y Fila 4: Operaciones aritméticas y dígitos */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress('+')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-emerald-300 font-mono text-sm font-black active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress('-')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-rose-300 font-mono text-sm font-black active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled}
                      onClick={() => handleKeypadPress('*')}
                      className="py-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/15 text-cyan-300 font-mono text-sm font-black active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      disabled={isKeypadDisabled || !calculatorInput}
                      onClick={() => handleKeypadPress('backspace')}
                      className="py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 font-bold text-xs active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Bloque numérico 0-9 */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {['7', '8', '9', '4', '5'].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={isKeypadDisabled}
                        onClick={() => handleKeypadPress(n)}
                        className="py-2 rounded-lg bg-black/50 hover:bg-white/10 border border-white/15 text-white font-mono text-sm font-bold active:scale-95 cursor-pointer disabled:opacity-40"
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {['6', '1', '2', '3', '0'].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={isKeypadDisabled}
                        onClick={() => handleKeypadPress(n)}
                        className="py-2 rounded-lg bg-black/50 hover:bg-white/10 border border-white/15 text-white font-mono text-sm font-bold active:scale-95 cursor-pointer disabled:opacity-40"
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Retroalimentación intermedia del Paso 1 en preguntas de 2 pasos */}
                  {!hasSubmitted && currentMode === 'two_step' && currentStep === 1 && step1Completed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-2xl border text-xs space-y-2.5 mt-2 ${
                        step1Correct
                          ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {step1Correct ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>¡Paso 1 Correcto! Despeje / Distribución acertada (+20 🪙)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Paso 1 Incorrecto. Despeje o distribución esperada:</span>
                          </>
                        )}
                      </div>

                      {!step1Correct && (
                        <div className="text-[11px] bg-black/60 p-2 rounded-xl text-amber-300 font-mono border border-white/10">
                          <MathView math={getCardDespejeLatex(currentCard)} />
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          setCalculatorInput('');
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                      >
                        <span>Continuar al Paso 2: Hallar Valor Final</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Botón principal de comprobar respuesta */}
                  {!hasSubmitted && !(currentMode === 'two_step' && currentStep === 1 && step1Completed) && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      disabled={!calculatorInput.trim()}
                      onClick={handleSubmitAnswer}
                      className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>
                        {currentMode === 'two_step'
                          ? currentStep === 1
                            ? currentCard.type === 'wild4' || currentCard.type === 'draw2'
                              ? 'Comprobar Paso 1: Distribuir Ecuación'
                              : 'Comprobar Paso 1: Despejar'
                            : 'Comprobar Paso 2: Hallar Valor Final'
                          : currentMode === 'isolate'
                          ? currentCard.type === 'wild4' || currentCard.type === 'draw2'
                            ? 'Comprobar Distribución'
                            : 'Comprobar Despeje'
                          : 'Comprobar Valor Final'}
                      </span>
                    </motion.button>
                  )}
                </div>

                {/* ========================================================
                    RETROALIMENTACIÓN DESPUÉS DE ENVIAR
                ======================================================== */}
                {hasSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                      isCorrect
                        ? 'bg-emerald-950/90 border-emerald-400/90 text-emerald-200'
                        : 'bg-rose-950/90 border-rose-500/90 text-rose-200'
                    }`}
                  >
                    <div className="flex flex-col gap-1 font-bold">
                      {currentMode === 'two_step' ? (
                        <>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-amber-300 font-extrabold uppercase tracking-wide">
                              Resumen de los 2 Pasos:
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                              +{(step1Correct ? 20 : 0) + (isCorrect ? 20 : 0)} 🪙 Ganadas
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div
                              className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                                step1Correct
                                  ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300'
                                  : 'bg-rose-900/40 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              {step1Correct ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="text-[11px]">
                                Paso 1: {step1Correct ? 'Correcto (+20 🪙)' : 'Incorrecto'}
                              </span>
                            </div>
                            <div
                              className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                                isCorrect
                                  ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-300'
                                  : 'bg-rose-900/40 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="text-[11px]">
                                Paso 2: {isCorrect ? 'Correcto (+20 🪙)' : 'Incorrecto'}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>¡EXCELENTE! Respuesta Correcta (+{REWARD_PER_CORRECT} Monedas 🪙)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-rose-400" />
                                <span>
                                  Incorrecto. Solución:{' '}
                                  {currentMode === 'isolate'
                                    ? getCardDespejeLatex(currentCard)
                                    : getCardSolutionLatex(currentCard)}
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] bg-black/60 p-2.5 rounded-xl text-white font-mono border border-white/10 space-y-1">
                      <div className="text-[10px] text-amber-300/80 uppercase font-black tracking-wider mb-0.5">
                        Resolución completa paso a paso:
                      </div>
                      {currentCard.explanationLatex ? (
                        <MathView math={currentCard.explanationLatex} />
                      ) : (
                        <div className="space-y-1 text-slate-200">
                          <div>
                            <span className="text-amber-400 font-bold">1. Despeje/Distribución: </span>
                            <MathView math={getCardDespejeLatex(currentCard)} />
                          </div>
                          <div>
                            <span className="text-amber-400 font-bold">2. Valor Final: </span>
                            <MathView math={getCardSolutionLatex(currentCard)} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                      >
                        <span>
                          {currentIndex < finalQuizCards.length - 1
                            ? 'Siguiente Pregunta'
                            : 'Ver Resultados Finales'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
