import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { MathView } from '../common/MathView';

export interface CardProps {
  card: CardType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hand' | 'table';
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
  // Tamaño dinámico optimizado para la mano del jugador (compacto en móvil, amplio y nítido en PC)
  hand: {
    container: 'w-[72px] h-[106px] sm:w-[82px] sm:h-[120px] md:w-[100px] md:h-[146px] lg:w-[114px] lg:h-[166px] xl:w-[126px] xl:h-[184px] 2xl:w-[136px] 2xl:h-[198px] rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 lg:border-3 text-[10px] md:text-xs p-1 sm:p-1.5 lg:p-2',
    oval: 'inset-x-[-12%] inset-y-[14%]',
    centerVar: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
    headerPadding: 'px-1 py-0.5 sm:px-1.5 sm:py-0.5 lg:px-2 lg:py-1 xl:px-2.5 xl:py-1',
    mathClass: 'text-[7.5px] sm:text-[9px] md:text-[11px] lg:text-[12.5px] xl:text-[14px]',
    subBadge: 'text-[6.5px] sm:text-[8px] md:text-[9.5px] lg:text-[10.5px] xl:text-[11.5px] px-1 py-0.2 lg:px-2 lg:py-0.5',
  },
  // Tamaño dinámico para la carta de descarte en el centro de la mesa (elegante, visible y bien proporcionada en PC)
  table: {
    container: 'w-[78px] h-[114px] sm:w-[88px] sm:h-[128px] md:w-[112px] md:h-[162px] lg:w-[130px] lg:h-[188px] xl:w-[144px] xl:h-[210px] 2xl:w-[154px] 2xl:h-[224px] rounded-2xl lg:rounded-3xl border-2 lg:border-3 p-1.5 sm:p-2 lg:p-2.5 xl:p-3',
    oval: 'inset-x-[-10%] inset-y-[13%]',
    centerVar: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl',
    headerPadding: 'px-1.5 py-0.5 md:px-2.5 md:py-1 lg:px-3 lg:py-1.5 xl:px-3.5 xl:py-1.5',
    mathClass: 'text-[8.5px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base',
    subBadge: 'text-[7.5px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm px-1.5 py-0.5 md:px-2 md:py-0.5 xl:px-2.5 xl:py-1',
  },
  xs: {
    container: 'w-[72px] h-[106px] sm:w-[82px] sm:h-[120px] md:w-[96px] md:h-[142px] lg:w-[108px] lg:h-[158px] rounded-xl md:rounded-2xl border-2 md:border-3 text-[10px] md:text-xs p-1 sm:p-1.5 md:p-2',
    oval: 'inset-x-[-14%] inset-y-[14%]',
    centerVar: 'text-3xl sm:text-4xl md:text-5xl',
    headerPadding: 'px-1 py-0.2 md:px-2 md:py-0.5',
    mathClass: 'text-[8px] sm:text-[9px] md:text-[11px] lg:text-xs',
    subBadge: 'text-[7px] sm:text-[8px] md:text-[9px] px-1 py-0.2 md:px-1.5 md:py-0.5',
  },
  sm: {
    container: 'w-[84px] h-[122px] sm:w-[94px] sm:h-[138px] md:w-[114px] md:h-[168px] lg:w-[128px] lg:h-[188px] rounded-2xl border-2 md:border-3 text-xs md:text-sm p-1.5 sm:p-2 md:p-2.5',
    oval: 'inset-x-[-12%] inset-y-[14%]',
    centerVar: 'text-4xl sm:text-5xl md:text-6xl',
    headerPadding: 'px-1.5 py-0.5 md:px-2.5 md:py-1',
    mathClass: 'text-[9px] sm:text-[11px] md:text-xs lg:text-sm',
    subBadge: 'text-[8px] sm:text-[10px] md:text-xs px-1.5 py-0.2 md:px-2 md:py-0.5',
  },
  md: {
    container: 'w-32 h-48 sm:w-40 sm:h-58 md:w-48 md:h-72 rounded-3xl border-3 md:border-4 text-sm md:text-base p-2 sm:p-2.5 md:p-3',
    oval: 'inset-x-[-10%] inset-y-[14%]',
    centerVar: 'text-6xl sm:text-7xl md:text-8xl',
    headerPadding: 'px-3 py-1 md:px-4 md:py-1.5',
    mathClass: 'text-xs sm:text-sm md:text-base',
    subBadge: 'text-[10px] sm:text-xs md:text-sm px-2 py-0.5 md:px-2.5 md:py-1',
  },
  lg: {
    container: 'w-52 h-76 sm:w-60 sm:h-88 md:w-68 md:h-98 rounded-[28px] border-4 text-base p-3 md:p-4',
    oval: 'inset-x-[-8%] inset-y-[12%]',
    centerVar: 'text-8xl md:text-9xl',
    headerPadding: 'px-4 py-1.5 md:px-5 md:py-2',
    mathClass: 'text-sm sm:text-base md:text-lg',
    subBadge: 'text-xs sm:text-sm md:text-base px-2.5 py-0.5 md:px-3 md:py-1',
  },
  xl: {
    container: 'w-64 h-96 sm:w-72 sm:h-[420px] rounded-[36px] border-[5px] text-lg p-4',
    oval: 'inset-x-[-6%] inset-y-[10%]',
    centerVar: 'text-[110px]',
    headerPadding: 'px-5 py-2',
    mathClass: 'text-base sm:text-lg',
    subBadge: 'text-sm sm:text-base px-3 py-1',
  },
};

export const Card = React.memo(function Card({
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
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      whileHover={!disabled ? { scale: 1.04, y: -6 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        relative select-none flex flex-col justify-between overflow-hidden
        ${sizeTheme.container}
        ${colorTheme.bg}
        border-white
        ${isPlayable ? `${colorTheme.glow} ring-3 sm:ring-4 ring-white animate-pulse` : 'uno-card-shadow'}
        ${isSelected ? 'ring-4 ring-yellow-300 scale-105 z-20 -translate-y-4' : ''}
        ${disabled ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
    >
      {/* Brillo especular diagonal translúcido (Efecto carta plastificada UNO Mobile) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/5 to-transparent pointer-events-none rounded-inherit z-20" />
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
        <div className="transform rotate-[26deg] mt-0.5 z-10">
          {card.type === 'wild4' && (
            <span className={`bg-neutral-900 text-yellow-300 font-black rounded-full border border-yellow-400/50 shadow ${sizeTheme.subBadge}`}>
              +4 COMODÍN
            </span>
          )}
          {card.type === 'wild' && (
            <span className={`bg-neutral-900 text-white font-extrabold rounded-full border border-white/30 shadow flex items-center gap-0.5 ${sizeTheme.subBadge}`}>
              <span className="text-green-400 font-mono">Y</span>
              <span className="text-red-400 font-mono">Z</span>
              <span className="text-blue-400 font-mono">F</span>
              <span className="text-yellow-400 font-mono">N</span>
            </span>
          )}
          {card.type === 'draw2' && (
            <span className={`bg-black/80 text-white font-black rounded-full shadow ${sizeTheme.subBadge}`}>
              +2
            </span>
          )}
          {card.type === 'skip' && (
            <span className={`bg-black/80 text-white font-black rounded-full shadow ${sizeTheme.subBadge}`}>
              ⊘ SALTO
            </span>
          )}
          {card.type === 'reverse' && (
            <span className={`bg-black/80 text-white font-black rounded-full shadow ${sizeTheme.subBadge}`}>
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
    </motion.div>
  );
});
