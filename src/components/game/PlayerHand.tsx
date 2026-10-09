import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, CardColor } from '../../types/card';
import { Card } from '../card/Card';
import { isCardPlayable } from '../../engine/rules';
import { HelpCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundEffects } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface PlayerHandProps {
  hand: CardType[];
  topDiscardCard: CardType | null;
  activeColor: CardColor;
  accumulatedDrawCount: number;
  isMyTurn: boolean;
  drawnCardThisTurn?: CardType | null;
  hasCalledUno?: boolean;
  canPass?: boolean;
  isSpectator?: boolean;
  showCards?: boolean;
  helpMode?: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
  onPlayCard: (cardId: string) => void;
  onPlayWild: (card: CardType) => void;
  onCallUno?: () => void;
  onPassTurn?: () => void;
  onZoomCard?: (card: CardType) => void;
}

interface FlyingCardData {
  card: CardType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  topDiscardCard,
  activeColor,
  accumulatedDrawCount,
  isMyTurn,
  drawnCardThisTurn,
  isSpectator = false,
  showCards = true,
  helpMode = true,
  onDragStateChange,
  onPlayCard,
  onPlayWild,
  onZoomCard,
}) => {
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [launchingCardId, setLaunchingCardId] = useState<string | null>(null);
  const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const [displayedHand, setDisplayedHand] = useState<CardType[]>(hand);
  const [drawingCard, setDrawingCard] = useState<{
    card: CardType;
    startX: number;
    startY: number;
    stageX: number;
    stageY: number;
    targetX: number;
    targetY: number;
    phase: 'aboveDeck' | 'glideToHand';
    isPlayable: boolean;
  } | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  const displayedHandRef = useRef<CardType[]>(displayedHand);
  displayedHandRef.current = displayedHand;

  // Medidas dinámicas adaptadas al tamaño de la pantalla (compacto en móvil, amplio y nítido en PC)
  const getCardDimensions = useCallback(() => {
    if (typeof window === 'undefined') return { width: 72, height: 106 };
    if (window.innerWidth >= 1536) return { width: 136, height: 198 };
    if (window.innerWidth >= 1280) return { width: 126, height: 184 };
    if (window.innerWidth >= 1024) return { width: 114, height: 166 };
    if (window.innerWidth >= 768) return { width: 100, height: 146 };
    if (window.innerWidth >= 640) return { width: 82, height: 120 };
    return { width: 72, height: 106 };
  }, []);

  // Animación física secuencial 1 por 1 al robar cartas ("comer hasta poder tirar"):
  // La carta se muestra arriba del mazo de robo en el centro de la mesa.
  // Si no es jugable, hace una pausa y desciende a la mano continuando el robo si quedan más.
  // Si es jugable, se ilumina prominentemente arriba del mazo y luego pasa a la mano lista para lanzar.
  useEffect(() => {
    // Si la visualización de cartas aún no está activa (ej. animación de inicio en curso)
    if (!showCards) {
      setDisplayedHand(hand);
      return;
    }

    // Detectar si es una partida nueva o revancha (ninguna carta de la mano anterior coincide)
    const isCompletelyNewHand =
      hand.length === 7 &&
      (displayedHandRef.current.length === 0 ||
        !hand.some((c) => displayedHandRef.current.some((dh) => dh.id === c.id)));

    if (isCompletelyNewHand) {
      setDisplayedHand(hand);
      return;
    }

    // Si la mano disminuyó (se jugó una carta) o se mantuvo igual
    if (hand.length <= displayedHandRef.current.length) {
      setDisplayedHand(hand);
      return;
    }

    // Se detectan cartas nuevas robadas
    const newCards = hand.filter(
      (c) => !displayedHandRef.current.some((dh) => dh.id === c.id)
    );

    if (newCards.length === 0) {
      setDisplayedHand(hand);
      return;
    }

    // Si la carga de cartas nuevas es de 7 (reparto inicial), poblar directamente sin acumular
    if (newCards.length >= 7) {
      setDisplayedHand(hand);
      return;
    }

    // Reproducir robo secuencial 1 a 1 desde el mazo hacia la mano con física suave
    let index = 0;
    let cancelled = false;

    const animateNextCard = () => {
      if (cancelled || index >= newCards.length) return;

      const card = newCards[index];
      const isLast = index === newCards.length - 1;
      index++;

      const deckEl = document.getElementById('table-draw-deck');
      const deckRect = deckEl?.getBoundingClientRect();
      const scrollEl = scrollContainerRef.current;

      const dims = getCardDimensions();
      const deckX = deckRect
        ? deckRect.left + deckRect.width / 2 - dims.width / 2
        : window.innerWidth / 2 - dims.width / 2;
      const deckY = deckRect
        ? deckRect.top + deckRect.height / 2 - dims.height / 2
        : window.innerHeight / 2 - 100;

      // Posición arriba del mazo de uno completo (en el centro, sobre el mazo para apreciarla)
      const stageX = deckX;
      const stageY = deckRect ? deckRect.top - 20 : deckY - 40;

      // Calcular posición objetivo: A LA DERECHA DE LA ÚLTIMA CARTA DE LA MANO (no al fondo derecha de la pantalla)
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight - dims.height - 20;

      const lastVisibleCard = displayedHandRef.current[displayedHandRef.current.length - 1];
      const lastCardEl = lastVisibleCard ? cardElementsRef.current[lastVisibleCard.id] : null;

      if (lastCardEl) {
        const lastCardRect = lastCardEl.getBoundingClientRect();
        targetX = lastCardRect.right + 10;
        targetY = lastCardRect.top;
      } else if (scrollEl) {
        const scrollRect = scrollEl.getBoundingClientRect();
        targetX = scrollRect.left + scrollRect.width / 2 - dims.width / 2;
        targetY = scrollRect.top + 8;
      }

      // Asegurar que no rebase el margen visible derecho de la ventana
      if (targetX + dims.width > window.innerWidth - 20) {
        targetX = window.innerWidth - dims.width - 20;
      }

      // Si el contenedor requiere scroll horizontal para revelar la nueva carta, desplazar suavemente
      if (scrollEl && targetX + dims.width > scrollEl.getBoundingClientRect().right - 20) {
        scrollEl.scrollBy({ left: dims.width + 16, behavior: 'smooth' });
      }

      // NUNCA es jugable si es penalización (+2, +4, acumulado), si no es el turno propio, o si se robaron múltiples cartas por castigo.
      // En un robo normal ("comer hasta poder tirar"), únicamente la última carta encontrada puede ser jugable.
      const isPenaltyDraw = accumulatedDrawCount > 0 || !isMyTurn || newCards.length > 1;
      const isPlayable = Boolean(
        !isPenaltyDraw &&
        isLast &&
        isMyTurn &&
        (drawnCardThisTurn
          ? card.id === drawnCardThisTurn.id
          : topDiscardCard && isCardPlayable(card, topDiscardCard, activeColor, 0))
      );

      // Sonido y háptico de robo
      soundEffects.drawCard();
      triggerHaptic('light');

      // 1. La carta se eleva y se muestra arriba del mazo de robo
      setDrawingCard({
        card,
        startX: deckX,
        startY: deckY,
        stageX,
        stageY,
        targetX,
        targetY,
        phase: 'aboveDeck',
        isPlayable,
      });

      if (isPlayable) {
        soundEffects.yourTurn();
        triggerHaptic('medium');
      }

      // Si es jugable, se queda más tiempo iluminada arriba del mazo para apreciarla (750ms).
      // Si no es jugable, pausa 480ms y continúa su animación de arrastre hacia la mano.
      const pauseDuration = isPlayable ? 750 : 480;

      setTimeout(() => {
        if (cancelled) return;

        // 2. La carta desciende suavemente a la baraja del jugador
        setDrawingCard((prev) =>
          prev ? { ...prev, phase: 'glideToHand' } : null
        );

        setTimeout(() => {
          if (cancelled) return;

          // 3. Se incorpora a la mano visible
          setDisplayedHand((prev) => {
            if (prev.some((p) => p.id === card.id)) return prev;
            return [...prev, card];
          });
          setDrawingCard(null);

          if (isPlayable) {
            setHighlightedCardId(card.id);
            setHintMsg(`✨ ¡Robaste carta jugable! Lánzala para continuar.`);
            setTimeout(() => setHintMsg(null), 3500);
            setTimeout(() => setHighlightedCardId(null), 4000);
          }

          if (!isLast) {
            // Sigue la animación de arrastre para la siguiente carta
            setTimeout(animateNextCard, 100);
          }
        }, 440);
      }, pauseDuration);
    };

    animateNextCard();

    return () => {
      cancelled = true;
    };
  }, [hand, topDiscardCard, activeColor, accumulatedDrawCount, isMyTurn, drawnCardThisTurn, getCardDimensions]);

  // Desplazamiento horizontal asistido con flechas para móviles y desktop con muchas cartas
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      soundEffects.cardTouch();
    }
  };

  // Lanzamiento garantizado y con animación fluida hacia la pila de descarte
  const launchCard = useCallback(
    (card: CardType) => {
      if (launchingCardId) return; // Evitar disparos dobles

      const cardEl = cardElementsRef.current[card.id];
      const discardEl = document.getElementById('table-discard-pile');

      const cardRect = cardEl?.getBoundingClientRect();
      const discardRect = discardEl?.getBoundingClientRect();

      const dims = getCardDimensions();
      const cardWidth = cardRect ? cardRect.width : dims.width;
      const cardHeight = cardRect ? cardRect.height : dims.height;

      const startX = cardRect ? cardRect.left : window.innerWidth / 2 - cardWidth / 2;
      const startY = cardRect ? cardRect.top : window.innerHeight - cardHeight - 20;

      // Coordenadas objetivo en la pila central de descarte
      const targetX = discardRect
        ? discardRect.left + discardRect.width / 2 - cardWidth / 2
        : window.innerWidth / 2 - cardWidth / 2;
      const targetY = discardRect
        ? discardRect.top + discardRect.height / 2 - cardHeight / 2
        : window.innerHeight / 2 - cardHeight / 2 - 20;

      // 1. Ocultar carta de la mano de inmediato para no duplicar visualmente
      setLaunchingCardId(card.id);
      setDraggingCardId(null);
      onDragStateChange?.(false);

      // 2. Montar carta voladora de alta fluidez
      setFlyingCard({
        card,
        startX,
        startY,
        targetX,
        targetY,
        width: cardWidth,
        height: cardHeight,
      });
    },
    [launchingCardId, onDragStateChange, getCardDimensions]
  );

  const handleCardAttempt = useCallback(
    (card: CardType) => {
      if (isSpectator) return;

      if (!isMyTurn) {
        soundEffects.invalidCard();
        setShakingCardId(card.id);
        setTimeout(() => setShakingCardId(null), 400);
        setHintMsg('⏳ ¡Espera a que sea tu turno para lanzar!');
        setTimeout(() => setHintMsg(null), 2500);
        return;
      }

      if (!topDiscardCard) return;

      const playable = isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);
      if (!playable && helpMode) {
        soundEffects.invalidCard();
        setShakingCardId(card.id);
        setTimeout(() => setShakingCardId(null), 400);

        if (accumulatedDrawCount > 0) {
          setHintMsg(`🔥 ¡Castigo acumulado (+${accumulatedDrawCount})! Solo puedes defenderte con un +2 o +4.`);
        } else {
          setHintMsg(`⚠️ Esta carta no coincide con el color (${activeColor}) ni con la solución numérica.`);
        }
        setTimeout(() => setHintMsg(null), 3000);
        return;
      }

      // En Modo Sin Ayuda (o si es válida en modo ayuda): Lanzar inmediatamente la carta
      launchCard(card);
    },
    [isSpectator, isMyTurn, topDiscardCard, activeColor, accumulatedDrawCount, helpMode, launchCard]
  );

  const handleFlightComplete = () => {
    if (!flyingCard) return;
    const card = flyingCard.card;

    // Sonido e impacto al aterrizar en el centro
    soundEffects.playCard();
    triggerHaptic('medium');

    setFlyingCard(null);
    setLaunchingCardId(null);

    // Ejecutar acción del juego en la sala
    if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
      onPlayWild(card);
    } else {
      onPlayCard(card.id);
    }
  };

  // Separación adaptativa para manos de cartas (compacto en móvil, amplio y sin colisiones en PC)
  const getCardSpacing = (count: number) => {
    if (count <= 4) return 'mx-1 sm:mx-1.5 md:mx-2 lg:mx-3 xl:mx-3.5';
    if (count <= 7) return '-mx-2 sm:-mx-2.5 md:mx-1 lg:mx-2 xl:mx-2.5';
    if (count <= 10) return '-mx-3.5 sm:-mx-4 md:-mx-1 lg:mx-0.5 xl:mx-1';
    if (count <= 14) return '-mx-4.5 sm:-mx-5 md:-mx-2.5 lg:-mx-1.5 xl:-mx-1';
    return '-mx-5.5 sm:-mx-6 md:-mx-4 lg:-mx-3 xl:-mx-2.5';
  };

  if (isSpectator) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-4 px-4">
        <div className="px-5 py-2.5 rounded-2xl bg-black/40 border border-white/20 text-white/90 text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-md shadow-lg">
          <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Modo Espectador: Estás observando la partida en tiempo real.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-end pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 select-none">
      {/* Toast flotante de pista o error estético con icono dinámico */}
      <AnimatePresence>
        {hintMsg && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="mb-2 px-4 py-2 rounded-2xl bg-slate-950/95 border border-amber-400/80 text-amber-200 text-xs sm:text-sm font-bold shadow-2xl shadow-amber-500/25 flex items-center gap-2 z-40 backdrop-blur-md"
          >
            <span className="text-sm">
              {hintMsg.includes('Castigo')
                ? '🔥'
                : hintMsg.includes('Espera')
                ? '⏳'
                : hintMsg.includes('Robaste')
                ? '✨'
                : '⚠️'}
            </span>
            <span>{hintMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Barra superior de información */}
      <div className="w-full max-w-lg flex items-center justify-center px-4 mb-1 pointer-events-auto">
        <div className="text-[10px] sm:text-[11px] font-semibold text-amber-200/90 hidden sm:block">
          {isMyTurn && showCards ? '✨ Desliza hacia arriba o pulsa una carta para lanzar' : ''}
        </div>
      </div>

      {/* Contenedor relativo para el abanico y flechas de navegación táctil */}
      <div className="relative w-full flex items-center justify-center">
        {/* Flecha Izquierda para desplazamiento si hay muchas cartas */}
        {displayedHand.length > 5 && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-1 md:left-4 z-30 p-1.5 md:p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white/90 backdrop-blur-md shadow-lg active:scale-95 transition"
            title="Desplazar cartas hacia la izquierda"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}

        {/* Abanico de cartas: touch-pan-x permite scroll horizontal nativo y drag='y' permite lanzar hacia arriba */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto touch-pan-x overscroll-x-contain no-scrollbar py-2 sm:py-2.5 md:py-3 lg:py-3.5 xl:py-4 px-4 sm:px-6 md:px-10 lg:px-14 flex items-center justify-start sm:justify-center gap-0.5 min-h-[116px] max-h-[136px] sm:min-h-[130px] sm:max-h-[150px] md:min-h-[158px] md:max-h-[180px] lg:min-h-[178px] lg:max-h-[205px] xl:min-h-[196px] xl:max-h-[225px] 2xl:min-h-[210px] 2xl:max-h-[240px] mobile-landscape:min-h-[105px] mobile-landscape:max-h-[120px] scroll-smooth"
        >
          {!showCards ? (
            <div className="text-xs font-semibold text-white/40 italic py-3 animate-pulse text-center w-full">
              🃏 Esperando reparto de cartas...
            </div>
          ) : displayedHand.length === 0 ? (
            <div className="text-xs font-semibold text-amber-300/60 italic py-3 flex items-center justify-center gap-2 w-full">
              <span className="animate-spin text-amber-400">⏳</span>
              <span>Repartiendo tus cartas...</span>
            </div>
          ) : (
            displayedHand.map((card, index) => {
              const playable =
                isMyTurn &&
                topDiscardCard !== null &&
                isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);

              const isDraggingThis = draggingCardId === card.id;
              const isShakingThis = shakingCardId === card.id;
              const isLaunchingThis = launchingCardId === card.id;
              const isHighlightedThis = highlightedCardId === card.id;

              // Ocultar la carta que está actualmente en el aire volando hacia el centro
              if (isLaunchingThis) {
                return (
                  <div
                    key={card.id || `card-${index}`}
                    className={`relative flex-shrink-0 opacity-0 pointer-events-none ${getCardSpacing(
                      displayedHand.length
                    )} w-[72px] h-[106px] sm:w-[82px] sm:h-[120px] md:w-[100px] md:h-[146px] lg:w-[114px] lg:h-[166px] xl:w-[126px] xl:h-[184px] 2xl:w-[136px] 2xl:h-[198px]`}
                  />
                );
              }

              return (
                <motion.div
                  key={card.id || `card-${index}`}
                  ref={(el) => {
                    cardElementsRef.current[card.id] = el;
                  }}
                  drag={isMyTurn && !isSpectator ? 'y' : false}
                  dragDirectionLock={true}
                  dragConstraints={{ top: -380, bottom: 0 }}
                  dragElastic={0.2}
                  dragSnapToOrigin={true}
                  onDragStart={() => {
                    setDraggingCardId(card.id);
                    onDragStateChange?.(true);
                    soundEffects.cardTouch();
                  }}
                  onDragEnd={(_, info) => {
                    setDraggingCardId(null);
                    onDragStateChange?.(false);

                    if (!isMyTurn) {
                      soundEffects.invalidCard();
                      setShakingCardId(card.id);
                      setTimeout(() => setShakingCardId(null), 400);
                      setHintMsg('⏳ ¡Espera a que sea tu turno para lanzar!');
                      setTimeout(() => setHintMsg(null), 2500);
                      return;
                    }

                    if (!topDiscardCard) return;

                    const isCurrentPlayable = isCardPlayable(card, topDiscardCard, activeColor, accumulatedDrawCount);

                    if (isCurrentPlayable || !helpMode) {
                      // Si se arrastró hacia arriba (lanzamiento directo e inmediato)
                      if (info.offset.y < -30 || info.velocity.y < -50) {
                        launchCard(card);
                      }
                    } else {
                      // Carta NO jugable en Modo Ayuda: si intentó arrastrarla hacia arriba, vibra y regresa a la mano
                      if (info.offset.y < -25 || info.velocity.y < -50) {
                        soundEffects.invalidCard();
                        setShakingCardId(card.id);
                        setTimeout(() => setShakingCardId(null), 450);
                        triggerHaptic('heavy');
                        if (accumulatedDrawCount > 0) {
                          setHintMsg(`🔥 ¡Castigo acumulado (+${accumulatedDrawCount})! Solo puedes defenderte con un +2 o +4.`);
                        } else {
                          setHintMsg(`⚠️ Esta carta no coincide con el color (${activeColor}) ni con la solución numérica.`);
                        }
                        setTimeout(() => setHintMsg(null), 3000);
                      }
                    }
                  }}
                  whileDrag={{
                    scale: 1.1,
                    zIndex: 90,
                    cursor: 'grabbing',
                  }}
                  initial={{ y: 50, opacity: 0, scale: 0.8 }}
                  animate={{
                    y: isDraggingThis
                      ? -35
                      : isHighlightedThis
                      ? -20
                      : playable
                      ? -8
                      : 0,
                    x: isShakingThis ? [-6, 6, -5, 5, 0] : 0,
                    scale: isHighlightedThis ? 1.08 : 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: draggingCardId ? 0 : index * 0.02,
                    type: 'spring',
                    stiffness: 240,
                    damping: 24,
                    mass: 0.8,
                  }}
                  whileHover={
                    playable && helpMode
                      ? { y: -16, scale: 1.06, zIndex: 40 }
                      : { y: -5, zIndex: 30 }
                  }
                  style={{ touchAction: 'pan-x' }}
                  className={`relative flex-shrink-0 cursor-pointer origin-bottom card-hardware-accel ${getCardSpacing(
                    displayedHand.length
                  )} ${
                    isDraggingThis
                      ? 'z-50 shadow-2xl'
                      : isHighlightedThis && helpMode
                      ? 'shadow-[0_0_24px_rgba(250,204,21,0.9)] z-40'
                      : playable && helpMode
                      ? 'shadow-[0_0_14px_rgba(251,191,36,0.8)] z-20'
                      : 'opacity-90 hover:opacity-100 z-10'
                  }`}
                  onClick={() => handleCardAttempt(card)}
                >
                  <Card
                    card={card}
                    size="hand"
                    isPlayable={helpMode ? playable : false}
                    onClick={() => handleCardAttempt(card)}
                  />

                  {/* Indicador de arrastre hacia arriba cuando se está arrastrando la carta */}
                  {isDraggingThis && (
                    <div className="absolute -top-7 inset-x-0 text-center pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-400 text-slate-950 uppercase shadow-lg tracking-wider border border-white">
                        ↑ Arrastra para lanzar
                      </span>
                    </div>
                  )}

                  {/* Badge animado si es la carta jugable recién comida (Solo en Modo Ayuda) */}
                  {isHighlightedThis && helpMode && (
                    <div className="absolute -top-6.5 md:-top-8 inset-x-0 text-center pointer-events-none animate-bounce z-40">
                      <span className="px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black bg-amber-400 text-slate-950 uppercase shadow-lg tracking-wider border border-white">
                        ✨ ¡Tu jugada!
                      </span>
                    </div>
                  )}

                  {/* Botón discreto en esquina inferior izquierda para inspeccionar ecuación (SOLO EN MODO AYUDA) */}
                  {onZoomCard && helpMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoomCard(card);
                      }}
                      className="absolute bottom-1.5 left-1.5 p-1 rounded-full bg-slate-950/85 text-amber-300 hover:text-white border border-white/25 shadow-md backdrop-blur-xs z-30 hover:scale-115 active:scale-90 transition"
                      title="Inspeccionar ecuación"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Flecha Derecha para desplazamiento si hay muchas cartas */}
        {displayedHand.length > 5 && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-1 md:right-4 z-30 p-1.5 md:p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white/90 backdrop-blur-md shadow-lg active:scale-95 transition"
            title="Desplazar cartas hacia la derecha"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
      </div>

      {/* CARTA ROBADA: Animación fluida de robo (aparece sobre el mazo en el centro, se ilumina si es jugable, y desciende a la mano) */}
      <AnimatePresence>
        {drawingCard && (
          <motion.div
            key={`draw-${drawingCard.card.id}`}
            initial={{
              position: 'fixed',
              left: drawingCard.startX,
              top: drawingCard.startY,
              scale: 0.9,
              rotate: -4,
              zIndex: 9998,
              opacity: 1,
            }}
            animate={
              drawingCard.phase === 'aboveDeck'
                ? {
                    left: drawingCard.stageX,
                    top: drawingCard.stageY,
                    scale: drawingCard.isPlayable ? 1.18 : 1.1,
                    rotate: 0,
                    opacity: 1,
                  }
                : {
                    left: drawingCard.targetX,
                    top: drawingCard.targetY,
                    scale: 1,
                    rotate: 0,
                    opacity: 1,
                  }
            }
            transition={{
              duration: drawingCard.phase === 'aboveDeck' ? 0.35 : 0.44,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              width: getCardDimensions().width,
              height: getCardDimensions().height,
              pointerEvents: 'none',
              filter:
                drawingCard.isPlayable && drawingCard.phase === 'aboveDeck'
                  ? 'drop-shadow(0 0 35px rgba(250,204,21,1)) drop-shadow(0 15px 30px rgba(0,0,0,0.8))'
                  : 'drop-shadow(0 15px 30px rgba(0,0,0,0.75))',
            }}
            className="card-hardware-accel relative"
          >
            {/* Si es jugable y está sobre el mazo: halo radiante y badge iluminado */}
            {drawingCard.isPlayable && drawingCard.phase === 'aboveDeck' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: [1, 1.06, 1], y: 0 }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="absolute -top-7 inset-x-0 text-center z-50 pointer-events-none"
              >
                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 uppercase shadow-[0_0_20px_rgba(251,191,36,1)] border-2 border-white tracking-wider">
                  ✨ ¡PUEDES TIRARLA!
                </span>
              </motion.div>
            )}
            <Card card={drawingCard.card} size="hand" isPlayable={drawingCard.isPlayable} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARTA VOLADORA: Animación fluida de vuelo físico desde la mano hasta la pila de descarte */}
      <AnimatePresence>
        {flyingCard && (
          <motion.div
            initial={{
              position: 'fixed',
              left: flyingCard.startX,
              top: flyingCard.startY,
              scale: 1,
              rotate: 0,
              zIndex: 9999,
              opacity: 1,
            }}
            animate={{
              left: flyingCard.targetX,
              top: flyingCard.targetY,
              scale: [1, 1.1, 1],
              rotate: [0, -4, 0],
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.38,
              ease: [0.18, 1, 0.32, 1],
            }}
            onAnimationComplete={handleFlightComplete}
            style={{
              width: flyingCard.width,
              height: flyingCard.height,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.75))',
            }}
            className="card-hardware-accel"
          >
            <Card card={flyingCard.card} size="hand" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
