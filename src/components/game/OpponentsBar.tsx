import React from 'react';
import { motion } from 'framer-motion';
import { PlayerState } from '../../types/game';
import { PresenceInfo } from '../../types/room';
import { AlertCircle, WifiOff } from 'lucide-react';
import { AvatarDisplay } from '../common/AvatarDisplay';

interface OpponentsBarProps {
  opponents: PlayerState[];
  currentTurnIndex: number;
  allPlayers: PlayerState[];
  presence: PresenceInfo[];
  unoVulnerableUids: string[];
  disconnectCountdown?: { uid: string; secondsLeft: number } | null;
  onCatchUno: (targetUid: string) => void;
}

// Mini abanico de dorsos de cartas para los rivales en modo horizontal (Estilo UNO Mobile)
const OpponentCardFan: React.FC<{ count: number; position: 'left' | 'top' | 'right' }> = ({
  count,
  position,
}) => {
  const cardCount = Math.min(Math.max(count, 1), 4);
  const cards = Array.from({ length: cardCount });

  return (
    <div className="relative flex items-center justify-center my-0.5 h-7 lg:h-10">
      {cards.map((_, i) => {
        const offset = i - (cardCount - 1) / 2;
        const rotate =
          position === 'left' ? offset * 14 + 18 : position === 'right' ? offset * 14 - 18 : offset * 10;
        const translateX = position === 'left' ? i * 5 : position === 'right' ? -i * 5 : offset * 6;

        return (
          <div
            key={i}
            className="w-4.5 h-6.5 sm:w-5 sm:h-7 lg:w-7 lg:h-10 rounded-[4px] lg:rounded-md bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 border border-indigo-400/50 shadow-md flex items-center justify-center transition-transform"
            style={{
              transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
              position: i === 0 ? 'relative' : 'absolute',
              zIndex: i,
            }}
          >
            <div className="w-2 h-3 lg:w-3.5 lg:h-5 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500 -rotate-45 shadow-xs" />
          </div>
        );
      })}
    </div>
  );
};

