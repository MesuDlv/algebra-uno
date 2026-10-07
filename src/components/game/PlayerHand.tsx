import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { Card } from '../card/Card';
import { isCardPlayable } from '../../engine/rules';
import { Bell, ArrowRight, HelpCircle, Eye } from 'lucide-react';

interface PlayerHandProps {
  hand: CardType[];
  topDiscardCard: CardType | null;
  activeColor: CardColor;
  accumulatedDrawCount: number;
  isMyTurn: boolean;
  hasCalledUno: boolean;
  canPass: boolean;
  isSpectator?: boolean;
  showCards?: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
  onPlayCard: (cardId: string) => void;
  onPlayWild: (card: CardType) => void;
  onCallUno: () => void;
  onPassTurn: () => void;
  onZoomCard?: (card: CardType) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  topDiscardCard,
  activeColor,
  accumulatedDrawCount,
  isMyTurn,
  hasCalledUno,
  canPass,
  isSpectator = false,
  showCards = true,
  onDragStateChange,
  onPlayCard,
  onPlayWild,
  onCallUno,
  onPassTurn,
  onZoomCard,
}) => {
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  // El botón de UNO solo debe salir cuando al jugador le queda exactamente 1 carta (tras jugar la segunda)
  const showUnoButton = hand.length === 1 && !hasCalledUno && !isSpectator;

  const handleCardAttempt = (card: CardType) => {
    if (isSpectator) return;

    if (!isMyTurn) {
      setHintMsg('⏳ ¡Espera a que sea tu turno para lanzar!');
      setTimeout(() => setHintMsg(null), 2500);
      return;
    }

    if (!topDiscardCard) return;

    const playable = isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);
    if (!playable) {
      if (accumulatedDrawCount > 0) {
        setHintMsg(`🔥 ¡Castigo acumulado (+${accumulatedDrawCount})! Solo puedes defenderte con un +2 o +4.`);
      } else {
        setHintMsg(`⚠️ Esta carta no coincide con el color (${activeColor}) ni con la solución numérica.`);
      }
      setTimeout(() => setHintMsg(null), 3200);
      return;
    }

    // Carta válida: lanzar
    if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
      onPlayWild(card);
    } else {
      onPlayCard(card.id);
    }
  };

  if (isSpectator) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-6 px-4">
        <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/20 text-white/90 text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-md shadow-lg">
          <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Modo Espectador: Estás observando la partida en tiempo real.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-end pb-3 pt-2">
      {/* Toast de pista o ayuda si la carta no es jugable */}
      <AnimatePresence>
        {hintMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 px-4 py-1.5 rounded-full bg-slate-950/95 border border-amber-400 text-amber-300 text-xs font-bold shadow-2xl flex items-center gap-1.5 z-40 backdrop-blur-md"
          >
            <span>{hintMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón Circular Grande de Cantar UNO en la parte izquierda */}
      <AnimatePresence>
        {showUnoButton && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: -40 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -40 }}
            className="fixed bottom-14 sm:bottom-16 left-3 sm:left-6 z-40 pointer-events-auto"
          >
            <motion.button
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.7)',
                  '0 0 40px rgba(245, 158, 11, 0.95)',
                  '0 0 20px rgba(239, 68, 68, 0.7)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              onClick={onCallUno}
              title="¡Presiona para cantar UNO!"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-rose-600 border-4 border-yellow-300 shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none group ring-4 ring-yellow-400/40 ring-offset-2 ring-offset-black/50"
            >
              <div className="flex items-center gap-0.5">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200 animate-bounce" />
                <span className="text-white font-black text-2xl sm:text-3xl font-display italic tracking-tighter drop-shadow-md">
                  UNO
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-yellow-100 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-full mt-0.5 border border-yellow-300/40">
                ¡Cantar!
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra superior de acciones de la mano: Hint de arrastrar y Botón Pasar */}
      <div className="w-full max-w-lg flex items-center justify-between px-4 mb-2 pointer-events-auto">
        <div className="text-[11px] font-semibold text-amber-200/80 hidden sm:block">
          {isMyTurn && showCards ? '✨ Arrastra hacia el centro o haz clic para lanzar' : ''}
        </div>

        {/* Botón Pasar Turno si ya robó carta */}
        {canPass && isMyTurn && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onPassTurn}
            className="px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-600 font-bold text-xs shadow-lg flex items-center gap-1 cursor-pointer z-30 backdrop-blur-sm ml-auto"
          >
            Pasar Turno
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Abanico / Contenedor horizontal de cartas de la mano con Arrastre y Lanzamiento */}
      <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 flex items-center justify-start sm:justify-center gap-1 sm:gap-2 min-h-[140px] sm:min-h-[170px]">
        {!showCards ? (
          /* Mientras se baraja y reparte, la mano se mantiene vacía en el fondo */
          <div className="text-xs font-semibold text-white/40 italic py-4 animate-pulse">
            🃏 Esperando reparto de cartas...
          </div>
        ) : hand.length === 0 ? (
          <div className="text-xs font-semibold text-amber-300/60 italic py-4 flex items-center gap-2">
            <span className="animate-spin text-amber-400">⏳</span>
            <span>Repartiendo tus cartas...</span>
          </div>
        ) : (
          hand.map((card, index) => {
            const playable =
              isMyTurn &&
              topDiscardCard !== null &&
              isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);

            const isDraggingThis = draggingCardId === card.id;

            return (
              <motion.div
                key={card.id || `card-${index}`}
                layout
                drag={playable}
                dragConstraints={{ top: -350, bottom: 20, left: -120, right: 120 }}
                dragElastic={0.7}
                dragSnapToOrigin={true}
                onDragStart={() => {
                  setDraggingCardId(card.id);
                  onDragStateChange?.(true);
                }}
                onDragEnd={(_, info) => {
                  setDraggingCardId(null);
                  onDragStateChange?.(false);

                  // Si se lanzó hacia arriba o con suficiente velocidad hacia arriba
                  if (info.offset.y < -35 || info.velocity.y < -120) {
                    handleCardAttempt(card);
                  } else if (Math.abs(info.offset.y) < 8 && Math.abs(info.offset.x) < 8) {
                    // Tap / Click leve
                    handleCardAttempt(card);
                  }
                }}
                whileDrag={{
                  scale: 1.25,
                  rotate: -3,
                  zIndex: 100,
                  cursor: 'grabbing',
                  filter: 'drop-shadow(0 0 30px rgba(250,204,21,1)) brightness(1.15)',
                }}
                initial={{ y: 80, opacity: 0, scale: 0.7 }}
                animate={{
                  y: playable ? -14 : 0,
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 280,
                  damping: 22,
                }}
                whileHover={{ y: playable ? -26 : -8, scale: 1.08, zIndex: 40 }}
                style={{ touchAction: 'none' }}
                className={`relative flex-shrink-0 transition-transform duration-200 cursor-pointer transform scale-[0.62] sm:scale-75 origin-bottom -mx-6 sm:-mx-4 ${
                  isDraggingThis
                    ? 'z-50'
                    : playable
                    ? 'filter drop-shadow-[0_0_18px_rgba(251,191,36,0.9)] z-20'
                    : 'opacity-70 hover:opacity-95 z-10'
                }`}
                onClick={() => handleCardAttempt(card)}
              >
                <Card
                  card={card}
                  isPlayable={playable}
                  onClick={() => handleCardAttempt(card)}
                />

                {/* Botón de inspeccionar / ayuda en cada carta */}
                {onZoomCard && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomCard(card);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/90 text-amber-300 border border-slate-700/80 shadow-md backdrop-blur-sm z-30 hover:scale-110 transition"
                    title="Inspeccionar ecuación"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
