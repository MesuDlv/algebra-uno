import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { Card } from '../card/Card';
import { MathView } from '../common/MathView';
import { Flame, RotateCw, RotateCcw, HelpCircle, Bell } from 'lucide-react';

interface TableCenterProps {
  topDiscardCard: CardType | null;
  activeColor: CardColor;
  accumulatedDrawCount: number;
  deckCount: number;
  direction: 1 | -1;
  isMyTurn: boolean;
  lastAction: string | null;
  isDraggingCard?: boolean;
  showUnoButton?: boolean;
  onCallUno?: () => void;
  onDrawCard: () => void;
  onZoomCard?: (card: CardType) => void;
}

const COLOR_NAMES: Record<CardColor, { name: string; variable: string; bg: string; border: string }> = {
  green: { name: 'Verde', variable: 'Y', bg: 'bg-emerald-500', border: 'border-emerald-300' },
  red: { name: 'Rojo', variable: 'Z', bg: 'bg-rose-500', border: 'border-rose-300' },
  blue: { name: 'Azul', variable: 'F', bg: 'bg-sky-500', border: 'border-sky-300' },
  yellow: { name: 'Amarillo', variable: 'N', bg: 'bg-amber-400', border: 'border-amber-200' },
  wild: { name: 'Comodín', variable: 'x', bg: 'bg-purple-600', border: 'border-purple-300' },
};

