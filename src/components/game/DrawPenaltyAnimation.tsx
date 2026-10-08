import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertTriangle } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

interface DrawPenaltyAnimationProps {
  count: number;
  onComplete: () => void;
}

export const DrawPenaltyAnimation: React.FC<DrawPenaltyAnimationProps> = ({
  count,
  onComplete,
}) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    soundEffects.attack();
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm select-none"
      >
        <div className="relative flex flex-col items-center">
          {/* Fondo de resplandor ígneo */}
          <div className="absolute -inset-10 bg-gradient-to-r from-red-600/30 via-orange-500/30 to-amber-500/30 blur-3xl rounded-full" />

          {/* Banner de castigo acumulado */}
          <motion.div
            initial={{ scale: 0.4, y: -50, rotate: -8 }}
            animate={{ scale: [0.9, 1.15, 1], y: 0, rotate: [0, 4, -3, 0] }}
            transition={{ duration: 0.6, type: 'spring', damping: 15 }}
            className="mb-8 sm:mb-12 px-6 sm:px-8 py-3.5 sm:py-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-black text-xl sm:text-3xl tracking-wider uppercase shadow-[0_0_50px_rgba(239,68,68,0.6)] border-4 border-yellow-300 flex items-center gap-3 drop-shadow-2xl relative z-10"
          >
            <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 animate-bounce" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-xs text-yellow-200 font-extrabold tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                PENALIZACIÓN ACUMULADA
              </span>
              <span className="leading-tight">¡TE COMISTE +{count} CARTAS!</span>
            </div>
          </motion.div>

          {/* Ráfaga de cartas volando hacia la mano */}
          <div className="relative w-28 h-40 sm:w-36 sm:h-52 z-10">
            {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0.8, rotate: 0, opacity: 1 }}
                animate={{
                  x: (i - count / 2) * 45,
                  y: 300 + i * 16,
                  scale: 0.75,
                  rotate: (i - count / 2) * 14,
                  opacity: [1, 1, 0.9],
                }}
                transition={{
                  duration: 0.85,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-0 rounded-2xl border-3 border-yellow-300 shadow-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #b91c1c 0%, #ea580c 50%, #7c2d12 100%)',
                  zIndex: 20 + i,
                }}
              >
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-lg border border-amber-200">
                  <span className="text-red-600 font-black text-2xl sm:text-3xl font-display">+{count}</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">PENALTY</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
