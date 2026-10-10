import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameRoom } from '../hooks/useGameRoom';
import { OpponentsBar } from '../components/game/OpponentsBar';
import { TableCenter } from '../components/game/TableCenter';
import { PlayerHand } from '../components/game/PlayerHand';
import { ColorPickerModal } from '../components/game/ColorPickerModal';
import { VictoryModal } from '../components/game/VictoryModal';
import { CardZoomModal } from '../components/card/CardZoomModal';
import { StartGameAnimation } from '../components/game/StartGameAnimation';
import { DrawPenaltyAnimation } from '../components/game/DrawPenaltyAnimation';
import { ActionAnnouncementModal, GameAnnouncement } from '../components/game/ActionAnnouncementModal';
import { Card } from '../components/card/Card';
import { Card as CardType, CardColor } from '../types/card';
import { soundEffects } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { LogOut, BookOpen, Clock, Volume2, VolumeX, Eye } from 'lucide-react';
import { ShopModal } from '../components/shop/ShopModal';
import { AvatarDisplay } from '../components/common/AvatarDisplay';

interface GamePageProps {
  roomId: string;
  currentUserUid: string;
  onExitRoom: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({
  roomId,
  currentUserUid,
  onExitRoom,
}) => {
  const {
    room,
    gameState,
    presence,
    isHost,
    isMyTurn,
    playCard,
    chooseColor,
    drawCard,
    passTurn,
    callUno,
    catchUno,
    skipInactivePlayer,
    disqualifyPlayer,
    requestRematch,
    exitRoom,
  } = useGameRoom(roomId, currentUserUid);

  const [pendingWildCard, setPendingWildCard] = useState<CardType | null>(null);
  const [zoomedCard, setZoomedCard] = useState<CardType | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundEffects.isSoundEnabled());
  const [showStartAnimation, setShowStartAnimation] = useState<boolean>(true);
  const [isDraggingCard, setIsDraggingCard] = useState<boolean>(false);
  const [penaltyCount, setPenaltyCount] = useState<number | null>(null);
  const [gameToast, setGameToast] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const prevActionCounterRef = useRef<number>(0);
  const [disconnectCountdown, setDisconnectCountdown] = useState<{
    uid: string;
    name: string;
    secondsLeft: number;
  } | null>(null);

