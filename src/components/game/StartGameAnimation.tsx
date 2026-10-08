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
    }, 2400);

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
        className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/85 backdrop-blur-md select-none"
      >
        <div className="relative flex flex-col items-center">
          {/* Título de estado */}
          <motion.div
            key={phase}
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="mb-8 px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_0_30px_rgba(249,115,22,0.5)] border-2 border-yellow-300 flex items-center gap-2"
          >
            {phase === 'shuffling' ? (
              <>
                <Layers className="w-4 h-4 text-yellow-200 animate-spin" />
                <span>🃏 ¡Barajando el mazo algebraico!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
                <span>🎴 ¡Repartiendo 7 cartas a tu mano!</span>
              </>
            )}
          </motion.div>

          {/* Mazo Central con barajeo */}
          <div className="relative w-32 h-44 sm:w-44 sm:h-60">
            {phase === 'shuffling' ? (
              // Cartas barajándose
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, (i % 2 === 0 ? 1 : -1) * (24 + i * 10), 0],
                    rotate: [0, (i % 2 === 0 ? 1 : -1) * (18 + i * 5), 0],
                    scale: [1, 1.06, 1],
                  }}
                  transition={{
                    repeat: 2,
                    duration: 0.35,
                    delay: i * 0.06,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50 shadow-2xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
                    zIndex: i,
                  }}
                >
                  <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500 -rotate-45 flex items-center justify-center shadow-lg border-2 border-white/40">
                    <span className="text-white font-black text-sm sm:text-base font-mono rotate-45 tracking-wider">UNO</span>
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
                    x: (i - 3) * 40,
                    y: 300,
                    scale: 0.8,
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
                  <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-full bg-white flex items-center justify-center shadow-lg border border-amber-200">
                    <span className="text-orange-600 font-black text-2xl sm:text-3xl italic font-display">7</span>
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
