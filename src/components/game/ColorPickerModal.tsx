import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardColor } from '../../types/card';
import { MathView } from '../common/MathView';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
}

const COLORS: Array<{
  color: CardColor;
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

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onSelectColor }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.82, opacity: 0, y: 25 }}
            transition={{ type: 'spring', damping: 22, stiffness: 340 }}
            className="w-full max-w-sm sm:max-w-md p-6 sm:p-7 bg-slate-900/95 border-2 border-white/20 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center relative overflow-hidden"
          >
            {/* Resplandor decorativo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-white/15">
                <span>🎨</span>
                <span>Comodín de Color</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                Elige el Color Activo
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-6">
                Selecciona la variable algebraica para cambiar el juego
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {COLORS.map((item) => (
                  <motion.button
                    key={item.color}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onSelectColor(item.color)}
                    className={`relative group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${item.gradient} border-2 ${item.borderColor} shadow-xl ${item.glow} cursor-pointer transition-all duration-200 overflow-hidden`}
                  >
                    {/* Efecto de brillo diagonal */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />

                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-black/25 backdrop-blur-xs border border-white/40 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                      <span className="text-2xl sm:text-3xl font-black text-white font-serif drop-shadow-md">
                        <MathView math={item.variable} />
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider drop-shadow">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
