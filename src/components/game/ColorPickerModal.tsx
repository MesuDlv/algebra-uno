import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardColor } from '../../types/card';
import { MathView } from '../common/MathView';
import { Eye, Sparkles } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
  hand?: Card[];
  pendingCardId?: string;
}

const COLORS: Array<{
  color: Exclude<CardColor, 'wild'>;
  variable: string;
  label: string;
  gradient: string;
  borderColor: string;
  glow: string;
}> = [
  {
    color: 'green',
    variable: 'Y',
    label: 'Verde (Y)',
    gradient: 'from-emerald-500 to-green-700',
    borderColor: 'border-emerald-300',
    glow: 'shadow-emerald-500/50',
  },
  {
    color: 'red',
    variable: 'Z',
    label: 'Rojo (Z)',
    gradient: 'from-rose-500 to-red-700',
    borderColor: 'border-rose-300',
    glow: 'shadow-rose-500/50',
  },
  {
    color: 'blue',
    variable: 'F',
    label: 'Azul (F)',
    gradient: 'from-sky-500 to-blue-700',
    borderColor: 'border-sky-300',
    glow: 'shadow-sky-500/50',
  },
  {
    color: 'yellow',
    variable: 'N',
    label: 'Amarillo (N)',
    gradient: 'from-amber-400 to-yellow-600',
    borderColor: 'border-amber-200',
    glow: 'shadow-yellow-500/50',
  },
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onSelectColor,
  hand = [],
  pendingCardId,
}) => {
  // Filtrar la carta que se está jugando para ver exactamente las cartas restantes en mano
  const remainingHand = hand.filter((c) => c.id !== pendingCardId);

  // Conteo de cartas por color
  const colorCounts: Record<Exclude<CardColor, 'wild'>, number> = {
    green: remainingHand.filter((c) => c.color === 'green').length,
    red: remainingHand.filter((c) => c.color === 'red').length,
    blue: remainingHand.filter((c) => c.color === 'blue').length,
    yellow: remainingHand.filter((c) => c.color === 'yellow').length,
  };

  const maxCount = Math.max(
    colorCounts.green,
    colorCounts.red,
    colorCounts.blue,
    colorCounts.yellow
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md select-none overflow-y-auto">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="w-full max-w-sm sm:max-w-md p-5 sm:p-6 bg-slate-900/95 border-2 border-white/20 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center relative overflow-hidden"
          >
            {/* Resplandor decorativo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Comodín de Color</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                Elige el Color Activo
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4">
                Elige el color que más te convenga según tus cartas
              </p>

              {/* Grid de los 4 colores */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {COLORS.map((item) => {
                  const count = colorCounts[item.color];
                  const isBest = maxCount > 0 && count === maxCount;

                  return (
                    <motion.button
                      key={item.color}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectColor(item.color)}
                      className={`relative group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${item.gradient} border-2 ${item.borderColor} shadow-xl ${item.glow} cursor-pointer transition-all duration-200 overflow-hidden`}
                    >
                      {/* Efecto de brillo diagonal */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />

                      {/* Badge si es el color con más cartas en mano */}
                      {isBest && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-full bg-yellow-300 text-slate-950 font-black text-[9px] uppercase shadow-md flex items-center gap-0.5">
                          <span>⭐</span>
                          <span>Te Conviene</span>
                        </div>
                      )}

                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/30 backdrop-blur-xs border border-white/40 flex items-center justify-center mb-1 shadow-inner group-hover:scale-110 transition-transform">
                        <span className="text-xl sm:text-2xl font-black text-white font-serif drop-shadow-md">
                          <MathView math={item.variable} />
                        </span>
                      </div>

                      <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider drop-shadow">
                        {item.label}
                      </span>

                      {/* Contador de cartas que tienes de este color */}
                      <span className="text-[10px] sm:text-[11px] font-black text-white/95 mt-0.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/20">
                        {count > 0 ? `Tienes ${count} ${count === 1 ? 'carta' : 'cartas'}` : 'Sin cartas de este color'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Vista previa de las cartas que tienes en la mano */}
              {remainingHand.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      Tus cartas restantes ({remainingHand.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Desliza para verlas
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {remainingHand.map((card) => {
                      const colorBorder =
                        card.color === 'green'
                          ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200'
                          : card.color === 'red'
                          ? 'border-rose-400 bg-rose-950/80 text-rose-200'
                          : card.color === 'blue'
                          ? 'border-sky-400 bg-sky-950/80 text-sky-200'
                          : card.color === 'yellow'
                          ? 'border-amber-400 bg-amber-950/80 text-amber-200'
                          : 'border-purple-400 bg-purple-950/80 text-purple-200';

                      return (
                        <div
                          key={card.id}
                          className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl border-2 shadow-sm text-center min-w-[62px] ${colorBorder}`}
                        >
                          <div className="text-sm font-black font-serif leading-none">
                            <MathView math={card.variable} />
                          </div>
                          <div className="text-[9px] font-bold mt-0.5 truncate max-w-[54px] opacity-90">
                            <MathView math={card.displayCornerLatex || card.expressionLatex} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
