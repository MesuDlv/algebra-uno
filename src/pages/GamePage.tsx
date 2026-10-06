import React, { useState } from 'react';
import { useGameRoom } from '../hooks/useGameRoom';
import { OpponentsBar } from '../components/game/OpponentsBar';
import { TableCenter } from '../components/game/TableCenter';
import { PlayerHand } from '../components/game/PlayerHand';
import { ColorPickerModal } from '../components/game/ColorPickerModal';
import { VictoryModal } from '../components/game/VictoryModal';
import { CardZoomModal } from '../components/card/CardZoomModal';
import { Card as CardType, CardColor } from '../types/card';
import { LogOut, BookOpen, Clock } from 'lucide-react';

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

  const myPlayer = gameState.players.find((p) => p.uid === currentUserUid);
  const opponents = gameState.players.filter((p) => p.uid !== currentUserUid);
  const topDiscardCard =
    gameState.discardPile.length > 0
      ? gameState.discardPile[gameState.discardPile.length - 1]
      : null;

  const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];

  // Al seleccionar jugar una carta normal
  const handlePlayNormalCard = async (cardId: string) => {
    try {
      await playCard(cardId);
    } catch (err) {
      console.error('Error al jugar carta:', err);
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
    setPendingWildCard(null);
    try {
      await playCard(cardId, color);
    } catch (err) {
      console.error('Error al jugar comodín:', err);
    }
  };

  // Si el juego cayó en estado 'pendingColor' y soy yo quien debe elegir
  const isPendingMyColorChoice =
    gameState.status === 'pendingColor' &&
    gameState.pendingColorPlayerId === currentUserUid;

  const handlePendingColorSelection = async (color: CardColor) => {
    try {
      await chooseColor(color);
    } catch (err) {
      console.error('Error al elegir color:', err);
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
    <div className="relative min-h-screen max-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Barra superior de la mesa */}
      <header className="w-full flex items-center justify-between px-3 py-2 z-20 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80">
        <button
          onClick={handleExit}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>

        {/* Indicador de Turno */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <div className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-400/30 animate-pulse">
              ¡Tu Turno!
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-semibold text-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>Turno de {currentTurnPlayer?.name || '...'}</span>
            </div>
          )}

          {/* Botón de saltar si el jugador en turno está ausente */}
          {!isMyTurn && currentTurnPlayer && (
            <button
              onClick={() => skipInactivePlayer(currentTurnPlayer.uid)}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1"
              title="Saltar si se ausentó más de 60 segundos"
            >
              ¿Ausente?
            </button>
          )}
        </div>

        {/* Modo Ayuda badge */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
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
          onCatchUno={catchUno}
        />
      </div>

      {/* Centro de la Mesa (Mazo, Descarte, Acumulación) */}
      <TableCenter
        topDiscardCard={topDiscardCard}
        activeColor={gameState.activeColor}
        accumulatedDrawCount={gameState.accumulatedDrawCount}
        deckCount={gameState.deck.length}
        direction={gameState.direction}
        isMyTurn={isMyTurn}
        lastAction={gameState.lastAction}
        onDrawCard={drawCard}
        onZoomCard={(card) => setZoomedCard(card)}
      />

      {/* Abanico de Cartas del Jugador (Inferior) */}
      <div className="w-full z-10">
        <PlayerHand
          hand={myPlayer?.hand || []}
          topDiscardCard={topDiscardCard}
          activeColor={gameState.activeColor}
          accumulatedDrawCount={gameState.accumulatedDrawCount}
          isMyTurn={isMyTurn}
          hasCalledUno={myPlayer?.hasCalledUno || false}
          canPass={Boolean(gameState.drawnCardThisTurn)}
          onPlayCard={handlePlayNormalCard}
          onPlayWild={handlePlayWildCard}
          onCallUno={callUno}
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
        onRequestRematch={requestRematch}
        onExit={handleExit}
      />
    </div>
  );
};
