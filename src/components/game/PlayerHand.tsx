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
  onPlayCard,
  onPlayWild,
  onCallUno,
  onPassTurn,
  onZoomCard,
}) => {
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const showUnoButton = (hand.length === 2 || hand.length === 1) && !hasCalledUno && !isSpectator;

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
          <Eye className="w-4 h-4 text-amber-300 animate-pulse" />
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

      {/* Barra superior de acciones de la mano: Botón UNO, Hint de arrastrar y Botón Pasar */}
      <div className="w-full max-w-lg flex items-center justify-between px-4 mb-2 pointer-events-auto">
        {/* Botón Flotante de Cantar UNO */}
        {showUnoButton ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.08, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            onClick={onCallUno}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-red-500/50 border-2 border-yellow-300 flex items-center gap-1.5 cursor-pointer z-30"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            ¡Cantar UNO!
          </motion.button>
        ) : (
          <div className="text-[11px] font-semibold text-amber-200/80 hidden sm:block">
            {isMyTurn ? '👆 Toca o arrastra hacia arriba para lanzar' : ''}
          </div>
        )}

        {/* Botón Pasar Turno si ya robó carta */}
        {canPass && isMyTurn && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onPassTurn}
            className="px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-600 font-bold text-xs shadow-lg flex items-center gap-1 cursor-pointer z-30 backdrop-blur-sm"
          >
            Pasar Turno
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Abanico / Contenedor horizontal de cartas de la mano con Arrastre y Lanzamiento */}
      <div className="w-full overflow-x-auto no-scrollbar py-2 px-4 flex items-center justify-start sm:justify-center gap-1 sm:gap-2">
        {hand.map((card, index) => {
          const playable =
            isMyTurn &&
            topDiscardCard !== null &&
            isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);

          return (
            <motion.div
              key={card.id || `card-${index}`}
              layout
              drag={playable ? 'y' : false}
              dragConstraints={{ top: -250, bottom: 0 }}
              dragElastic={0.25}
              dragSnapToOrigin={true}
              whileDrag={{ scale: 1.15, zIndex: 60, cursor: 'grabbing' }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -50 || info.velocity.y < -200) {
                  handleCardAttempt(card);
                }
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: playable ? -14 : 0, opacity: 1 }}
              whileHover={{ y: playable ? -24 : -6, scale: 1.08, zIndex: 40 }}
              className={`relative flex-shrink-0 transition-transform duration-200 cursor-pointer transform scale-[0.62] sm:scale-75 origin-bottom -mx-6 sm:-mx-4 ${
                playable
                  ? 'filter drop-shadow-[0_0_16px_rgba(251,191,36,0.85)] z-20'
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
        })}
      </div>
    </div>
  );
};
