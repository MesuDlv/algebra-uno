import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { Card } from '../card/Card';
import { MathView } from '../common/MathView';
import { Flame, RotateCw, RotateCcw, HelpCircle } from 'lucide-react';

interface TableCenterProps {
  topDiscardCard: CardType | null;
  activeColor: CardColor;
  accumulatedDrawCount: number;
  deckCount: number;
  direction: 1 | -1;
  isMyTurn: boolean;
  lastAction: string | null;
  onDrawCard: () => void;
  onZoomCard?: (card: CardType) => void;
}

const COLOR_NAMES: Record<CardColor, { name: string; variable: string; bg: string; border: string }> = {
  green: { name: 'Verde', variable: 'Y', bg: 'bg-emerald-500', border: 'border-emerald-300' },
  red: { name: 'Rojo', variable: 'Z', bg: 'bg-rose-500', border: 'border-rose-300' },
  blue: { name: 'Azul', variable: 'F', bg: 'bg-sky-500', border: 'border-sky-300' },
  yellow: { name: 'Amarillo', variable: 'N', bg: 'bg-amber-400', border: 'border-amber-200' },
  wild: { name: 'Comodín', variable: 'x', bg: 'bg-purple-600', border: 'border-purple-300' },
};

export const TableCenter: React.FC<TableCenterProps> = ({
  topDiscardCard,
  activeColor,
  accumulatedDrawCount,
  deckCount,
  direction,
  isMyTurn,
  lastAction,
  onDrawCard,
  onZoomCard,
}) => {
  const activeColorInfo = COLOR_NAMES[activeColor] || COLOR_NAMES.green;

  return (
    <div className="relative flex flex-col items-center justify-center w-full my-auto px-4 py-2 select-none">
      {/* Banner de acumulación (+2 / +4 Stacking) */}
      <AnimatePresence>
        {accumulatedDrawCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 border border-amber-300 text-white shadow-lg shadow-orange-500/40 flex items-center gap-2 animate-pulse"
          >
            <Flame className="w-5 h-5 text-yellow-200" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase">
              ¡Castigo Acumulado: +{accumulatedDrawCount} Cartas!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centro: Mazo de Robo + Pila de Descarte */}
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {/* Mazo de Robo boca abajo */}
        <div className="flex flex-col items-center">
          <motion.div
            whileHover={isMyTurn ? { scale: 1.05 } : {}}
            whileTap={isMyTurn ? { scale: 0.95 } : {}}
            onClick={isMyTurn ? onDrawCard : undefined}
            className={`w-28 h-40 sm:w-36 sm:h-52 rounded-2xl sm:rounded-3xl cursor-pointer relative overflow-hidden transition-all duration-300 ${
              isMyTurn
                ? 'ring-4 ring-amber-400 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50'
                : 'ring-1 ring-slate-700/80 opacity-90'
            }`}
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
            }}
          >
            {/* Dorso estilo ALGEBRA UNO */}
            <div className="absolute inset-1.5 rounded-xl sm:rounded-2xl border-2 border-indigo-400/40 flex flex-col items-center justify-center p-2 text-center">
              <div className="w-14 h-20 sm:w-20 sm:h-28 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500 -rotate-45 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xs sm:text-base tracking-tighter rotate-45 font-mono drop-shadow">
                  ALGEBRA
                </span>
              </div>
              <div className="mt-2 text-[10px] sm:text-xs font-bold text-indigo-200">
                {deckCount} cartas
              </div>
            </div>

            {/* Brillo si es tu turno de robar */}
            {isMyTurn && (
              <div className="absolute inset-x-0 bottom-1 text-center">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 uppercase shadow tracking-wider">
                  Toca p/ Robar
                </span>
              </div>
            )}
          </motion.div>
          <span className="mt-1 text-[11px] font-semibold text-slate-400">Mazo</span>
        </div>

        {/* Pila de Descarte con la carta superior */}
        <div className="flex flex-col items-center relative">
          {topDiscardCard ? (
            <div className="relative group">
              <motion.div
                key={topDiscardCard.id}
                initial={{ scale: 0.85, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="transform scale-75 sm:scale-90 origin-center"
              >
                <Card card={topDiscardCard} />
              </motion.div>

              {/* Botón para ver explicación / zoom */}
              {onZoomCard && (
                <button
                  onClick={() => onZoomCard(topDiscardCard)}
                  className="absolute -top-1 -right-1 p-1.5 rounded-full bg-slate-900/90 text-amber-300 hover:text-white border border-slate-700 shadow-md backdrop-blur-sm z-20"
                  title="Ver explicación algebraica"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-28 h-40 sm:w-36 sm:h-52 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs">
              Vacío
            </div>
          )}
          <span className="mt-1 text-[11px] font-semibold text-slate-400">Descarte</span>
        </div>
      </div>

      {/* Indicador de Color Activo y Dirección */}
      <div className="mt-3 flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md shadow-inner">
        {/* Dirección de juego */}
        <div
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-300"
          title={direction === 1 ? 'Sentido Horario' : 'Sentido Antihorario'}
        >
          {direction === 1 ? (
            <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400 animate-spin-reverse-slow" />
          )}
          <span className="text-[10px] hidden sm:inline">
            {direction === 1 ? 'Horario' : 'Antihorario'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-700" />

        {/* Color Activo */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Color:</span>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${activeColorInfo.bg} text-white font-bold text-xs border ${activeColorInfo.border} shadow-sm`}
          >
            <span>{activeColorInfo.name}</span>
            <span className="font-serif">
              (<MathView math={activeColorInfo.variable} />)
            </span>
          </div>
        </div>
      </div>

      {/* Última acción de la partida */}
      {lastAction && (
        <div className="mt-2 text-center text-[11px] sm:text-xs text-slate-400 font-medium px-4 truncate max-w-sm">
          {lastAction}
        </div>
      )}
    </div>
  );
};
