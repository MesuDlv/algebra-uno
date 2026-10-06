import React from 'react';
import { motion } from 'framer-motion';
import { PlayerState } from '../../types/game';
import { PresenceInfo } from '../../types/room';
import { AlertCircle, WifiOff } from 'lucide-react';

interface OpponentsBarProps {
  opponents: PlayerState[];
  currentTurnIndex: number;
  allPlayers: PlayerState[];
  presence: PresenceInfo[];
  unoVulnerableUids: string[];
  onCatchUno: (targetUid: string) => void;
}

export const OpponentsBar: React.FC<OpponentsBarProps> = ({
  opponents,
  currentTurnIndex,
  allPlayers,
  presence,
  unoVulnerableUids,
  onCatchUno,
}) => {
  const activeTurnPlayerUid = allPlayers[currentTurnIndex]?.uid;

  return (
    <div className="w-full flex items-center justify-center gap-2 sm:gap-4 px-2 py-2 overflow-x-auto no-scrollbar">
      {opponents.map((opp) => {
        const isHisTurn = opp.uid === activeTurnPlayerUid;
        const isVulnerable = unoVulnerableUids.includes(opp.uid);
        const presenceInfo = presence.find((p) => p.uid === opp.uid);
        const isOnline = presenceInfo ? presenceInfo.isOnline : true;

        return (
          <motion.div
            key={opp.uid}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative flex flex-col items-center p-2 rounded-2xl transition-all duration-300 min-w-[76px] sm:min-w-[90px] ${
              isHisTurn
                ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/25 scale-105'
                : 'bg-slate-900/60 border border-slate-700/60 backdrop-blur-md'
            }`}
          >
            {/* Indicador de turno pulsante */}
            {isHisTurn && (
              <span className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                Turno
              </span>
            )}

            {/* Avatar con contador de cartas */}
            <div className="relative mb-1">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 ${
                  isHisTurn ? 'border-amber-400 bg-amber-950/40' : 'border-slate-600 bg-slate-800'
                }`}
              >
                {opp.avatar}
              </div>

              {/* Cantidad de cartas en mano */}
              <div className="absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full bg-indigo-600 border border-indigo-300 text-white font-extrabold text-[10px] sm:text-xs shadow">
                {opp.hand.length}
              </div>

              {/* Icono de desconectado si no emite presencia */}
              {!isOnline && (
                <div
                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-600 text-white"
                  title="Jugador desconectado"
                >
                  <WifiOff className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Nombre del rival */}
            <div className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate max-w-[70px] sm:max-w-[85px] text-center">
              {opp.name}
            </div>

            {/* Alerta de UNO o Botón de Atrapar */}
            {opp.hand.length === 1 && opp.hasCalledUno && (
              <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white tracking-wider">
                UNO!
              </span>
            )}

            {isVulnerable && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCatchUno(opp.uid)}
                className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/40 flex items-center gap-0.5 animate-bounce"
              >
                <AlertCircle className="w-2.5 h-2.5" />
                Atrapar
              </motion.button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
