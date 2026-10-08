import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Crown } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerAvatar: string;
  isCurrentUserWinner: boolean;
  isHost: boolean;
  subtitle?: string;
  onRequestRematch: () => void;
  onExit: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerName,
  winnerAvatar,
  isCurrentUserWinner,
  isHost,
  subtitle,
  onRequestRematch,
  onExit,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundEffects.victory();

      // Disparar confeti celebratorio en cascada
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });

      const timeout = setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 55,
          origin: { x: 0.05, y: 0.7 },
        });
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.7 },
        });
      }, 350);

      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full max-w-sm sm:max-w-md lg:max-w-lg p-6 sm:p-8 rounded-3xl text-center relative overflow-hidden shadow-2xl border-2 ${
              isCurrentUserWinner
                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 border-amber-400/50 shadow-[0_0_80px_rgba(245,158,11,0.3)]'
                : 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/50 border-indigo-400/40 shadow-[0_0_70px_rgba(99,102,241,0.25)]'
            }`}
          >
            {/* Destellos ambientales */}
            <div className="absolute -top-24 -left-24 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Emblema trofeo */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full blur-md animate-pulse ${
                    isCurrentUserWinner ? 'bg-amber-400/40' : 'bg-indigo-400/30'
                  }`}
                />
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-1 shadow-xl flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center border border-amber-400/40">
                    {isCurrentUserWinner ? (
                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                    ) : (
                      <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Título de estado */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {isCurrentUserWinner ? '¡CAMPEÓN DE LA MESA!' : 'FIN DE LA PARTIDA'}
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide mb-2">
                {isCurrentUserWinner ? '¡VICTORIA MAGISTRAL!' : '¡PARTIDA TERMINADA!'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-sm mx-auto leading-relaxed">
                {subtitle
                  ? subtitle
                  : isCurrentUserWinner
                  ? '¡Has resuelto tus ecuaciones a la perfección y te quedaste sin cartas!'
                  : `${winnerName} ha ganado la partida al vaciar su mano.`}
              </p>

              {/* Tarjeta de podio del ganador */}
              <div className="p-4 sm:p-5 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-4 backdrop-blur-md shadow-inner">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 border border-amber-400/40 flex items-center justify-center text-3xl sm:text-4xl shadow-lg ring-2 ring-amber-400/30">
                  {winnerAvatar}
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    Ganador
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                    {winnerName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {isCurrentUserWinner ? '¡Ese eres tú! 🎉' : 'Vencedor de la ronda'}
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
                    className="w-full py-3.5 sm:py-4 px-5 rounded-2xl font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-xl shadow-emerald-500/30 border border-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Jugar Revancha
                  </motion.button>
                ) : (
                  <div className="text-xs text-slate-400 py-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                    ⏳ Esperando a que el anfitrión inicie la revancha...
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExit}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-300 bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition"
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
