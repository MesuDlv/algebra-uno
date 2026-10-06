import React, { useState, useEffect, useRef } from 'react';
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
import { Card as CardType, CardColor } from '../types/card';
import { soundEffects } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { LogOut, BookOpen, Clock, Volume2, VolumeX, Eye } from 'lucide-react';

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
    requestRematch,
    exitRoom,
  } = useGameRoom(roomId, currentUserUid);

  const [pendingWildCard, setPendingWildCard] = useState<CardType | null>(null);
  const [zoomedCard, setZoomedCard] = useState<CardType | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundEffects.isSoundEnabled());
  const [showStartAnimation, setShowStartAnimation] = useState<boolean>(true);
  const [penaltyCount, setPenaltyCount] = useState<number | null>(null);
  const [gameToast, setGameToast] = useState<string | null>(null);

  const prevIsMyTurnRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string>(gameState.status);
  const prevDrawCountRef = useRef<number>(gameState.accumulatedDrawCount);

  // Determinar si el usuario actual es espectador
  const isSpectator = Boolean(
    room?.members.find((m) => m.uid === currentUserUid)?.isSpectator ||
    (gameState.players.length > 0 && !gameState.players.some((p) => p.uid === currentUserUid))
  );

  const myPlayer = gameState.players.find((p) => p.uid === currentUserUid);
  const opponents = gameState.players.filter((p) => p.uid !== currentUserUid);
  const topDiscardCard =
    gameState.discardPile.length > 0
      ? gameState.discardPile[gameState.discardPile.length - 1]
      : null;

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

  // Efecto para detectar penalización de robo en rival o en mí
  useEffect(() => {
    if (prevDrawCountRef.current > 0 && gameState.accumulatedDrawCount === 0) {
      if (gameState.lastAction?.includes(myPlayer?.name || '---') && gameState.lastAction?.includes('robó')) {
        setPenaltyCount(prevDrawCountRef.current);
      }
    }
    prevDrawCountRef.current = gameState.accumulatedDrawCount;
  }, [gameState.accumulatedDrawCount, gameState.lastAction, myPlayer?.name]);

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
    soundEffects.playCard();
    triggerHaptic('medium');
    try {
      await playCard(cardId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al jugar carta';
      setGameToast(msg);
      setTimeout(() => setGameToast(null), 3500);
    }
  };

  // Al seleccionar una carta comodín (abre el selector de color)
  const handlePlayWildCard = (card: CardType) => {
    soundEffects.playCard();
    triggerHaptic('light');
    setPendingWildCard(card);
  };

  // Al elegir el color para el comodín
  const handleSelectColor = async (color: CardColor) => {
    if (!pendingWildCard) return;
    const cardId = pendingWildCard.id;
    setPendingWildCard(null);
    soundEffects.playCard();
    triggerHaptic('medium');
    try {
      await playCard(cardId, color);
    } catch (err: unknown) {
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
    await exitRoom();
    onExitRoom();
  };

  // Encontrar ganador si la partida terminó
  const winnerPlayer = gameState.winnerUid
    ? gameState.players.find((p) => p.uid === gameState.winnerUid)
    : null;

  return (
    <div className="relative min-h-screen max-h-screen uno-board-bg text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Animación inicial de barajeo y reparto de 7 cartas */}
      {showStartAnimation && (
        <StartGameAnimation onComplete={() => setShowStartAnimation(false)} />
      )}

      {/* Animación de penalización de robo (+2, +4) */}
      {penaltyCount !== null && (
        <DrawPenaltyAnimation
          count={penaltyCount}
          onComplete={() => setPenaltyCount(null)}
        />
      )}

      {/* Toast flotante de avisos o errores */}
      <AnimatePresence>
        {gameToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-14 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-rose-950/95 border border-rose-500/80 text-rose-200 text-xs font-bold text-center shadow-2xl backdrop-blur-md"
          >
            ⚠️ {gameToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra superior de la mesa */}
      <header className="w-full flex items-center justify-between px-3 py-2 z-20 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>

          {/* Botón de Sonido Mute/Unmute */}
          <button
            onClick={toggleAudio}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-slate-200 hover:text-white text-xs cursor-pointer transition"
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Indicador de Turno o Modo Espectador */}
        <div className="flex items-center gap-2">
          {isSpectator ? (
            <div className="px-3 py-1 rounded-full bg-purple-600/90 text-white font-bold text-xs tracking-wider uppercase border border-purple-300 shadow-lg flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Modo Espectador</span>
            </div>
          ) : isMyTurn ? (
            <div className="px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-400/40 animate-pulse border-2 border-yellow-200">
              ¡Tu Turno!
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/15 text-slate-200 font-semibold text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Turno de {currentTurnPlayer?.name || '...'}</span>
            </div>
          )}

          {/* Botón de saltar si el jugador en turno está ausente */}
          {!isMyTurn && !isSpectator && currentTurnPlayer && (
            <button
              onClick={() => skipInactivePlayer(currentTurnPlayer.uid)}
              className="text-[10px] text-amber-200/80 hover:text-white underline ml-1 cursor-pointer"
              title="Saltar si se ausentó más de 60 segundos"
            >
              ¿Ausente?
            </button>
          )}
        </div>

        {/* Info Sala */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-200/90">
          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Sala: {roomId}</span>
        </div>
      </header>

      {/* Barra de Rivales (Semicírculo superior) */}
      <div className="w-full z-10 pt-1">
        <OpponentsBar
          opponents={opponents}
          currentTurnIndex={gameState.currentTurnIndex}
          allPlayers={gameState.players}
          presence={presence}
          unoVulnerableUids={gameState.unoVulnerableUids}
          onCatchUno={handleCatchUno}
        />
      </div>

      {/* Centro de la Mesa (Mazo, Descarte, Acumulación) */}
      <TableCenter
        topDiscardCard={topDiscardCard}
        activeColor={gameState.activeColor}
        accumulatedDrawCount={gameState.accumulatedDrawCount}
        deckCount={gameState.deck.length}
        direction={gameState.direction}
        isMyTurn={isMyTurn && !isSpectator}
        lastAction={gameState.lastAction}
        onDrawCard={handleDrawCard}
        onZoomCard={(card) => setZoomedCard(card)}
      />

      {/* Abanico de Cartas del Jugador (Inferior) */}
      <div className="w-full z-10">
        <PlayerHand
          hand={myPlayer?.hand || []}
          topDiscardCard={topDiscardCard}
          activeColor={gameState.activeColor}
          accumulatedDrawCount={gameState.accumulatedDrawCount}
          isMyTurn={isMyTurn && !isSpectator}
          hasCalledUno={myPlayer?.hasCalledUno || false}
          canPass={Boolean(gameState.drawnCardThisTurn)}
          isSpectator={isSpectator}
          onPlayCard={handlePlayNormalCard}
          onPlayWild={handlePlayWildCard}
          onCallUno={handleCallUno}
          onPassTurn={passTurn}
          onZoomCard={(card) => setZoomedCard(card)}
        />
      </div>

      {/* Modal de Selector de Color (Wildcards) */}
      <ColorPickerModal
        isOpen={Boolean(pendingWildCard) || isPendingMyColorChoice}
        onSelectColor={isPendingMyColorChoice ? handlePendingColorSelection : handleSelectColor}
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
        subtitle={
          gameState.lastAction?.includes('ha abandonado')
            ? `¡Victoria automática! El rival ha abandonado la partida.`
            : undefined
        }
        onRequestRematch={requestRematch}
        onExit={handleExit}
      />
    </div>
  );
};
