import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerAvatar: string;
  isCurrentUserWinner: boolean;
  isHost: boolean;
  onRequestRematch: () => void;
  onExit: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerName,
  winnerAvatar,
  isCurrentUserWinner,
  isHost,
  onRequestRematch,
  onExit,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Disparar confeti celebratorio
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const timeout = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 30 }}
            className="w-full max-w-sm p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-3xl shadow-2xl text-center relative overflow-hidden"
          >
            {/* Decoración luminosa de fondo */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-white tracking-wide mb-1">
                {isCurrentUserWinner ? '¡VICTORIA!' : '¡PARTIDA TERMINADA!'}
              </h2>

              <p className="text-sm text-slate-300 mb-6">
                {isCurrentUserWinner
                  ? '¡Has resuelto tus ecuaciones y te quedaste sin cartas!'
                  : `${winnerName} ha ganado la partida.`}
              </p>

              {/* Tarjeta del ganador */}
              <div className="p-4 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3">
                <span className="text-3xl">{winnerAvatar}</span>
                <div className="text-left">
                  <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                    Ganador
                  </div>
                  <div className="text-lg font-bold text-white leading-tight">
                    {winnerName}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2.5">
                {isHost ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRequestRematch}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Jugar Revancha
                  </motion.button>
                ) : (
                  <div className="text-xs text-slate-400 py-2">
                    Esperando a que el anfitrión inicie la revancha...
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExit}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-slate-300 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Volver al Menú Principal
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
