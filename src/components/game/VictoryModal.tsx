import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Home,
  Sparkles,
  Crown,
  Coins,
  ShoppingBag,
  Medal,
} from 'lucide-react';
import { soundEffects } from '../../utils/audio';
import { PlayerState } from '../../types/game';
import {
  calculateMatchRankings,
  recordMatchReward,
  getPlayerEconomy,
  MatchPlayerResult,
} from '../../utils/economy';
import { AvatarDisplay } from '../common/AvatarDisplay';

interface VictoryModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerAvatar: string;
  isCurrentUserWinner: boolean;
  isHost: boolean;
  subtitle?: string;
  players?: PlayerState[];
  winnerUid?: string | null;
  currentUserUid?: string;
  onRequestRematch: () => void;
  onExit: () => void;
  onOpenShop?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  isCurrentUserWinner,
  isHost,
  subtitle,
  players = [],
  winnerUid = null,
  currentUserUid = '',
  onRequestRematch,
  onExit,
  onOpenShop,
}) => {
  const [rankings, setRankings] = useState<MatchPlayerResult[]>([]);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);
  const [totalCoins, setTotalCoins] = useState<number>(() => getPlayerEconomy().coins);
  const hasRewardedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      soundEffects.victory();

      // Disparar confeti celebratorio en cascada
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
      });

      const timeout = setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.7 },
        });
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.7 },
        });
      }, 350);

      // Calcular podio y posiciones finales
      if (players.length > 0) {
        const calculated = calculateMatchRankings(players, winnerUid);
        setRankings(calculated);

        // Otorgar recompensa de monedas al jugador local una sola vez por partida
        if (!hasRewardedRef.current && currentUserUid) {
          hasRewardedRef.current = true;
          const myResult = calculated.find((p) => p.uid === currentUserUid);
          if (myResult) {
            const rewardData = recordMatchReward(myResult.rank, players.length);
            setEarnedCoins(rewardData.coinsEarned);
            setTotalCoins(rewardData.newTotalCoins);
          }
        }
      }

      return () => clearTimeout(timeout);
    } else {
      hasRewardedRef.current = false;
    }
  }, [isOpen, players, winnerUid, currentUserUid]);

  if (!isOpen) return null;

  const top1 = rankings.find((p) => p.rank === 1);
  const top2 = rankings.find((p) => p.rank === 2);
  const top3 = rankings.find((p) => p.rank === 3);
  const rest = rankings.filter((p) => p.rank > 3);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className={`w-full max-w-lg sm:max-w-xl p-5 sm:p-7 rounded-3xl text-center relative overflow-hidden shadow-2xl border-2 ${
            isCurrentUserWinner
              ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/50 border-amber-400/60 shadow-[0_0_80px_rgba(245,158,11,0.35)]'
              : 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/60 border-indigo-400/50 shadow-[0_0_70px_rgba(99,102,241,0.25)]'
          }`}
        >
          {/* Destellos de iluminación */}
          <div className="absolute -top-20 -left-20 w-52 h-52 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Título de estado */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isCurrentUserWinner ? '¡CAMPEÓN DE LA MESA!' : 'FIN DE LA PARTIDA'}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight drop-shadow-md">
              {isCurrentUserWinner ? '¡VICTORIA ALGEBRAICA!' : `¡${top1?.name || 'Ganador'} Gana la Partida!`}
            </h1>

            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">{subtitle}</p>
            )}

            {/* Recompensa de Monedas del Jugador Local */}
            {earnedCoins > 0 && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 inline-flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/50 text-yellow-300 shadow-lg"
              >
                <div className="flex items-center gap-1.5 font-black text-sm sm:text-base">
                  <Coins className="w-4 h-4 text-yellow-300 animate-bounce" />
                  <span>+{earnedCoins} Monedas Ganadas</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-[11px] text-amber-200/80 font-semibold">
                  Balance: {totalCoins.toLocaleString()} 🪙
                </span>
              </motion.div>
            )}

            {/* ========================================================
                EL GRAN PODIO OLÍMPICO (TOP 1 ES LA COLUMNA MÁS ALTA)
            ======================================================== */}
            <div className="mt-6 mb-4">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-300/80 mb-3 flex items-center justify-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-300" />
                Podio de Posiciones
              </div>

              {/* Contenedor del Podio: Puesto 2 (Izquierda), Puesto 1 (Centro y más alto), Puesto 3 (Derecha) */}
              <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto pt-4 pb-2">
                {/* TOP 2 (PLATA) */}
                {top2 ? (
                  <div className="flex-1 flex flex-col items-center">
                    {/* Avatar y Nombre */}
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900 border-2 border-slate-300 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                        <AvatarDisplay
                          avatar={top2.avatar}
                          className="w-full h-full rounded-xl object-cover"
                          fallbackClassName="text-2xl sm:text-3xl"
                        />
                      </div>
                      <span className="text-[11px] sm:text-xs font-black text-slate-200 truncate max-w-[85px] mt-1">
                        {top2.name}
                        {top2.uid === currentUserUid && ' (Tú)'}
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold">
                        +{top2.coinsEarned} 🪙
                      </span>
                    </div>

                    {/* Columna del Podio #2 (Mediana) */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-full rounded-t-2xl bg-gradient-to-b from-slate-400 via-slate-500 to-slate-700 border-t-2 border-x-2 border-slate-300 flex flex-col items-center justify-center shadow-lg"
                    >
                      <span className="text-xl sm:text-2xl font-black text-white drop-shadow">
                        🥈 2°
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-200">
                        {top2.cardsCount} cartas
                      </span>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* TOP 1 (ORO - LA MÁS ALTA) */}
                {top1 && (
                  <div className="flex-1 flex flex-col items-center z-10 -mx-1">
                    {/* Corona sobre el Top 1 */}
                    <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300 animate-pulse drop-shadow -mb-1" />

                    {/* Avatar y Nombre */}
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-slate-900 border-3 border-amber-400 p-1 shadow-2xl ring-4 ring-amber-400/50 flex items-center justify-center overflow-hidden">
                        <AvatarDisplay
                          avatar={top1.avatar}
                          className="w-full h-full rounded-2xl object-cover"
                          fallbackClassName="text-3xl sm:text-4xl"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-yellow-300 truncate max-w-[100px] mt-1">
                        {top1.name}
                        {top1.uid === currentUserUid && ' (Tú)'}
                      </span>
                      <span className="text-[11px] text-yellow-300 font-black">
                        +{top1.coinsEarned} 🪙
                      </span>
                    </div>

                    {/* Columna del Podio #1 (LA MÁS ALTA) */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 118 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="w-full rounded-t-2xl bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-700 border-t-2 border-x-2 border-yellow-200 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                    >
                      <span className="text-2xl sm:text-3xl font-black text-slate-950 drop-shadow">
                        🥇 1°
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-slate-950 uppercase tracking-wider">
                        ¡GANADOR!
                      </span>
                    </motion.div>
                  </div>
                )}

                {/* TOP 3 (BRONCE) */}
                {top3 ? (
                  <div className="flex-1 flex flex-col items-center">
                    {/* Avatar y Nombre */}
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border-2 border-amber-700 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                        <AvatarDisplay
                          avatar={top3.avatar}
                          className="w-full h-full rounded-xl object-cover"
                          fallbackClassName="text-xl sm:text-2xl"
                        />
                      </div>
                      <span className="text-[11px] sm:text-xs font-black text-slate-300 truncate max-w-[85px] mt-1">
                        {top3.name}
                        {top3.uid === currentUserUid && ' (Tú)'}
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold">
                        +{top3.coinsEarned} 🪙
                      </span>
                    </div>

                    {/* Columna del Podio #3 (Baja) */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 56 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="w-full rounded-t-2xl bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 border-t-2 border-x-2 border-amber-600 flex flex-col items-center justify-center shadow-lg"
                    >
                      <span className="text-lg sm:text-xl font-black text-amber-200 drop-shadow">
                        🥉 3°
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-amber-300/80">
                        {top3.cardsCount} cartas
                      </span>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>

            {/* Filas adicionales para posiciones 4°, 5°, 6° si hay más jugadores */}
            {rest.length > 0 && (
              <div className="mt-2 mb-4 space-y-1.5 max-w-sm mx-auto text-left">
                {rest.map((p) => (
                  <div
                    key={p.uid}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs ${
                      p.uid === currentUserUid
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                        : 'bg-black/30 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-400 w-4 text-center">{p.rank}°</span>
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        <AvatarDisplay avatar={p.avatar} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold truncate max-w-[120px]">
                        {p.name}
                        {p.uid === currentUserUid && ' (Tú)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">{p.cardsCount} cartas</span>
                      <span className="font-black text-amber-300">+{p.coinsEarned} 🪙</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mt-4">
              {isHost && (
                <button
                  type="button"
                  onClick={onRequestRematch}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Jugar Revancha
                </button>
              )}

              {onOpenShop && (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Ir a la Tienda
                </button>
              )}

              <button
                type="button"
                onClick={onExit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Salir a la Sala
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
