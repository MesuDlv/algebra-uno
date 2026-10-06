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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="w-full max-w-sm p-6 bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl text-center"
          >
            <h3 className="text-xl font-bold text-white mb-1">
              Elige el Color Activo
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Selecciona la variable algebraica para continuar la partida
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              {COLORS.map((item) => (
                <motion.button
                  key={item.color}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectColor(item.color)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${item.gradient} border-2 ${item.borderColor} shadow-lg ${item.glow} transition-all duration-200`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 shadow-inner">
                    <span className="text-2xl font-black text-white font-serif">
                      <MathView math={item.variable} />
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-sm">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