export const OpponentsBar: React.FC<OpponentsBarProps> = React.memo(({
  opponents,
  currentTurnIndex,
  allPlayers,
  presence,
  unoVulnerableUids,
  disconnectCountdown,
  onCatchUno,
}) => {
  const activeTurnPlayerUid = allPlayers[currentTurnIndex]?.uid;

  const getOpponentPositionStyle = (index: number, total: number): { classes: string; slot: 'left' | 'top' | 'right' } => {
    if (total === 1) {
      return {
        classes: 'top-2 sm:top-2.5 lg:top-4 left-1/2 -translate-x-1/2 flex-col items-center',
        slot: 'top',
      };
    }
    if (total === 2) {
      if (index === 0) return { classes: 'left-2.5 sm:left-4 lg:left-8 xl:left-14 top-1/2 -translate-y-1/2 flex-col items-start', slot: 'left' };
      return { classes: 'right-2.5 sm:right-4 lg:right-8 xl:right-14 top-1/2 -translate-y-1/2 flex-col items-end', slot: 'right' };
    }
    if (total === 3) {
      if (index === 0) return { classes: 'left-2.5 sm:left-4 lg:left-8 xl:left-14 top-1/2 -translate-y-1/2 flex-col items-start', slot: 'left' };
      if (index === 1) return { classes: 'top-2 sm:top-2.5 lg:top-4 left-1/2 -translate-x-1/2 flex-col items-center', slot: 'top' };
      return { classes: 'right-2.5 sm:right-4 lg:right-8 xl:right-14 top-1/2 -translate-y-1/2 flex-col items-end', slot: 'right' };
    }
    if (total === 4) {
      if (index === 0) return { classes: 'left-2.5 sm:left-4 lg:left-8 xl:left-14 top-1/2 -translate-y-1/2 flex-col items-start', slot: 'left' };
      if (index === 1) return { classes: 'top-2 sm:top-2.5 lg:top-4 left-[34%] -translate-x-1/2 flex-col items-center', slot: 'top' };
      if (index === 2) return { classes: 'top-2 sm:top-2.5 lg:top-4 left-[66%] -translate-x-1/2 flex-col items-center', slot: 'top' };
      return { classes: 'right-2.5 sm:right-4 lg:right-8 xl:right-14 top-1/2 -translate-y-1/2 flex-col items-end', slot: 'right' };
    }
    // total === 5 (Partida completa de 6 jugadores: 5 rivales + yo)
    if (index === 0) return { classes: 'left-2 sm:left-3 lg:left-6 xl:left-10 top-1/2 -translate-y-1/2 flex-col items-start', slot: 'left' };
    if (index === 1) return { classes: 'top-2 sm:top-2.5 lg:top-4 left-[27%] -translate-x-1/2 flex-col items-center', slot: 'top' };
    if (index === 2) return { classes: 'top-2 sm:top-2.5 lg:top-4 left-1/2 -translate-x-1/2 flex-col items-center', slot: 'top' };
    if (index === 3) return { classes: 'top-2 sm:top-2.5 lg:top-4 left-[73%] -translate-x-1/2 flex-col items-center', slot: 'top' };
    return { classes: 'right-2 sm:right-3 lg:right-6 xl:right-10 top-1/2 -translate-y-1/2 flex-col items-end', slot: 'right' };
  };

  return (
    <>
      {/* 1. MODO VERTICAL (PORTRAIT): Barra superior deslizante suave con desplazamiento táctil horizontal */}
      <div className="portrait:flex landscape:hidden w-full items-center justify-start sm:justify-center gap-2 px-3 py-1 overflow-x-auto touch-pan-x overscroll-x-contain no-scrollbar scroll-smooth">
        {opponents.map((opp) => {
          const isHisTurn = opp.uid === activeTurnPlayerUid;
          const isVulnerable = unoVulnerableUids.includes(opp.uid);
          const presenceInfo = presence.find((p) => p.uid === opp.uid);
          const isOnline = presenceInfo ? presenceInfo.isOnline : true;
          const isDisconnected = disconnectCountdown?.uid === opp.uid;

          return (
            <motion.div
              key={opp.uid}
              id={`opponent-${opp.uid}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-2xl transition-all duration-200 ${
                isDisconnected
                  ? 'bg-rose-950/95 border-2 border-red-500 ring-2 ring-red-500/80 shadow-xl'
                  : isVulnerable
                  ? 'bg-rose-950/95 border-2 border-rose-500 ring-2 ring-rose-500/80 shadow-xl shadow-rose-600/70 scale-105 animate-pulse'
                  : isHisTurn
                  ? 'bg-amber-500/30 border border-amber-300 shadow-md shadow-amber-500/30 scale-105'
                  : 'bg-black/55 border border-white/15 backdrop-blur-md'
              }`}
            >
              {/* Avatar con contador de cartas superpuesto */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border shadow overflow-hidden ${
                    isDisconnected
                      ? 'border-red-500 bg-red-950/80'
                      : isVulnerable
                      ? 'border-rose-400 bg-rose-900/60 ring-2 ring-rose-400'
                      : isHisTurn
                      ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-300'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  <AvatarDisplay avatar={opp.avatar} className="w-full h-full rounded-2xl object-cover" fallbackClassName="text-base sm:text-lg leading-none" />
                </div>

                {/* Cantidad de cartas */}
                <div
                  className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full border text-white font-black text-[9px] sm:text-[10px] shadow leading-none ${
                    isVulnerable
                      ? 'bg-rose-600 border-yellow-300 animate-bounce'
                      : 'bg-indigo-600 border-indigo-300'
                  }`}
                >
                  {opp.hand.length}
                </div>

                {!isOnline && (
                  <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                    <WifiOff className="w-2 h-2" />
                  </div>
                )}
              </div>

              {/* Nombre y estado */}
              <div className="flex flex-col min-w-0 pr-1">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-200 truncate max-w-[70px] sm:max-w-[90px]">
                  {opp.name}
                </div>
                {isDisconnected ? (
                  <span className="text-[8px] font-black text-rose-300 tracking-tight animate-pulse">
                    ⏱️ {disconnectCountdown.secondsLeft}s
                  </span>
                ) : isHisTurn ? (
                  <span className="text-[8px] font-black text-amber-300 uppercase tracking-tight">
                    Turno
                  </span>
                ) : null}
              </div>

              {/* Botón de Atrapar si es vulnerable */}
              {isVulnerable && (
                <button
                  onClick={() => onCatchUno(opp.uid)}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-600 hover:bg-rose-500 text-white border border-yellow-300 shadow-lg animate-bounce cursor-pointer flex items-center gap-0.5 uppercase"
                  title={`¡Atrapar a ${opp.name}!`}
                >
                  <AlertCircle className="w-2.5 h-2.5 text-yellow-300" />
                  <span>+2</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 2. MODO HORIZONTAL (LANDSCAPE) & PC: Distribución alrededor del estadio oval con tamaños HD para PC */}
      <div className="hidden landscape:block absolute inset-0 pointer-events-none z-20">
        {opponents.map((opp, idx) => {
          const isHisTurn = opp.uid === activeTurnPlayerUid;
          const isVulnerable = unoVulnerableUids.includes(opp.uid);
          const presenceInfo = presence.find((p) => p.uid === opp.uid);
          const isOnline = presenceInfo ? presenceInfo.isOnline : true;
          const isDisconnected = disconnectCountdown?.uid === opp.uid;
          const pos = getOpponentPositionStyle(idx, opponents.length);

          return (
            <motion.div
              key={opp.uid}
              id={`opponent-${opp.uid}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute flex ${pos.classes} pointer-events-auto`}
            >
              {/* Placa con nombre del rival estilo juego arcade */}
              <div
                className={`px-2 sm:px-2.5 lg:px-3.5 py-0.5 lg:py-1 rounded-full text-[10px] sm:text-[11px] lg:text-xs font-bold shadow-lg border backdrop-blur-md mb-1 max-w-[100px] sm:max-w-[120px] lg:max-w-[150px] truncate ${
                  isDisconnected
                    ? 'bg-rose-900 text-yellow-200 border-red-400 shadow-rose-900/50 animate-pulse'
                    : isHisTurn
                    ? 'bg-amber-400 text-slate-950 border-yellow-200 shadow-amber-400/50 ring-2 ring-yellow-300/60 animate-pulse font-black'
                    : 'bg-black/65 text-slate-200 border-white/20'
                }`}
              >
                {isDisconnected ? `⏱️ ${disconnectCountdown.secondsLeft}s` : opp.name}
              </div>

              {/* Contenedor Avatar + Contador de Cartas */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                <div className="relative">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 rounded-2xl sm:rounded-3xl flex items-center justify-center border-2 shadow-xl overflow-hidden ${
                      isVulnerable
                        ? 'border-rose-400 bg-rose-900/70 ring-3 ring-rose-500'
                        : isHisTurn
                        ? 'border-amber-400 bg-amber-950/60 ring-3 ring-amber-400/70 animate-pulse'
                        : 'border-slate-500 bg-slate-900/80'
                    }`}
                  >
                    <AvatarDisplay avatar={opp.avatar} className="w-full h-full rounded-2xl sm:rounded-3xl object-cover" fallbackClassName="text-xl sm:text-2xl lg:text-3xl leading-none" />
                  </div>

                  {/* Badge de cantidad de cartas */}
                  <div
                    className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 lg:px-2 lg:py-0.5 rounded-full border text-white font-black text-[9px] sm:text-[10px] lg:text-xs shadow-md ${
                      isVulnerable
                        ? 'bg-rose-600 border-yellow-300 animate-bounce'
                        : 'bg-indigo-600 border-indigo-300'
                    }`}
                  >
                    {opp.hand.length}
                  </div>

                  {!isOnline && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-600 text-white shadow">
                      <WifiOff className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" />
                    </div>
                  )}
                </div>

                {/* Abanico físico de cartas hacia la mesa */}
                <OpponentCardFan count={opp.hand.length} position={pos.slot} />
              </div>

              {/* Botón de Atrapar en modo horizontal / PC */}
              {isVulnerable && (
                <button
                  onClick={() => onCatchUno(opp.uid)}
                  className="mt-1 px-2.5 lg:px-3.5 py-1 lg:py-1.5 rounded-xl text-[10px] sm:text-[11px] lg:text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white border-2 border-yellow-300 shadow-xl shadow-red-600/80 animate-bounce cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                  title={`¡Atrapar a ${opp.name} por no decir UNO!`}
                >
                  <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-300 flex-shrink-0" />
                  <span>¡Atrapar! (+2)</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
});
