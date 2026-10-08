import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, RotateCcw, RotateCw, Ban, Sparkles } from 'lucide-react';
import { CardColor, COLOR_NAMES_ES, COLOR_VARIABLES } from '../../types/card';
import { soundEffects } from '../../utils/audio';

export type GameAnnouncement =
  | {
      id: string;
      type: 'color';
      color: Exclude<CardColor, 'wild'>;
      playerName?: string;
    }
  | {
      id: string;
      type: 'reverse';
      direction: 1 | -1;
      playerName?: string;
    }
  | {
      id: string;
      type: 'block';
      victimName: string;
      playerName?: string;
    }
  | {
      id: string;
      type: 'uno';
      playerName: string;
    };

interface ActionAnnouncementModalProps {
  announcement: GameAnnouncement | null;
  onComplete: () => void;
}

export const ActionAnnouncementModal: React.FC<ActionAnnouncementModalProps> = ({
  announcement,
  onComplete,
}) => {
  useEffect(() => {
    if (!announcement) return;

    // Reproducir efecto sonoro correspondiente a la acción
    if (announcement.type === 'color') {
      soundEffects.colorChange();
    } else if (announcement.type === 'reverse') {
      soundEffects.reverse();
    } else if (announcement.type === 'block') {
      soundEffects.block();
    } else if (announcement.type === 'uno') {
      soundEffects.unoCall();
    }

    // Duración no saltable pero ágil para no frenar la fluidez del juego (1.7 segundos)
    const timer = setTimeout(() => {
      onComplete();
    }, 1700);

    return () => clearTimeout(timer);
  }, [announcement?.id, onComplete]);

  if (!announcement) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={announcement.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
      >
        {/* ========================================================
            1. COMODÍN / CAMBIO DE COLOR
        ======================================================== */}
        {announcement.type === 'color' && (
          <motion.div
            initial={{ scale: 0.7, y: 30, rotate: -4 }}
            animate={{ scale: [0.9, 1.08, 1], y: 0, rotate: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
            className={`relative max-w-sm sm:max-w-md w-full rounded-3xl p-6 sm:p-8 text-center text-white border-4 shadow-2xl overflow-hidden ${
              announcement.color === 'red'
                ? 'bg-gradient-to-br from-red-600 via-rose-600 to-red-900 border-red-300 shadow-[0_0_60px_rgba(239,68,68,0.75)]'
                : announcement.color === 'blue'
                ? 'bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-900 border-cyan-300 shadow-[0_0_60px_rgba(59,130,246,0.75)]'
                : announcement.color === 'green'
                ? 'bg-gradient-to-br from-emerald-600 via-green-600 to-teal-900 border-emerald-300 shadow-[0_0_60px_rgba(16,185,129,0.75)]'
                : 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-700 border-yellow-200 shadow-[0_0_60px_rgba(251,191,36,0.75)] text-slate-950'
            }`}
          >
            {/* Halo radiante de fondo */}
            <div className="absolute -inset-10 bg-white/20 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-white/40 bg-black/30 backdrop-blur-md flex items-center gap-1.5 mb-3 text-white">
                <Palette className="w-3.5 h-3.5 text-yellow-300" />
                CAMBIO DE COLOR
              </span>

              {/* Esfera 3D del color elegido con la variable */}
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center font-display font-black text-2xl sm:text-3xl shadow-2xl border-4 border-white my-2 ${
                  announcement.color === 'red'
                    ? 'bg-red-500 text-white'
                    : announcement.color === 'blue'
                    ? 'bg-blue-500 text-white'
                    : announcement.color === 'green'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-yellow-400 text-slate-950'
                }`}
              >
                <span>{COLOR_VARIABLES[announcement.color]}</span>
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wide uppercase mt-2 drop-shadow-md">
                ¡COLOR {COLOR_NAMES_ES[announcement.color].toUpperCase()}!
              </h2>

              <p className="text-xs sm:text-sm font-semibold opacity-90 mt-1 max-w-xs">
                {announcement.playerName ? (
                  <><strong>{announcement.playerName}</strong> eligió el color {COLOR_NAMES_ES[announcement.color]}.</>
                ) : (
                  <>El juego continúa con cartas de color {COLOR_NAMES_ES[announcement.color]}.</>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            2. CAMBIO DE SENTIDO / REVERSA
        ======================================================== */}
        {announcement.type === 'reverse' && (
          <motion.div
            initial={{ scale: 0.7, y: 30, rotate: 6 }}
            animate={{ scale: [0.9, 1.08, 1], y: 0, rotate: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
            className="relative max-w-sm sm:max-w-md w-full rounded-3xl p-6 sm:p-8 text-center text-white bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 border-4 border-purple-300 shadow-[0_0_60px_rgba(147,51,234,0.75)] overflow-hidden"
          >
            <div className="absolute -inset-10 bg-purple-500/30 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-white/40 bg-black/30 backdrop-blur-md flex items-center gap-1.5 mb-3 text-purple-200">
                {announcement.direction === 1 ? (
                  <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                )}
                CAMBIO DE SENTIDO
              </span>

              {/* Icono de flechas girando continuamente en el nuevo sentido */}
              <motion.div
                animate={{
                  rotate: announcement.direction === 1 ? [0, 360] : [0, -360],
                }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-950/80 border-4 border-yellow-300 flex items-center justify-center my-2 shadow-2xl text-yellow-300"
              >
                {announcement.direction === 1 ? (
                  <RotateCw className="w-10 h-10 sm:w-12 sm:h-12" />
                ) : (
                  <RotateCcw className="w-10 h-10 sm:w-12 sm:h-12" />
                )}
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wide uppercase mt-2 drop-shadow-md text-yellow-300">
                {announcement.direction === 1 ? '¡SENTIDO HORARIO! ↻' : '¡SENTIDO ANTIHORARIO! ↺'}
              </h2>

              <p className="text-xs sm:text-sm text-purple-100 font-semibold mt-1 max-w-xs">
                {announcement.direction === 1
                  ? 'El rumbo de los turnos ahora gira hacia la DERECHA.'
                  : 'El rumbo de los turnos ahora gira hacia la IZQUIERDA.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            3. BLOQUEO (EXCLUSIVO PARA EL USUARIO BLOQUEADO)
        ======================================================== */}
        {announcement.type === 'block' && (
          <motion.div
            initial={{ scale: 0.6, y: 30 }}
            animate={{ scale: [0.85, 1.1, 1], y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 14, stiffness: 280 }}
            className="relative max-w-sm sm:max-w-md w-full rounded-3xl p-6 sm:p-8 text-center text-white bg-gradient-to-br from-red-700 via-rose-800 to-slate-950 border-4 border-red-400 shadow-[0_0_60px_rgba(225,29,72,0.85)] overflow-hidden"
          >
            <div className="absolute -inset-10 bg-red-600/30 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-white/40 bg-black/40 backdrop-blur-md flex items-center gap-1.5 mb-3 text-red-200">
                <Ban className="w-3.5 h-3.5 text-yellow-300" />
                TURNO BLOQUEADO
              </span>

              {/* Icono de Stop / Bloqueo con pulso */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-950 border-4 border-yellow-300 flex items-center justify-center my-2 shadow-2xl text-yellow-300"
              >
                <Ban className="w-11 h-11 sm:w-13 sm:h-13" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wide uppercase mt-2 drop-shadow-md text-yellow-300">
                ¡HAS SIDO BLOQUEADO!
              </h2>

              <p className="text-xs sm:text-sm text-red-100 font-semibold mt-1 max-w-xs">
                {announcement.playerName ? (
                  <><strong>{announcement.playerName}</strong> te ha saltado con un bloqueo. ¡Pierdes tu turno!</>
                ) : (
                  <>Te han bloqueado el turno. Deberás esperar a la próxima ronda.</>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            4. ALGUIEN CANTÓ UNO
        ======================================================== */}
        {announcement.type === 'uno' && (
          <motion.div
            initial={{ scale: 0.6, y: -30, rotate: -3 }}
            animate={{ scale: [0.9, 1.12, 1], y: 0, rotate: [0, 2, -2, 0] }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 14, stiffness: 280 }}
            className="relative max-w-sm sm:max-w-md w-full rounded-3xl p-6 sm:p-8 text-center text-slate-950 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 border-4 border-yellow-100 shadow-[0_0_70px_rgba(245,158,11,0.9)] overflow-hidden"
          >
            <div className="absolute -inset-10 bg-amber-300/40 blur-2xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-black/20 bg-black/15 flex items-center gap-1.5 mb-2 text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                ¡ALERTA DE UNO!
              </span>

              {/* Carta dorada con el "1" */}
              <motion.div
                animate={{ scale: [1, 1.14, 1] }}
                transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-slate-950 border-3 border-yellow-200 flex flex-col items-center justify-center my-2 shadow-2xl"
              >
                <span className="text-amber-400 font-display font-black text-4xl sm:text-5xl leading-none">
                  1
                </span>
                <span className="text-[10px] font-black text-white tracking-widest">
                  ALGEBRA
                </span>
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight uppercase mt-2 drop-shadow-sm text-slate-950">
                ¡{announcement.playerName.toUpperCase()} CANTÓ ¡UNO!!
              </h2>

              <p className="text-xs sm:text-sm text-amber-950 font-black mt-1 max-w-xs">
                ⚠️ ¡Atención a todos! Le queda únicamente 1 carta para ganar la partida.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