export const TableCenter: React.FC<TableCenterProps> = React.memo(({
  topDiscardCard,
  activeColor,
  accumulatedDrawCount,
  deckCount,
  direction,
  isMyTurn,
  lastAction,
  isDraggingCard = false,
  showUnoButton = false,
  onCallUno,
  onDrawCard,
  onZoomCard,
}) => {
  const activeColorInfo = COLOR_NAMES[activeColor] || COLOR_NAMES.green;

  // Si la carta superior es un comodín, aseguramos que muestre visualmente el color activo elegido
  const renderedDiscardCard = React.useMemo(() => {
    if (!topDiscardCard) return null;
    if ((topDiscardCard.type === 'wild' || topDiscardCard.type === 'wild4' || topDiscardCard.color === 'wild') && activeColor !== 'wild') {
      return {
        ...topDiscardCard,
        color: activeColor,
      };
    }
    return topDiscardCard;
  }, [topDiscardCard, activeColor]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full my-auto px-2 py-1 select-none">
      {/* Banner de acumulación (+2 / +4 Stacking) */}
      <AnimatePresence>
        {accumulatedDrawCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            className="mb-1.5 sm:mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 border-2 border-yellow-300 text-white shadow-xl shadow-orange-500/50 flex items-center gap-2 animate-pulse z-20"
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 animate-bounce" />
            <span className="text-[11px] sm:text-xs lg:text-sm font-black tracking-wider uppercase">
              ¡Castigo Acumulado: +{accumulatedDrawCount} Cartas!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ESTADIO / TAPETE OVALADO DE FIELTRO (Elegante y balanceado: no asfixia la pantalla en PC ni en móvil) */}
      <div className="relative uno-table-felt rounded-[40px] sm:rounded-[50px] md:rounded-[60px] lg:rounded-[68px] xl:rounded-[72px] px-4 sm:px-7 md:px-9 lg:px-12 xl:px-14 py-2.5 sm:py-3.5 md:py-4 lg:py-4.5 xl:py-4.5 flex flex-col items-center justify-center w-full max-w-[340px] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[660px] xl:max-w-[740px] 2xl:max-w-[800px] mobile-landscape:max-w-[440px] mobile-landscape:py-2 transition-all duration-300">
        {/* Línea de resplandor elíptico en el fieltro */}
        <div className="absolute inset-2 sm:inset-2.5 md:inset-3 lg:inset-3.5 rounded-[34px] sm:rounded-[44px] md:rounded-[54px] lg:rounded-[62px] xl:rounded-[66px] border border-amber-400/20 pointer-events-none" />

        {/* Centro de juego: Mazo de Robo + Pila de Descarte */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14 z-10">
          {/* 1. Mazo de Robo físico con cartas 3D apiladas y botón de Cantar UNO a su izquierda */}
          <div className="flex flex-col items-center relative">
            {/* Botón Circular de Cantar UNO a la izquierda del mazo (para PC y Móvil) */}
            <AnimatePresence>
              {showUnoButton && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: 15 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: 15 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 300 }}
                  className="absolute right-[calc(100%+8px)] sm:right-[calc(100%+14px)] md:right-[calc(100%+18px)] lg:right-[calc(100%+24px)] top-1/2 -translate-y-1/2 z-40 pointer-events-auto"
                >
                  <motion.button
                    type="button"
                    animate={{
                      scale: [1, 1.09, 1],
                      boxShadow: [
                        '0 0 15px rgba(239, 68, 68, 0.75)',
                        '0 0 35px rgba(245, 158, 11, 0.95)',
                        '0 0 15px rgba(239, 68, 68, 0.75)',
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onCallUno}
                    title="¡Presiona para cantar UNO!"
                    className="w-13 h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-22 lg:h-22 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-rose-600 border-2 sm:border-3 border-yellow-300 shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none group ring-2 sm:ring-4 ring-yellow-400/40"
                  >
                    <div className="flex items-center gap-0.5">
                      <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-yellow-200 animate-bounce" />
                      <span className="text-white font-black text-xs sm:text-base md:text-xl lg:text-2xl font-display italic tracking-tighter drop-shadow-md">
                        UNO
                      </span>
                    </div>
                    <span className="text-[7px] sm:text-[8px] md:text-[9.5px] font-black text-yellow-100 uppercase tracking-widest bg-black/50 px-1 sm:px-1.5 py-0.2 rounded-full mt-0.5 border border-yellow-300/40">
                      ¡Cantar!
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              id="table-draw-deck"
              className="relative w-[78px] h-[114px] sm:w-[88px] sm:h-[128px] md:w-[112px] md:h-[162px] lg:w-[130px] lg:h-[188px] xl:w-[144px] xl:h-[210px] 2xl:w-[154px] 2xl:h-[224px]"
            >
              {/* Capa 3 (fondo del mazo) */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-indigo-950 border border-indigo-700/60 shadow-lg translate-y-1.5 -translate-x-1.5 md:translate-y-2 md:-translate-x-2 rotate-[-4deg] pointer-events-none" />
              {/* Capa 2 (intermedia) */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-indigo-900 border border-indigo-500/60 shadow-md translate-y-0.5 -translate-x-0.5 md:translate-y-1 md:-translate-x-1 rotate-[2deg] pointer-events-none" />

              {/* Capa 1: Carta activa superior del mazo (toca o arrastra hacia abajo para robar) */}
              <motion.div
                drag={isMyTurn ? 'y' : false}
                dragConstraints={{ top: 0, bottom: 70 }}
                dragElastic={0.25}
                dragSnapToOrigin={true}
                onDragEnd={(_, info) => {
                  if (isMyTurn && (info.offset.y > 25 || info.velocity.y > 60)) {
                    onDrawCard();
                  }
                }}
                whileHover={isMyTurn ? { scale: 1.05, y: -3 } : {}}
                whileTap={isMyTurn ? { scale: 0.95 } : {}}
                onClick={isMyTurn ? onDrawCard : undefined}
                className={`absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl cursor-pointer overflow-hidden transition-all duration-200 card-hardware-accel uno-deck-shadow ${
                  isMyTurn
                    ? 'ring-3 sm:ring-4 ring-amber-300 shadow-xl shadow-amber-400/50 hover:shadow-amber-400/70 animate-pulse'
                    : 'ring-1 ring-indigo-400/40 opacity-95'
                }`}
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
                }}
              >
                {/* Dorso estilo ALGEBRA UNO */}
                <div className="absolute inset-1 sm:inset-1.5 md:inset-2 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-indigo-400/40 flex flex-col items-center justify-center p-1 md:p-2 text-center pointer-events-none">
                  <div className="w-10 h-14 sm:w-12 sm:h-18 md:w-15 md:h-22 lg:w-18 lg:h-26 rounded-full bg-gradient-to-br from-rose-500 via-amber-400 to-emerald-500 -rotate-45 flex items-center justify-center shadow-md">
                    <span className="text-white font-black text-[9px] sm:text-[11px] md:text-xs lg:text-sm tracking-tighter rotate-45 font-mono drop-shadow">
                      ALGEBRA
                    </span>
                  </div>
                  <div className="mt-1 md:mt-2 text-[8px] sm:text-[9px] md:text-xs lg:text-sm font-extrabold text-indigo-200">
                    {deckCount}
                  </div>
                </div>

                {/* Brillo si es tu turno de robar */}
                {isMyTurn && (
                  <div className="absolute inset-x-0 bottom-1 sm:bottom-1.5 md:bottom-2 text-center pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] md:text-[9.5px] font-black bg-amber-400 text-slate-950 uppercase shadow tracking-wider border border-white">
                      Robar
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
            <span className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs md:text-sm font-bold text-amber-100/90 drop-shadow">
              Mazo ({deckCount})
            </span>
          </div>

          {/* 2. Pila de Descarte con cartas físicas acumuladas */}
          <div id="table-discard-pile" className="flex flex-col items-center relative">
            {/* Zona de Drop animada cuando se arrastra una carta hacia el centro */}
            <AnimatePresence>
              {isDraggingCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                  className="absolute -inset-2.5 sm:-inset-3.5 md:-inset-5 lg:-inset-6 rounded-2xl sm:rounded-3xl border-3 border-dashed border-yellow-300 bg-yellow-400/30 backdrop-blur-xs z-30 pointer-events-none flex flex-col items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.7)]"
                >
                  <span className="text-[9px] sm:text-[11px] md:text-xs font-black uppercase text-yellow-100 bg-black/90 px-2.5 py-0.5 rounded-full border border-yellow-300 shadow">
                    🎯 Suelta aquí
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div id="table-discard-card-slot" className="relative w-[78px] h-[114px] sm:w-[88px] sm:h-[128px] md:w-[112px] md:h-[162px] lg:w-[130px] lg:h-[188px] xl:w-[144px] xl:h-[210px] 2xl:w-[154px] 2xl:h-[224px] flex items-center justify-center">
              {/* Cartas acumuladas por debajo simulando pila real */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-red-950/70 border border-red-700/40 rotate-[5deg] translate-y-1 translate-x-1 md:translate-y-2 md:translate-x-2 pointer-events-none shadow-md" />
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl bg-amber-950/60 border border-amber-700/40 rotate-[-4deg] translate-y-0.5 -translate-x-0.5 md:translate-y-1 md:-translate-x-1 pointer-events-none shadow-sm" />

              {renderedDiscardCard ? (
                <div className="relative z-10">
                  <motion.div
                    key={`${renderedDiscardCard.id}-${renderedDiscardCard.color}`}
                    initial={{ scale: 0.82, rotate: -8 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 320 }}
                    className="card-hardware-accel uno-discard-shadow"
                  >
                    <Card card={renderedDiscardCard} size="table" />
                  </motion.div>

                  {/* Botón para ver explicación / zoom de la ecuación */}
                  {onZoomCard && (
                    <button
                      onClick={() => onZoomCard(renderedDiscardCard)}
                      className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 md:-top-2.5 md:-right-2.5 p-1 sm:p-1.5 md:p-2 rounded-full bg-slate-900/90 text-amber-300 hover:text-white border border-slate-700 shadow-lg backdrop-blur-sm z-20 transition active:scale-95"
                      title="Ver explicación algebraica detallada"
                    >
                      <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-[78px] h-[114px] sm:w-[88px] sm:h-[128px] md:w-[106px] md:h-[154px] lg:w-[124px] lg:h-[180px] xl:w-[138px] xl:h-[202px] rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-dashed border-amber-400/40 flex items-center justify-center text-amber-200/60 text-xs md:text-sm">
                  Vacío
                </div>
              )}
            </div>
            <span className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-amber-100/90 drop-shadow">
              Descarte
            </span>
          </div>
        </div>

        {/* Indicador de Color Activo y Dirección */}
        <div className="mt-2.5 sm:mt-3 md:mt-4 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-xl z-10">
          {/* Sentido de juego */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-300"
            title={direction === 1 ? 'Sentido Horario' : 'Sentido Antihorario'}
          >
            {direction === 1 ? (
              <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-spin-slow" />
            ) : (
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-spin-reverse-slow" />
            )}
            <span className="hidden sm:inline">
              {direction === 1 ? 'Horario' : 'Antihorario'}
            </span>
          </div>

          <div className="w-px h-3 sm:h-3.5 bg-white/20" />

          {/* Color Activo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] md:text-xs text-slate-300 font-medium">Color:</span>
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 rounded-full ${activeColorInfo.bg} text-white font-black text-[11px] sm:text-xs md:text-sm border ${activeColorInfo.border} shadow-sm`}
            >
              <span>{activeColorInfo.name}</span>
              <span className="font-serif">
                (<MathView math={activeColorInfo.variable} />)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Última acción de la partida: chip informativo estético */}
      {lastAction && (
        <motion.div
          key={lastAction}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 text-center text-[10px] sm:text-[11px] md:text-xs text-amber-200/90 font-medium shadow-md backdrop-blur-md max-w-md truncate flex items-center justify-center gap-1.5 drop-shadow"
        >
          <span className="text-amber-400">⚡</span>
          <span>{lastAction}</span>
        </motion.div>
      )}
    </div>
  );
});