  const [opponentFlyingCard, setOpponentFlyingCard] = useState<{
    card: CardType;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  // Anuncios de acciones clave (Cambio de color, Reversa, Bloqueo personal y UNO)
  const [announcement, setAnnouncement] = useState<GameAnnouncement | null>(null);
  const prevActionRef = useRef<string | null>(null);
  const prevDirectionRef = useRef<1 | -1>(gameState.direction);
  const prevActiveColorRef = useRef<CardColor>(gameState.activeColor);

  const prevIsMyTurnRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string>(gameState.status);
  const prevDiscardLengthRef = useRef<number>(gameState.discardPile.length);
  const prevTopDiscardIdRef = useRef<string | null>(null);
  const myLastPlayedCardIdRef = useRef<string | null>(null);

  // Asegurar que la pantalla no tenga scroll residual al entrar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setShowStartAnimation(false);
  }, []);

  const handlePenaltyComplete = useCallback(() => {
    setPenaltyCount(null);
  }, []);

  const handleAnnouncementComplete = useCallback(() => {
    setAnnouncement(null);
  }, []);

  // Determinar si el usuario actual es espectador
  const isSpectator = Boolean(
    room?.members.find((m) => m.uid === currentUserUid)?.isSpectator ||
    (gameState.players.length > 0 && !gameState.players.some((p) => p.uid === currentUserUid))
  );

  // Si la partida ya avanzó o el usuario es espectador, no mostrar/ocultar animación inicial
  useEffect(() => {
    if (isSpectator || gameState.discardPile.length > 1 || (gameState.lastAction !== null && gameState.discardPile.length > 1)) {
      setShowStartAnimation(false);
    }
  }, [isSpectator, gameState.discardPile.length, gameState.lastAction]);

  const myPlayer = gameState.players.find((p) => p.uid === currentUserUid);
  const opponents = gameState.players.filter((p) => p.uid !== currentUserUid);
  const topDiscardCard =
    gameState.discardPile.length > 0
      ? gameState.discardPile[gameState.discardPile.length - 1]
      : null;

  // Rival que le queda 1 sola carta y no cantó UNO (vulnerable para atrapar)
  const vulnerableOpponent = opponents.find((opp) =>
    gameState.unoVulnerableUids?.includes(opp.uid)
  );

  // Detección de cartas de castigo (+2, +4 o acumulación):
  // SOLO se activa la ventana emergente al jugador que realmente se comió una penalización de ataque/castigo.
  // NUNCA debe activarse cuando el jugador simplemente roba del mazo hasta poder jugar ("hasta que pudo lanzar").
  useEffect(() => {
    if (!myPlayer || !gameState.lastAction) return;

    const myName = myPlayer.name;
    const action = gameState.lastAction;

    // Solo es penalización si perdió su turno por castigo (+2, +4), no se defendió de acumulación, fue atrapado o penalizado por inactividad.
    const isPenaltyVictim =
      ((action.includes(`¡${myName} comió `) || action.includes(`${myName} comió `)) && action.includes('pierde su turno')) ||
      action.includes(`${myName} no se defendió y robó `) ||
      action.includes(`¡${myName} fue atrapado sin cantar UNO!`) ||
      action.includes(`${myName} tardó demasiado y robó `);

    if (isPenaltyVictim) {
      const match = action.match(/(\d+)\s+cartas/i);
      const count = match ? parseInt(match[1], 10) : (action.includes('4') ? 4 : 2);
      setPenaltyCount(count);
      soundEffects.attack();
      triggerHaptic('attack');
    }
  }, [gameState.lastAction, myPlayer?.name]);

  // Detección de anuncios de acciones clave:
  // 1. Cambio de Color (Comodín) - visible para todos
  // 2. Cambio de Sentido (Reversa) - visible para todos indicando el nuevo rumbo
  // 3. Bloqueo (Skip) - EXCLUSIVO para el jugador bloqueado
  // 4. Cantar UNO - visible para toda la mesa para alertar a los rivales
  useEffect(() => {
    if (!gameState.lastAction || gameState.status !== 'playing') {
      prevActionRef.current = gameState.lastAction;
      prevDirectionRef.current = gameState.direction;
      prevActiveColorRef.current = gameState.activeColor;
      return;
    }

    const action = gameState.lastAction;
    const currentCounter = gameState.actionCounter ?? 0;
    if (action === prevActionRef.current && currentCounter === prevActionCounterRef.current) return;
    prevActionRef.current = action;
    prevActionCounterRef.current = currentCounter;

    // 1. Cambio de Color (Comodín o Comodín +4)
    const isColorAction =
      action.includes('cambió el color a') ||
      action.includes('eligió el color') ||
      (action.includes('jugó +4 (') && action.includes(')'));

    if (isColorAction) {
      let detectedColor: Exclude<CardColor, 'wild'> = 'red';
      if (action.includes('red') || action.includes('rojo')) detectedColor = 'red';
      else if (action.includes('blue') || action.includes('azul')) detectedColor = 'blue';
      else if (action.includes('green') || action.includes('verde')) detectedColor = 'green';
      else if (action.includes('yellow') || action.includes('amarillo')) detectedColor = 'yellow';
      else if (gameState.activeColor !== 'wild') detectedColor = gameState.activeColor as Exclude<CardColor, 'wild'>;

      const playerMatch = action.match(/^([^!]+?)\s+(eligió|cambió|jugó)/);
      const playerName = playerMatch ? playerMatch[1].trim() : undefined;

      setAnnouncement({
        id: `color-${Date.now()}-${detectedColor}`,
        type: 'color',
        color: detectedColor,
        playerName,
      });
      prevActiveColorRef.current = gameState.activeColor;
      return;
    }

    // 2. Bloqueo (Skip) - EXCLUSIVO y GARANTIZADO para el usuario bloqueado
    const isVictimOfBlock =
      Boolean(gameState.blockedPlayerUid && gameState.blockedPlayerUid === currentUserUid) ||
      Boolean(myPlayer && action.includes(`¡${myPlayer.name} ha sido bloqueado!`));

    if (isVictimOfBlock) {
      const playerMatch = action.match(/^(.+?)\s+jugó/);
      const playerName = playerMatch ? playerMatch[1].trim() : undefined;

      setAnnouncement({
        id: `block-${gameState.actionCounter || Date.now()}-${currentUserUid}`,
        type: 'block',
        victimName: myPlayer?.name || 'Tú',
        playerName,
      });
      triggerHaptic('heavy');
      return;
    }

    // Detección de penalización por error en Modo Sin Ayuda
    if (
      action.includes('Come 2 cartas y pierde su turno') &&
      myPlayer &&
      action.includes(myPlayer.name)
    ) {
      setPenaltyCount(2);
      soundEffects.invalidCard();
      triggerHaptic('heavy');
      return;
    }

    // 3. Cambio de Sentido (Reversa)
    if (action.includes('jugó Reversa') && !action.includes('ha sido bloqueado')) {
      const playerMatch = action.match(/^(.+?)\s+jugó Reversa/);
      const playerName = playerMatch ? playerMatch[1].trim() : undefined;

      setAnnouncement({
        id: `reverse-${Date.now()}-${gameState.direction}`,
        type: 'reverse',
        direction: gameState.direction,
        playerName,
      });
      prevDirectionRef.current = gameState.direction;
      triggerHaptic('medium');
      return;
    }

    // 4. Cantar UNO
    if (action.includes('cantó UNO!')) {
      const unoMatch = action.match(/¡(.+?)\s+cantó UNO!/);
      const unoPlayerName = unoMatch ? unoMatch[1].trim() : 'Un jugador';

      setAnnouncement({
        id: `uno-${Date.now()}-${unoPlayerName}`,
        type: 'uno',
        playerName: unoPlayerName,
      });
      triggerHaptic('medium');
      return;
    }
  }, [gameState.lastAction, gameState.status, gameState.direction, gameState.activeColor, myPlayer]);

  // Limpieza garantizada del naipe lanzado por un rival (se retira automáticamente tras el vuelo)
  useEffect(() => {
    if (!opponentFlyingCard) return;
    const timer = setTimeout(() => {
      setOpponentFlyingCard(null);
    }, 480);
    return () => clearTimeout(timer);
  }, [opponentFlyingCard]);

  // Animación física de lanzamiento cuando un rival o cualquier jugador (en modo espectador) tira una carta
  useEffect(() => {
    const currentLen = gameState.discardPile.length;
    const currentTop = topDiscardCard;

    // Solo se anima durante la partida si se jugó una nueva carta (nunca en la carta inicial del reparto)
    if (
      currentLen > 1 &&
      currentLen > prevDiscardLengthRef.current &&
      currentTop &&
      currentTop.id !== prevTopDiscardIdRef.current &&
      gameState.status === 'playing'
    ) {
      // Verificar si la jugó el jugador local (él ya tiene su propia animación en PlayerHand)
      const isPlayedByMe =
        !isSpectator &&
        Boolean(
          (myLastPlayedCardIdRef.current && myLastPlayedCardIdRef.current === currentTop.id) ||
          (myPlayer && gameState.lastAction?.startsWith(myPlayer.name))
        );

      myLastPlayedCardIdRef.current = null;

      if (!isPlayedByMe) {
        // Encontrar al rival o jugador que lanzó la carta
        const shooter =
          opponents.find((opp) => gameState.lastAction?.startsWith(opp.name)) ||
          gameState.players.find((p) => gameState.lastAction?.startsWith(p.name)) ||
          opponents[0];

        const shooterEl = shooter ? document.getElementById(`opponent-${shooter.uid}`) : null;
        const discardSlot =
          document.getElementById('table-discard-card-slot') ||
          document.getElementById('table-discard-pile');

        const shooterRect = shooterEl?.getBoundingClientRect();
        const slotRect = discardSlot?.getBoundingClientRect();

        const startX = shooterRect
          ? shooterRect.left + shooterRect.width / 2 - 36
          : window.innerWidth / 2 - 36;
        const startY = shooterRect
          ? shooterRect.top + shooterRect.height / 2 - 50
          : 60;

        const targetX = slotRect
          ? slotRect.left + slotRect.width / 2 - 36
          : window.innerWidth / 2 - 36;
        const targetY = slotRect
          ? slotRect.top + slotRect.height / 2 - 53
          : window.innerHeight / 2 - 53;

        const cardToFly =
          (currentTop.type === 'wild' || currentTop.type === 'wild4' || currentTop.color === 'wild') &&
          gameState.activeColor !== 'wild'
            ? { ...currentTop, color: gameState.activeColor }
            : currentTop;

        setOpponentFlyingCard({
          card: cardToFly,
          startX,
          startY,
          targetX,
          targetY,
        });

        soundEffects.playCard();
      }
    }

    prevDiscardLengthRef.current = currentLen;
    prevTopDiscardIdRef.current = currentTop?.id || null;
  }, [
    gameState.discardPile.length,
    topDiscardCard,
    gameState.status,
    gameState.activeColor,
    gameState.lastAction,
    gameState.players,
    isSpectator,
    myPlayer,
    opponents,
  ]);

  const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];

  // Efecto cuando cambia a mi turno
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      if (gameState.accumulatedDrawCount > 0) {
        soundEffects.attack();
        triggerHaptic('attack');
      } else {
        soundEffects.yourTurn();
        triggerHaptic('light');
      }
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn, gameState.accumulatedDrawCount]);

  // Efecto cuando finaliza la partida
  useEffect(() => {
    if (gameState.status === 'finished' && prevStatusRef.current !== 'finished') {
      soundEffects.victory();
      triggerHaptic('victory');
    }
    prevStatusRef.current = gameState.status;
  }, [gameState.status]);

  // Monitoreo de desconexión de rivales humanos: cuenta regresiva de 60 segundos
  useEffect(() => {
    if (gameState.status !== 'playing' && gameState.status !== 'pendingColor') {
      setDisconnectCountdown(null);
      return;
    }

    // Buscar si hay algún rival humano desconectado
    const humanOpponents = gameState.players.filter(
      (p) => !p.uid.startsWith('bot_') && p.uid !== currentUserUid
    );

    const disconnected = humanOpponents.find((opp) => {
      const pInfo = presence.find((p) => p.uid === opp.uid);
      if (pInfo) {
        return !pInfo.isOnline;
      }
      return presence.length > 0;
    });

    if (!disconnected) {
      setDisconnectCountdown(null);
      return;
    }

    setDisconnectCountdown((prev) => {
      if (prev && prev.uid === disconnected.uid) {
        return prev;
      }
      return {
        uid: disconnected.uid,
        name: disconnected.name,
        secondsLeft: 60,
      };
    });
  }, [gameState.status, gameState.players, presence, currentUserUid]);

  // Intervalo cada segundo para decrementar la cuenta regresiva de desconexión
  useEffect(() => {
    if (!disconnectCountdown) return;

    const timer = setInterval(() => {
      setDisconnectCountdown((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          clearInterval(timer);
          // Ejecutar descalificación si somos el anfitrión o primer jugador activo restante
          const activePlayers = gameState.players.filter((p) => p.uid !== prev.uid);
          const isElector = activePlayers[0]?.uid === currentUserUid;
          if (isElector) {
            disqualifyPlayer(prev.uid);
          }
          return null;
        }
        return {
          ...prev,
          secondsLeft: prev.secondsLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disconnectCountdown, gameState.players, currentUserUid, disqualifyPlayer]);

  const toggleAudio = () => {
    const nextState = soundEffects.toggleSound();
    setSoundEnabled(nextState);
    if (nextState) {
      soundEffects.playCard();
      triggerHaptic('light');
    }
  };

  // Al seleccionar jugar una carta normal
  const handlePlayNormalCard = async (cardId: string) => {
    myLastPlayedCardIdRef.current = cardId;
    try {
      await playCard(cardId);
    } catch (err: unknown) {
      myLastPlayedCardIdRef.current = null;
      const msg = err instanceof Error ? err.message : 'Error al jugar carta';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  // Al seleccionar una carta comodín (abre el selector de color)
  const handlePlayWildCard = (card: CardType) => {
    setPendingWildCard(card);
  };

  // Al elegir el color para el comodín
  const handleSelectColor = async (color: CardColor) => {
    if (!pendingWildCard) return;
    const cardId = pendingWildCard.id;
    myLastPlayedCardIdRef.current = cardId;
    setPendingWildCard(null);
    soundEffects.playCard();
    triggerHaptic('medium');
    try {
      await playCard(cardId, color);
    } catch (err: unknown) {
      myLastPlayedCardIdRef.current = null;
      const msg = err instanceof Error ? err.message : 'Error al jugar comodín';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  // Al robar carta
  const handleDrawCard = async () => {
    if (gameState.accumulatedDrawCount > 0) {
      setPenaltyCount(gameState.accumulatedDrawCount);
    }
    soundEffects.drawCard();
    triggerHaptic('medium');
    try {
      await drawCard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al robar carta';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  // Al cantar UNO
  const handleCallUno = async () => {
    soundEffects.unoCall();
    triggerHaptic('uno');
    try {
      await callUno();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cantar UNO';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  // Al atrapar a un rival
  const handleCatchUno = async (targetUid: string) => {
    soundEffects.playCard();
    triggerHaptic('heavy');
    try {
      await catchUno(targetUid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al atrapar rival';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  // Si el juego cayó en estado 'pendingColor' y soy yo quien debe elegir
  const isPendingMyColorChoice =
    gameState.status === 'pendingColor' &&
    gameState.pendingColorPlayerId === currentUserUid;

  const handlePendingColorSelection = async (color: CardColor) => {
    soundEffects.playCard();
    triggerHaptic('medium');
    try {
      await chooseColor(color);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al elegir color';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  const handleExit = async () => {
    setShowExitModal(false);
    await exitRoom();
    onExitRoom();
  };

  // Encontrar ganador si la partida terminó
  const winnerPlayer = gameState.winnerUid
    ? gameState.players.find((p) => p.uid === gameState.winnerUid)
    : null;

  return (
    <div className="relative mobile-game-viewport uno-board-bg text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Animación inicial de barajeo y reparto de 7 cartas */}
      {showStartAnimation && !isSpectator && (
        <StartGameAnimation onComplete={handleAnimationComplete} />
      )}

      {/* Animación de penalización de robo (+2, +4) */}
      {penaltyCount !== null && (
        <DrawPenaltyAnimation
          count={penaltyCount}
          onComplete={handlePenaltyComplete}
        />
      )}

      {/* Ventanas emergentes de acciones clave (Cambio de color, Reversa, Bloqueo, UNO) */}
      <ActionAnnouncementModal
        announcement={announcement}
        onComplete={handleAnnouncementComplete}
      />

      {/* Animación física de carta lanzada por un rival o para espectadores */}
      <AnimatePresence>
        {opponentFlyingCard && (
          <motion.div
            key={`opp-fly-${opponentFlyingCard.card.id}`}
            initial={{
              position: 'fixed',
              left: opponentFlyingCard.startX,
              top: opponentFlyingCard.startY,
              scale: 0.65,
              rotate: Math.random() * 20 - 10,
              opacity: 1,
              zIndex: 70,
            }}
            animate={{
              left: opponentFlyingCard.targetX,
              top: opponentFlyingCard.targetY,
              scale: [0.65, 0.95, 1],
              rotate: 0,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.44, ease: 'easeOut' }}
            onAnimationComplete={() => setOpponentFlyingCard(null)}
            className="pointer-events-none drop-shadow-2xl"
            style={{ width: 72, height: 106 }}
          >
            <Card card={opponentFlyingCard.card} size="xs" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Notorio para Atrapar al Rival que no dijo UNO */}
      <AnimatePresence>
        {vulnerableOpponent && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            onClick={() => handleCatchUno(vulnerableOpponent.uid)}
            className="fixed top-14 sm:top-16 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 border-2 border-yellow-300 text-white text-xs sm:text-sm font-black text-center shadow-2xl shadow-red-600/90 backdrop-blur-md cursor-pointer flex items-center justify-center gap-2.5 animate-bounce select-none ring-4 ring-yellow-400/40"
            title={`¡Toca para atrapar a ${vulnerableOpponent.name} y forzarlo a robar 2 cartas!`}
          >
            <span className="text-lg animate-pulse">🚨</span>
            <span className="tracking-wide">
              ¡{vulnerableOpponent.name.toUpperCase()} NO DIJO UNO! TOCA AQUÍ (+2)
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-black/40 text-yellow-300 text-[10px] uppercase font-black border border-yellow-300/60">
              Atrapar
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast flotante de avisos o errores */}
      <AnimatePresence>
        {gameToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
            className="fixed top-14 sm:top-16 inset-x-4 max-w-md mx-auto z-50 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-950/95 via-rose-950/90 to-slate-950/95 border border-rose-500/80 text-rose-100 text-xs sm:text-sm font-bold text-center shadow-2xl shadow-rose-950/80 backdrop-blur-xl flex items-center justify-center gap-2.5 ring-1 ring-rose-400/30"
          >
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-300 flex-shrink-0 animate-pulse">
              ⚠️
            </div>
            <span className="flex-1 text-left">{gameToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner de cuenta regresiva por desconexión */}
      <AnimatePresence>
        {disconnectCountdown && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-14 sm:top-16 inset-x-3 max-w-lg mx-auto z-50 p-3 rounded-2xl bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-red-500 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ring-2 ring-red-500/40"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl animate-pulse">⏱️</span>
              <div className="truncate text-left">
                <div>
                  <span className="text-yellow-300 font-extrabold">{disconnectCountdown.name}</span> se ha desconectado
                </div>
                <span className="block text-[11px] text-red-200/90 font-normal">
                  {gameState.players.length === 2
                    ? 'Si no regresa antes del tiempo, ganarás automáticamente.'
                    : 'Si no regresa antes del tiempo, quedará descalificado.'}
                </span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono font-black text-sm border-2 border-yellow-300 shadow-md animate-pulse flex-shrink-0">
              {disconnectCountdown.secondsLeft}s
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra superior de la mesa */}
      <header className="w-full flex items-center justify-between px-2.5 sm:px-4 lg:px-6 pt-[max(0.6rem,env(safe-area-inset-top))] pb-1.5 sm:pb-2 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 flex-shrink-0 pr-14 sm:pr-16">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-100 hover:text-white text-xs font-bold cursor-pointer transition touch-manipulation active:scale-95 shadow-sm"
            title="Salir de la partida"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Salir</span>
          </button>

          {/* Botón de Sonido Mute/Unmute */}
          <button
            onClick={toggleAudio}
            className="p-1.5 sm:p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-slate-200 hover:text-white text-xs cursor-pointer transition"
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Indicador de Turno o Modo Espectador */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isSpectator ? (
            <div className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-purple-600/90 text-white font-bold text-[11px] sm:text-xs tracking-wider uppercase border border-purple-300 shadow-lg flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Espectador</span>
            </div>
          ) : isMyTurn ? (
            <div className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-amber-400/50 animate-pulse border-2 border-yellow-100 flex items-center gap-1.5 ring-2 ring-amber-400/40">
              <span>⭐</span>
              <span>¡Tu Turno!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-black/60 border border-white/20 text-slate-200 font-semibold text-xs sm:text-sm backdrop-blur-md shadow-md">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span className="truncate max-w-[120px] sm:max-w-none">
                Turno: <strong className="text-white font-bold">{currentTurnPlayer?.name || '...'}</strong>
              </span>
            </div>
          )}

          {/* Botón de saltar si el jugador en turno está ausente */}
          {!isMyTurn && !isSpectator && currentTurnPlayer && (
            <button
              onClick={() => skipInactivePlayer(currentTurnPlayer.uid)}
              className="text-[10px] sm:text-xs text-amber-200/80 hover:text-white underline ml-0.5 cursor-pointer"
              title="Saltar si se ausentó más de 60 segundos"
            >
              ¿Ausente?
            </button>
          )}
        </div>

        {/* Info Sala */}
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-200/90">
          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Sala: {roomId}</span>
        </div>
      </header>

      {/* Barra de Rivales (Semicírculo superior en Portrait / Estadio en Landscape) */}
      <div className="w-full z-10 pt-0.5 flex-shrink-0">
        <OpponentsBar
          opponents={opponents}
          currentTurnIndex={gameState.currentTurnIndex}
          allPlayers={gameState.players}
          presence={presence}
          unoVulnerableUids={gameState.unoVulnerableUids}
          disconnectCountdown={disconnectCountdown}
          onCatchUno={handleCatchUno}
        />
      </div>

      {/* Centro de la Mesa (Mazo, Descarte, Acumulación) */}
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 py-0.5">
        <TableCenter
          topDiscardCard={topDiscardCard}
          activeColor={gameState.activeColor}
          accumulatedDrawCount={gameState.accumulatedDrawCount}
          deckCount={gameState.deck.length}
          direction={gameState.direction}
          isMyTurn={isMyTurn && !isSpectator}
          lastAction={gameState.lastAction}
          isDraggingCard={isDraggingCard}
          showUnoButton={
            !isSpectator &&
            !!myPlayer &&
            myPlayer.hand.length === 1 &&
            !myPlayer.hasCalledUno
          }
          onCallUno={handleCallUno}
          onDrawCard={handleDrawCard}
          onZoomCard={(card) => setZoomedCard(card)}
          helpMode={gameState.helpMode}
        />
      </div>

      {/* Placa de jugador local en modo horizontal y PC */}
      <div className="hidden landscape:flex absolute bottom-2.5 sm:bottom-3 lg:bottom-5 left-3 sm:left-4 lg:left-8 xl:left-12 z-30 items-center gap-2.5 sm:gap-3 pointer-events-none">
        <div className="relative">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-15 xl:h-15 rounded-2xl sm:rounded-full bg-slate-900 border-2 border-amber-400 p-0.5 flex items-center justify-center shadow-xl ring-2 ring-amber-400/30 overflow-hidden">
            <AvatarDisplay avatar={myPlayer?.avatar} className="w-full h-full rounded-2xl sm:rounded-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 lg:px-2 lg:py-0.5 rounded-full bg-emerald-600 border border-emerald-300 text-white font-black text-[9px] sm:text-[10px] lg:text-xs shadow">
            {myPlayer?.hand.length || 0}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] sm:text-xs lg:text-sm font-black text-slate-100 drop-shadow">
            {myPlayer?.name || 'Tú'}
          </span>
          {isMyTurn && (
            <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black text-amber-300 uppercase tracking-tight animate-pulse flex items-center gap-1">
              <span>⭐</span>
              <span>¡Tu Turno!</span>
            </span>
          )}
        </div>
      </div>

      {/* Abanico de Cartas del Jugador (Inferior) */}
      <div className="w-full z-20 flex-shrink-0">
        <PlayerHand
          hand={myPlayer?.hand || []}
          topDiscardCard={topDiscardCard}
          activeColor={gameState.activeColor}
          accumulatedDrawCount={gameState.accumulatedDrawCount}
          isMyTurn={isMyTurn && !isSpectator}
          drawnCardThisTurn={gameState.drawnCardThisTurn}
          hasCalledUno={myPlayer?.hasCalledUno || false}
          canPass={Boolean(gameState.drawnCardThisTurn)}
          isSpectator={isSpectator}
          showCards={!showStartAnimation}
          helpMode={gameState.helpMode}
          onDragStateChange={(dragging) => setIsDraggingCard(dragging)}
          onPlayCard={handlePlayNormalCard}
          onPlayWild={handlePlayWildCard}
          onCallUno={handleCallUno}
          onPassTurn={passTurn}
          onZoomCard={(card) => setZoomedCard(card)}
        />
      </div>

      {/* Modal de Selector de Color (Wildcards) con vista previa de mis cartas */}
      <ColorPickerModal
        isOpen={Boolean(pendingWildCard) || isPendingMyColorChoice}
        onSelectColor={isPendingMyColorChoice ? handlePendingColorSelection : handleSelectColor}
        hand={myPlayer?.hand}
        pendingCardId={pendingWildCard?.id}
      />

      {/* Modal de Inspección / Explicación Paso a Paso con KaTeX */}
      <CardZoomModal
        card={zoomedCard}
        onClose={() => setZoomedCard(null)}
      />

      {/* Modal de Fin de Partida / Victoria */}
      <VictoryModal
        isOpen={gameState.status === 'finished' && Boolean(winnerPlayer)}
        winnerName={winnerPlayer?.name || 'Jugador'}
        winnerAvatar={winnerPlayer?.avatar || '🏆'}
        isCurrentUserWinner={gameState.winnerUid === currentUserUid}
        isHost={isHost}
        players={gameState.players}
        winnerUid={gameState.winnerUid}
        currentUserUid={currentUserUid}
        subtitle={
          gameState.lastAction?.includes('ha abandonado')
            ? `¡Victoria automática! El rival ha abandonado la partida.`
            : undefined
        }
        onRequestRematch={requestRematch}
        onExit={handleExit}
        onOpenShop={() => setShowShop(true)}
      />

      {/* Modal de Tienda de Monedas y Recompensas */}
      <ShopModal
        isOpen={showShop}
        onClose={() => setShowShop(false)}
      />

      {/* Modal de Confirmación para Salir (Previene bloqueos y gestos accidentales en móviles) */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900/95 border-2 border-slate-700/80 p-5 sm:p-6 text-center shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
            >
              <div className="w-13 h-13 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">¿Salir de la Partida?</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2">
                {gameState.status === 'playing'
                  ? 'Si sales de una partida activa, abandonarás la sala y no podrás continuar esta ronda.'
                  : '¿Estás seguro de que deseas abandonar la sala de juego?'}
              </p>
              <div className="flex items-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs sm:text-sm font-bold cursor-pointer transition active:scale-95"
                >
                  Continuar Jugando
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-600/40 cursor-pointer transition active:scale-95"
                >
                  Sí, Salir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
