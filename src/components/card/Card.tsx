import { motion } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { MathView } from '../common/MathView';

export interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPlayable?: boolean;
  isSelected?: boolean;
  showSolution?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const COLOR_CLASSES: Record<CardColor, { bg: string; text: string; border: string; glow: string }> = {
  green: {
    bg: 'bg-gradient-to-br from-emerald-400 via-green-600 to-emerald-800',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.7)]',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-900',
    text: 'text-red-700',
    border: 'border-red-300',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.7)]',
  },
  blue: {
    bg: 'bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900',
    text: 'text-blue-700',
    border: 'border-blue-300',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.7)]',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600',
    text: 'text-amber-700',
    border: 'border-yellow-200',
    glow: 'shadow-[0_0_20px_rgba(250,204,21,0.7)]',
  },
  wild: {
    bg: 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black',
    text: 'text-neutral-900',
    border: 'border-neutral-400',
    glow: 'shadow-[0_0_25px_rgba(255,255,255,0.7)]',
  },
};

const SIZE_CONFIG = {
  sm: {
    container: 'w-16 h-24 rounded-xl border-2 text-[10px]',
    oval: 'inset-x-[-18%] inset-y-[20%]',
    centerVar: 'text-2xl',
    cornerExpr: 'scale-[0.55] origin-top-left',
    cornerExprBottom: 'scale-[0.55] origin-bottom-right',
  },
  md: {
    container: 'w-24 h-36 rounded-2xl border-[3px] text-xs',
    oval: 'inset-x-[-18%] inset-y-[18%]',
    centerVar: 'text-4xl',
    cornerExpr: 'scale-[0.75] origin-top-left',
    cornerExprBottom: 'scale-[0.75] origin-bottom-right',
  },
  lg: {
    container: 'w-36 h-52 rounded-3xl border-4 text-sm',
    oval: 'inset-x-[-15%] inset-y-[16%]',
    centerVar: 'text-6xl',
    cornerExpr: 'scale-90 origin-top-left',
    cornerExprBottom: 'scale-90 origin-bottom-right',
  },
  xl: {
    container: 'w-56 h-80 rounded-[32px] border-[5px] text-base',
    oval: 'inset-x-[-12%] inset-y-[14%]',
    centerVar: 'text-8xl',
    cornerExpr: 'scale-100 origin-top-left',
    cornerExprBottom: 'scale-100 origin-bottom-right',
  },
};

export function Card({
  card,
  size = 'md',
  isPlayable = false,
  isSelected = false,
  showSolution = false,
  onClick,
  className = '',
  disabled = false,
}: CardProps) {
  const colorTheme = COLOR_CLASSES[card.color];
  const sizeTheme = SIZE_CONFIG[size];

  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.05, y: -6 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative select-none flex flex-col justify-between p-2 overflow-hidden
        ${sizeTheme.container}
        ${colorTheme.bg}
        border-white
        ${isPlayable ? `${colorTheme.glow} ring-4 ring-white animate-pulse` : 'uno-card-shadow'}
        ${isSelected ? 'ring-4 ring-yellow-300 scale-105 z-20 -translate-y-4' : ''}
        ${disabled ? 'opacity-60 cursor-not-allowed filter grayscale-[20%]' : 'cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
    >
      {/* 1. Esquina Superior Izquierda: Ecuación o Tipo */}
      <div className={`absolute top-1.5 left-1.5 max-w-[80%] text-left z-10 ${sizeTheme.cornerExpr}`}>
        <div className="bg-black/40 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md font-mono font-bold shadow-sm whitespace-nowrap">
          <MathView math={card.displayCornerLatex || card.expressionLatex} />
        </div>
      </div>

      {/* 2. Centro Ovalado Blanco en Diagonal (Estilo UNO clásico) */}
      <div
        className={`
          absolute ${sizeTheme.oval} bg-white rounded-[50%] 
          transform -rotate-[26deg] flex items-center justify-center 
          shadow-[inset_0_4px_12px_rgba(0,0,0,0.25)] border-[2px] border-black/10
          overflow-hidden z-0
        `}
      >
        {/* Letra Central Grande: Variable (Y, Z, F, N, o x) */}
        <span
          className={`
            font-black italic font-display tracking-tighter transform rotate-[26deg]
            ${sizeTheme.centerVar}
            ${card.color === 'wild' ? 'bg-gradient-to-r from-red-600 via-green-600 to-blue-600 bg-clip-text text-transparent' : colorTheme.text}
            drop-shadow-md select-none
          `}
        >
          {card.variable}
        </span>

        {/* Decoración para cartas Wild (4 esquinas con los 4 colores del UNO) */}
        {card.color === 'wild' && (
          <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-wrap">
            <div className="w-1/2 h-1/2 bg-red-600" />
            <div className="w-1/2 h-1/2 bg-blue-600" />
            <div className="w-1/2 h-1/2 bg-yellow-400" />
            <div className="w-1/2 h-1/2 bg-green-600" />
          </div>
        )}
      </div>

      {/* 3. Esquina Inferior Derecha: Ecuación Invertida */}
      <div className={`absolute bottom-1.5 right-1.5 max-w-[80%] text-right z-10 rotate-180 ${sizeTheme.cornerExprBottom}`}>
        <div className="bg-black/40 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md font-mono font-bold shadow-sm whitespace-nowrap">
          <MathView math={card.displayCornerLatex || card.expressionLatex} />
        </div>
      </div>

      {/* 4. Badge flotante para Modo Ayuda (si está activo) */}
      {showSolution && (
        <div className="absolute bottom-1 left-1 z-20 bg-black/85 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-400/50 shadow-md">
          {card.type === 'number' && `Sol: ${card.value}`}
          {card.type === 'skip' && 'Bloqueo'}
          {card.type === 'reverse' && 'Sentido'}
          {card.type === 'draw2' && '+2'}
          {card.type === 'wild4' && '+4 Comodín'}
          {card.type === 'wild' && 'Comodín'}
        </div>
      )}
    </motion.button>
  );
}
