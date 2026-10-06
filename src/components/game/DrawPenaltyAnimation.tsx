import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

interface DrawPenaltyAnimationProps {
  count: number;
  onComplete: () => void;
}

export const DrawPenaltyAnimation: React.FC<DrawPenaltyAnimationProps> = ({
  count,
  onComplete,
}) => {
  useEffect(() => {
    soundEffects.attack();
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs select-none"
      >
        <div className="relative flex flex-col items-center">
          {/* Banner de castigo acumulado */}
          <motion.div
            initial={{ scale: 0.5, y: -40, rotate: -6 }}
            animate={{ scale: [0.9, 1.15, 1], y: 0, rotate: [0, 4, -4, 0] }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="mb-8 px-6 py-3 rounded-3xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-black text-xl sm:text-2xl tracking-wider uppercase shadow-2xl border-4 border-yellow-300 flex items-center gap-2 drop-shadow-2xl"
          >
            <Flame className="w-8 h-8 text-yellow-200 animate-bounce" />
            <span>¡TE COMISTE +{count} CARTAS!</span>
          </motion.div>

          {/* Ráfaga de cartas volando hacia la mano */}
          <div className="relative w-28 h-40">
            {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0.8, rotate: 0, opacity: 1 }}
                animate={{
                  x: (i - count / 2) * 40,
                  y: 280 + i * 15,
                  scale: 0.7,
                  rotate: (i - count / 2) * 12,
                  opacity: [1, 1, 0.85],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute inset-0 rounded-2xl border-2 border-yellow-400 shadow-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #b91c1c 0%, #ea580c 50%, #7c2d12 100%)',
                  zIndex: 20 + i,
                }}
              >
                <div className="w-14 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow">
                  <span className="text-red-600 font-black text-xl font-display">+{count}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
