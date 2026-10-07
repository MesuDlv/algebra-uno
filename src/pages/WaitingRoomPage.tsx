import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomData, PresenceInfo } from '../types/room';
import { toggleSpectatorStatus, updateMemberProfileInRoom } from '../firebase/roomService';
import { savePlayerProfile, AVAILABLE_AVATARS, getPlayerProfile } from '../firebase/auth';
import { useGameRoom } from '../hooks/useGameRoom';
import {
  Copy,
  Check,
  Play,
  LogOut,
  Crown,
  Users,
  BookOpen,
  Share2,
  Eye,
  UserCheck,
  Edit2,
  Sparkles,
} from 'lucide-react';

interface WaitingRoomPageProps {
  room: RoomData;
  currentUserUid: string | null;
  presence?: PresenceInfo[];
  isHost?: boolean;
  onStartGame?: () => void;
  onExit: () => void;
}

export const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({
  room,
  currentUserUid,
  presence: propPresence,
  isHost: propIsHost,
  onStartGame: propOnStartGame,
  onExit,
}) => {
  const { startGame, presence: hookPresence, isHost: hookIsHost } = useGameRoom(room.id, currentUserUid);
  const presence = propPresence || hookPresence;
  const isHost = propIsHost !== undefined ? propIsHost : hookIsHost;
  const handleStartGameAction = propOnStartGame || startGame;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTogglingRole, setIsTogglingRole] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nameInput, setNameInput] = useState(() => getPlayerProfile().name);
  const [avatarInput, setAvatarInput] = useState(() => getPlayerProfile().avatar);
  const [actionError, setActionError] = useState<string | null>(null);

  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${room.id}`;

  const activeMembers = room.members.filter((m) => !m.isSpectator);
  const spectatorMembers = room.members.filter((m) => m.isSpectator);
  const myMember = room.members.find((m) => m.uid === currentUserUid);
  const canStart = activeMembers.length >= 2;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggleSpectator = async () => {
    if (!currentUserUid || isTogglingRole) return;
    setActionError(null);
    setIsTogglingRole(true);
    try {
      await toggleSpectatorStatus(room.id, currentUserUid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar rol';
      setActionError(msg);
      setTimeout(() => setActionError(null), 3500);
    } finally {
      setIsTogglingRole(false);
    }
  };

  const handleSaveProfile = async () => {
    const finalName = nameInput.trim() || 'Jugador';
    const updated = savePlayerProfile(finalName, avatarInput);
    if (currentUserUid) {
      try {
        await updateMemberProfileInRoom(room.id, currentUserUid, updated.name, updated.avatar);
      } catch (err) {
        console.warn('Error al sincronizar perfil en sala:', err);
      }
    }
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen uno-board-bg text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto">
      {/* Encabezado */}
      <div className="w-full max-w-md flex items-center justify-between mt-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>

        <div className="text-xs font-bold text-amber-200 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Sala de Espera</span>
        </div>

        {/* Botón editar mi perfil */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-amber-300 hover:text-white text-xs font-semibold cursor-pointer transition"
          title="Editar mi nombre o avatar"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mi Perfil</span>
        </button>
      </div>

      {/* Contenedor Central */}
      <div className="w-full max-w-md space-y-4 my-auto py-4">
        {/* Aviso de error si hubo */}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs text-center font-bold shadow-lg"
          >
            ⚠️ {actionError}
          </motion.div>
        )}

        {/* Tarjeta de Código de Sala */}
        <div className="p-5 rounded-3xl bg-black/40 border border-white/20 shadow-2xl text-center relative overflow-hidden backdrop-blur-md">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
            Código de la Partida
          </span>

          <div className="my-2 text-4xl sm:text-5xl font-black tracking-widest text-amber-300 font-mono drop-shadow-md select-all">
            {room.id}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyCode}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? '¡Copiado!' : 'Copiar Código'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-xs font-bold text-white border border-indigo-400/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
            </motion.button>
          </div>
        </div>

        {/* Mi Estado Actual y Botón para cambiar a Espectador / Jugador */}
        {myMember && (
          <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{myMember.avatar}</span>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{myMember.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                    Tú
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {myMember.isSpectator ? 'Rol: Espectador 👁️' : 'Rol: Jugador en la mesa 🎮'}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleToggleSpectator}
              disabled={isTogglingRole}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                myMember.isSpectator
                  ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-md'
                  : 'bg-purple-600/90 hover:bg-purple-500 text-white border border-purple-400/50 shadow-md'
              }`}
            >
              {myMember.isSpectator ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Jugar en la Mesa</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ser Espectador</span>
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Parámetros de la partida */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            {activeMembers.length} / {room.maxPlayers} Jugadores
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Modo Ayuda {room.helpMode ? 'Activo' : 'Inactivo'}
          </span>
          {spectatorMembers.length > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-300 font-bold">
                <Eye className="w-3.5 h-3.5" />
                {spectatorMembers.length} {spectatorMembers.length === 1 ? 'Espectador' : 'Espectadores'}
              </span>
            </>
          )}
        </div>

        {/* Lista de Jugadores Activos en la mesa */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Jugadores en la mesa ({activeMembers.length}/{room.maxPlayers})</span>
            {activeMembers.length >= room.maxPlayers && (
              <span className="text-[10px] text-amber-400 font-bold">Mesa llena</span>
            )}
          </div>

          <div className="space-y-2">
            {activeMembers.map((member) => {
              const isMe = member.uid === currentUserUid;
              const presenceInfo = presence.find((p) => p.uid === member.uid);
              const isOnline = presenceInfo ? presenceInfo.isOnline : true;

              return (
                <motion.div
                  key={member.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-2xl flex items-center justify-between border ${
                    isMe
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {member.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        {isOnline ? 'En línea' : 'Ausente'}
                      </div>
                    </div>
                  </div>

                  {member.isHost && (
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                      <Crown className="w-3.5 h-3.5" />
                      Anfitrión
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Ranuras vacías en la mesa */}
            {Array.from({ length: Math.max(0, room.maxPlayers - activeMembers.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-3 rounded-2xl border-2 border-dashed border-slate-800/80 flex items-center justify-center text-xs font-medium text-slate-600"
              >
                Esperando jugador ({activeMembers.length + idx + 1}/{room.maxPlayers})...
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Espectadores (si hay) */}
        {spectatorMembers.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300/90 px-1 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Espectadores ({spectatorMembers.length})</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {spectatorMembers.map((spectator) => {
                const isMe = spectator.uid === currentUserUid;
                return (
                  <div
                    key={spectator.uid}
                    className={`p-2 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between text-xs ${
                      isMe ? 'ring-1 ring-purple-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{spectator.avatar}</span>
                      <span className="font-semibold text-slate-200 truncate">
                        {spectator.name} {isMe && '(Tú)'}
                      </span>
                    </div>
                    {spectator.isHost && (
                      <Crown className="w-3 h-3 text-amber-400 flex-shrink-0 ml-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botón de Iniciar o Mensaje de Espera */}
        <div className="pt-2">
          {isHost ? (
            <div>
              <motion.button
                whileHover={canStart ? { scale: 1.02 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
                onClick={handleStartGameAction}
                disabled={!canStart}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  canStart
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Partida {myMember?.isSpectator ? '(Como Espectador)' : ''}
              </motion.button>
              {!canStart ? (
                <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                  Se necesitan al menos 2 jugadores en la mesa para iniciar (actualmente: {activeMembers.length}).
                </p>
              ) : myMember?.isSpectator ? (
                <p className="text-[11px] text-purple-300 text-center mt-2 font-medium">
                  👀 Iniciarás la partida y podrás observar a los jugadores en tiempo real.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 animate-pulse">
                <span>Esperando a que el anfitrión inicie la partida...</span>
              </div>
              {myMember?.isSpectator && (
                <div className="text-[11px] text-purple-300 mt-1">
                  Estás en modo espectador. Disfrutarás la partida como público.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición rápida de perfil en sala */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 shadow-2xl text-slate-100 space-y-4"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Editar Mi Nombre y Avatar
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                  {avatarInput}
                </div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Tu nombre o apodo"
                  maxLength={15}
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Selección de avatar */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-1">
                {AVAILABLE_AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatarInput(av)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      avatarInput === av
                        ? 'bg-amber-400/30 border-2 border-amber-300 scale-110 shadow-lg'
                        : 'bg-black/30 hover:bg-white/10 border border-white/15'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pie de página */}
      <div className="w-full text-center text-[11px] text-slate-600 mt-2">
        ALGEBRA UNO • Sincronización en Tiempo Real
      </div>
    </div>
  );
};
