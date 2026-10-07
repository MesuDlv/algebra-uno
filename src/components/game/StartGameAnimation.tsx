import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects } from '../../utils/audio';

interface StartGameAnimationProps {
  onComplete: () => void;
}

export const StartGameAnimation: React.FC<StartGameAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'shuffling' | 'dealing'>('shuffling');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Sonido de barajar cartas
    soundEffects.shuffle();

    const t1 = setTimeout(() => {
      setPhase('dealing');
      // Sonidos rápidos de cartas repartidas
      soundEffects.playCard();
    }, 1200);

    const t2 = setTimeout(() => {
      onCompleteRef.current();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleSkip = () => {
    onCompleteRef.current();
  };


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/85 backdrop-blur-md select-none"
      >
        <div className="relative flex flex-col items-center">
          {/* Título de estado */}
          <motion.div
            key={phase}
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="mb-8 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl border-2 border-yellow-300"
          >
            {phase === 'shuffling' ? '🃏 ¡Barajando el mazo algebraico!' : '🎴 ¡Repartiendo 7 cartas a tu mano!'}
          </motion.div>

          {/* Mazo Central con barajeo */}
          <div className="relative w-32 h-44 sm:w-40 sm:h-56">
            {phase === 'shuffling' ? (
              // Cartas barajándose
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8), 0],
                    rotate: [0, (i % 2 === 0 ? 1 : -1) * (15 + i * 4), 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    repeat: 2,
                    duration: 0.35,
                    delay: i * 0.06,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50 shadow-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
                    zIndex: i,
                  }}
                >
                  <div className="w-16 h-24 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500 -rotate-45 flex items-center justify-center shadow">
                    <span className="text-white font-black text-xs font-mono rotate-45">UNO</span>
                  </div>
                </motion.div>
              ))
            ) : (
              // Cartas volando hacia la mano inferior
              Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
                  animate={{
                    x: (i - 3) * 35,
                    y: 280,
                    scale: 0.75,
                    rotate: (i - 3) * 6,
                    opacity: [1, 1, 0.9],
                  }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 rounded-2xl border-2 border-amber-300 shadow-2xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #7f1d1d 100%)',
                    zIndex: 20 + i,
                  }}
                >
                  <div className="w-16 h-24 rounded-full bg-white flex items-center justify-center shadow">
                    <span className="text-orange-600 font-black text-lg italic font-display">7</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Botón para omitir si el jugador tiene prisa */}
        <button
          type="button"
          onClick={handleSkip}
          className="pointer-events-auto mt-12 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white/70 hover:text-white text-xs font-semibold backdrop-blur-sm cursor-pointer transition"
        >
          Saltar animación
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
