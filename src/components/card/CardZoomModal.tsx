import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, COLOR_NAMES_ES } from '../../types/card';
import { Card } from './Card';
import { MathView } from '../common/MathView';
import { X, Play, HelpCircle } from 'lucide-react';

interface CardZoomModalProps {
  card: CardType | null;
  onClose: () => void;
  onPlay?: (card: CardType) => void;
  isPlayable?: boolean;
  showSolution?: boolean;
}

export function CardZoomModal({
  card,
  onClose,
  onPlay,
  isPlayable = false,
  showSolution = true,
}: CardZoomModalProps) {
  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        {/* Backdrop clickable */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Card Box */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-sm bg-neutral-900 border-2 border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-white/60">
              {COLOR_NAMES_ES[card.color]} • Variable {card.variable}
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              {card.type === 'number' && `Carta Numérica (Valor ${card.value})`}
              {card.type === 'skip' && 'Carta de Bloqueo'}
              {card.type === 'reverse' && 'Cambio de Sentido'}
              {card.type === 'draw2' && 'Carta +2 (Roba Dos)'}
              {card.type === 'wild4' && 'Comodín +4 (Roba Cuatro)'}
              {card.type === 'wild' && 'Comodín de Color'}
            </h3>
          </div>

          {/* Big Card Display */}
          <div className="my-2">
            <Card card={card} size="lg" disabled />
          </div>

          {/* Math Expression Details */}
          <div className="w-full mt-4 bg-black/50 border border-white/10 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 mb-2">
              <HelpCircle size={15} />
              <span>EXPRESIÓN ALGEBRAICA:</span>
            </div>
            
            <div className="text-center py-2 bg-neutral-800/80 rounded-xl mb-3 overflow-x-auto">
              <MathView math={card.expressionLatex} displayMode className="text-lg text-white font-mono" />
            </div>

            {showSolution && card.explanationLatex && (
              <div className="text-xs text-white/80 border-t border-white/10 pt-2">
                <span className="font-bold text-emerald-400 block mb-1">Explicación paso a paso:</span>
                <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-2 text-center text-emerald-200">
                  <MathView math={card.explanationLatex} displayMode={false} />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="w-full flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-colors"
            >
              Cerrar
            </button>

            {onPlay && isPlayable && (
              <button
                type="button"
                onClick={() => {
                  onPlay(card);
                  onClose();
                }}
                className="flex-2 py-3 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
              >
                <Play size={16} fill="white" />
                <span>JUGAR CARTA</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
