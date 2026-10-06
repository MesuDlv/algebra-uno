import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { Card } from '../card/Card';
import { isCardPlayable } from '../../engine/rules';
import { Bell, ArrowRight, HelpCircle } from 'lucide-react';

interface PlayerHandProps {
  hand: CardType[];
  topDiscardCard: CardType | null;
  activeColor: CardColor;
  accumulatedDrawCount: number;
  isMyTurn: boolean;
  hasCalledUno: boolean;
  canPass: boolean;
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
  onPlayCard,
  onPlayWild,
  onCallUno,
  onPassTurn,
  onZoomCard,
}) => {
  const showUnoButton = (hand.length === 2 || hand.length === 1) && !hasCalledUno;

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn || !topDiscardCard) return;

    const playable = isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);
    if (!playable) return;

    if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
      onPlayWild(card);
    } else {
      onPlayCard(card.id);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-end pb-3 pt-2">
      {/* Barra superior de acciones de la mano: Botón UNO y Botón Pasar */}
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
          <div />
        )}

        {/* Botón Pasar Turno si ya robó carta */}
        {canPass && isMyTurn && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onPassTurn}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 font-bold text-xs shadow-lg flex items-center gap-1 cursor-pointer z-30"
          >
            Pasar Turno
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Abanico / Contenedor horizontal de cartas de la mano */}
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
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: playable ? -10 : 0, opacity: 1 }}
              whileHover={{ y: -20, scale: 1.06, zIndex: 40 }}
              className={`relative flex-shrink-0 transition-transform duration-200 cursor-pointer transform scale-[0.62] sm:scale-75 origin-bottom -mx-6 sm:-mx-4 ${
                playable
                  ? 'filter drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] z-20'
                  : 'opacity-65 hover:opacity-90 z-10'
              }`}
              onClick={() => handleCardClick(card)}
            >
              <Card card={card} isPlayable={playable} />

              {/* Botón de inspeccionar / ayuda en cada carta */}
              {onZoomCard && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onZoomCard(card);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-amber-300 border border-slate-700/80 shadow-md backdrop-blur-sm z-30"
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
