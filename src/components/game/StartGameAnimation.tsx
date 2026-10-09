import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

interface StartGameAnimationProps {
  onComplete: () => void;
}

export const StartGameAnimation: React.FC<StartGameAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'shuffling' | 'dealing'>('shuffling');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    // Sonido de barajar cartas
    soundEffects.shuffle();

    // Tiempos optimizados para fluidez máxima en móvil (total 1.3s)
    const t1 = setTimeout(() => {
      setPhase('dealing');
      soundEffects.playCard();
    }, 650);

    const t2 = setTimeout(() => {
      handleFinish();
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 select-none pointer-events-none"
      >
        <div className="relative flex flex-col items-center pointer-events-none">
          {/* Título de estado */}
          <motion.div
            key={phase}
            initial={{ scale: 0.88, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mb-6 px-5 sm:px-7 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase border border-yellow-300 shadow-xl flex items-center gap-2 will-change-transform"
          >
            {phase === 'shuffling' ? (
              <>
                <Layers className="w-3.5 h-3.5 text-yellow-200 animate-spin" />
                <span>🃏 ¡Barajando mazo algebraico!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
                <span>🎴 ¡Repartiendo tus 7 cartas!</span>
              </>
            )}
          </motion.div>

          {/* Mazo Central optimizado (menos nodos DOM para 60fps en móviles de gama baja) */}
          <div className="relative w-28 h-40 sm:w-36 sm:h-52 will-change-transform">
            {phase === 'shuffling' ? (
              // 3 cartas animadas en lugar de 6 para evitar caídas de FPS
              [0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, (i % 2 === 0 ? 1 : -1) * (18 + i * 8), 0],
                    rotate: [0, (i % 2 === 0 ? 1 : -1) * (12 + i * 4), 0],
                  }}
                  transition={{
                    repeat: 1,
                    duration: 0.28,
                    delay: i * 0.05,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-2xl border border-indigo-400/50 shadow-lg flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    zIndex: i,
                    transform: 'translate3d(0, 0, 0)',
                  }}
                >
                  <div className="w-16 h-24 sm:w-20 sm:h-30 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500 -rotate-45 flex items-center justify-center border border-white/40">
                    <span className="text-white font-black text-xs sm:text-sm font-mono rotate-45 tracking-wider">
                      UNO
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              // 4 cartas repartidas hacia la parte inferior
              [0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (i - 1.5) * 35,
                    y: 220,
                    scale: 0.85,
                    opacity: [1, 0.95, 0.9],
                  }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.06,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-2xl border border-amber-300 shadow-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                    zIndex: 20 + i,
                    transform: 'translate3d(0, 0, 0)',
                  }}
                >
                  <div className="w-16 h-24 sm:w-20 sm:h-30 rounded-full bg-white flex items-center justify-center border border-amber-200">
                    <span className="text-orange-600 font-black text-xl sm:text-2xl italic font-display">7</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
