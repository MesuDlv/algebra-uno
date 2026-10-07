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
            className={`relative flex flex-col items-center p-2 rounded-2xl transition-all duration-300 min-w-[82px] sm:min-w-[98px] ${
              isVulnerable
                ? 'bg-rose-950/90 border-2 border-rose-500 ring-4 ring-rose-500/80 shadow-2xl shadow-rose-600/70 scale-105 animate-pulse'
                : isHisTurn
                ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/25 scale-105'
                : 'bg-black/40 border border-white/15 backdrop-blur-md'
            }`}
          >
            {/* Indicador de turno pulsante o alarma de vulnerable */}
            {isVulnerable ? (
              <span className="absolute -top-3.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-red-600 text-white border-2 border-yellow-300 shadow-xl animate-bounce flex items-center gap-0.5">
                🚨 ¡SIN UNO!
              </span>
            ) : isHisTurn ? (
              <span className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                Turno
              </span>
            ) : null}

            {/* Avatar con contador de cartas */}
            <div className="relative mb-1">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl border-2 ${
                  isVulnerable
                    ? 'border-rose-400 bg-rose-900/60'
                    : isHisTurn
                    ? 'border-amber-400 bg-amber-950/40'
                    : 'border-slate-600 bg-slate-800'
                }`}
              >
                {opp.avatar}
              </div>

              {/* Cantidad de cartas en mano */}
              <div className={`absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full border text-white font-extrabold text-[10px] sm:text-xs shadow ${
                isVulnerable
                  ? 'bg-rose-600 border-yellow-300 animate-bounce'
                  : 'bg-indigo-600 border-indigo-300'
              }`}>
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
            <div className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate max-w-[76px] sm:max-w-[90px] text-center">
              {opp.name}
            </div>

            {/* Alerta de UNO cantado correctamente */}
            {opp.hand.length === 1 && opp.hasCalledUno && (
              <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white border border-emerald-300 tracking-wider">
                ¡Dijo UNO!
              </span>
            )}

            {/* Botón Grande y Notorio de Atrapar al Rival */}
            {isVulnerable && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => onCatchUno(opp.uid)}
                className="mt-1.5 w-full py-1.5 px-2 rounded-xl text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white border-2 border-yellow-300 shadow-xl shadow-red-600/70 flex items-center justify-center gap-1 animate-bounce cursor-pointer uppercase tracking-wider"
                title={`¡Atrapar a ${opp.name} por no cantar UNO!`}
              >
                <AlertCircle className="w-3.5 h-3.5 fill-current text-yellow-300 flex-shrink-0" />
                <span>¡Atrapar! (+2)</span>
              </motion.button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
