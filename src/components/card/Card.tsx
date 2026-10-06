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

const COLOR_CLASSES: Record<CardColor, { bg: string; text: string; glow: string; border: string }> = {
  green: {
    bg: 'bg-gradient-to-br from-emerald-400 via-green-600 to-emerald-800',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    glow: 'shadow-[0_0_25px_rgba(52,211,153,0.8)]',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-900',
    text: 'text-red-700',
    border: 'border-red-200',
    glow: 'shadow-[0_0_25px_rgba(244,63,94,0.8)]',
  },
  blue: {
    bg: 'bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900',
    text: 'text-blue-700',
    border: 'border-blue-200',
    glow: 'shadow-[0_0_25px_rgba(56,189,248,0.8)]',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600',
    text: 'text-amber-700',
    border: 'border-yellow-200',
    glow: 'shadow-[0_0_25px_rgba(250,204,21,0.8)]',
  },
  wild: {
    bg: 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black',
    text: 'text-neutral-900',
    border: 'border-neutral-300',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.75)]',
  },
};

const SIZE_CONFIG = {
  sm: {
    container: 'w-28 h-42 rounded-2xl border-2 text-xs',
    oval: 'inset-x-[-12%] inset-y-[16%]',
    centerVar: 'text-5xl',
    headerPadding: 'px-2 py-0.5',
    mathClass: 'text-[10px] sm:text-xs',
  },
  md: {
    container: 'w-44 h-64 sm:w-52 sm:h-76 rounded-3xl border-4 text-sm',
    oval: 'inset-x-[-10%] inset-y-[14%]',
    centerVar: 'text-7xl sm:text-8xl',
    headerPadding: 'px-3 py-1',
    mathClass: 'text-xs sm:text-sm',
  },
  lg: {
    container: 'w-60 h-88 sm:w-72 sm:h-[430px] rounded-[32px] border-[5px] text-base',
    oval: 'inset-x-[-8%] inset-y-[12%]',
    centerVar: 'text-9xl',
    headerPadding: 'px-4 py-1.5',
    mathClass: 'text-sm sm:text-base',
  },
  xl: {
    container: 'w-80 h-[480px] rounded-[40px] border-[6px] text-lg',
    oval: 'inset-x-[-6%] inset-y-[10%]',
    centerVar: 'text-[120px]',
    headerPadding: 'px-5 py-2',
    mathClass: 'text-base sm:text-lg',
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

  // Expresión a mostrar en las zonas superior e inferior
  const expression = card.displayCornerLatex || card.expressionLatex;

  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.04, y: -6 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative select-none flex flex-col justify-between p-2 sm:p-2.5 overflow-hidden
        ${sizeTheme.container}
        ${colorTheme.bg}
        border-white
        ${isPlayable ? `${colorTheme.glow} ring-4 ring-white animate-pulse` : 'uno-card-shadow'}
        ${isSelected ? 'ring-4 ring-yellow-300 scale-105 z-20 -translate-y-4' : ''}
        ${disabled ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
    >
      {/* 1. Header Superior: Expresión Matemática Completa */}
      <div className="z-10 w-full flex items-center justify-between">
        <div
          className={`
            bg-black/55 backdrop-blur-sm text-white rounded-lg border border-white/20 
            shadow-md overflow-hidden text-center max-w-full
            ${sizeTheme.headerPadding}
          `}
        >
          <MathView math={expression} className={`${sizeTheme.mathClass} font-mono font-bold leading-tight`} />
        </div>
      </div>

      {/* 2. Centro Ovalado Blanco en Diagonal (Estilo UNO clásico) */}
      <div
        className={`
          absolute ${sizeTheme.oval} bg-white rounded-[50%] 
          transform -rotate-[26deg] flex flex-col items-center justify-center 
          shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)] border-[3px] border-black/10
          overflow-hidden z-0
        `}
      >
        {/* Letra Central Grande: Variable (Y, Z, F, N, o x) */}
        <span
          className={`
            font-black italic font-display tracking-tighter transform rotate-[26deg]
            ${sizeTheme.centerVar}
            ${card.color === 'wild' ? 'bg-gradient-to-r from-red-600 via-green-600 to-blue-600 bg-clip-text text-transparent' : colorTheme.text}
            drop-shadow-md select-none leading-none
          `}
        >
          {card.variable}
        </span>

        {/* Sub-badge central para tipo de acción */}
        <div className="transform rotate-[26deg] mt-1 z-10">
          {card.type === 'wild4' && (
            <span className="bg-neutral-900 text-yellow-300 font-black px-2 py-0.5 rounded-full text-[10px] sm:text-xs border border-yellow-400/50 shadow">
              +4 COMODÍN
            </span>
          )}
          {card.type === 'wild' && (
            <span className="bg-neutral-900 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] border border-white/30 shadow flex items-center gap-1">
              <span className="text-green-400 font-mono">Y</span>
              <span className="text-red-400 font-mono">Z</span>
              <span className="text-blue-400 font-mono">F</span>
              <span className="text-yellow-400 font-mono">N</span>
            </span>
          )}
          {card.type === 'draw2' && (
            <span className="bg-black/80 text-white font-black px-2 py-0.5 rounded-full text-[10px] sm:text-xs shadow">
              +2
            </span>
          )}
          {card.type === 'skip' && (
            <span className="bg-black/80 text-white font-black px-2 py-0.5 rounded-full text-[10px] sm:text-xs shadow">
              ⊘ SALTO
            </span>
          )}
          {card.type === 'reverse' && (
            <span className="bg-black/80 text-white font-black px-2 py-0.5 rounded-full text-[10px] sm:text-xs shadow">
              ⇄ SENTIDO
            </span>
          )}
        </div>

        {/* Cuadrantes de 4 colores de fondo para comodines */}
        {card.color === 'wild' && (
          <div className="absolute inset-0 pointer-events-none opacity-15 flex flex-wrap">
            <div className="w-1/2 h-1/2 bg-red-600" />
            <div className="w-1/2 h-1/2 bg-blue-600" />
            <div className="w-1/2 h-1/2 bg-yellow-400" />
            <div className="w-1/2 h-1/2 bg-green-600" />
          </div>
        )}
      </div>

      {/* 3. Footer Inferior: Expresión Invertida o Badge de Ayuda */}
      <div className="z-10 w-full flex items-center justify-between">
        {showSolution ? (
          <div className="bg-black/80 text-yellow-300 font-black px-2 py-0.5 rounded-md text-[10px] sm:text-xs border border-yellow-400/50 shadow">
            {card.type === 'number' && `Sol: ${card.value}`}
            {card.type === 'skip' && 'Indet. (/0)'}
            {card.type === 'reverse' && 'Invierte (·-1)'}
            {card.type === 'draw2' && 'Valor: 2'}
            {card.type === 'wild4' && 'Valor: 4'}
            {card.type === 'wild' && 'Comodín'}
          </div>
        ) : (
          <div />
        )}

        {/* Expresión en esquina inferior invertida */}
        <div
          className={`
            bg-black/55 backdrop-blur-sm text-white rounded-lg border border-white/20 
            shadow-md overflow-hidden text-center transform rotate-180
            ${sizeTheme.headerPadding}
          `}
        >
          <MathView math={expression} className={`${sizeTheme.mathClass} font-mono font-bold leading-tight`} />
        </div>
      </div>
    </motion.button>
  );
}
