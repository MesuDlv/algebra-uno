import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RoomData, PresenceInfo } from '../types/room';
import { Copy, Check, Play, LogOut, Crown, Users, BookOpen, Share2 } from 'lucide-react';

interface WaitingRoomPageProps {
  room: RoomData;
  currentUserUid: string | null;
  presence: PresenceInfo[];
  isHost: boolean;
  onStartGame: () => void;
  onExit: () => void;
}

export const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({
  room,
  currentUserUid,
  presence,
  isHost,
  onStartGame,
  onExit,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${room.id}`;

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

  const canStart = room.members.length >= 2;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6">
      {/* Encabezado */}
      <div className="w-full max-w-md flex items-center justify-between mt-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Sala de Espera
        </div>

        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Contenedor Central */}
      <div className="w-full max-w-md space-y-5 my-auto py-4">
        {/* Tarjeta de Código de Sala */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/70 to-slate-900/90 border border-indigo-500/30 shadow-2xl text-center relative overflow-hidden backdrop-blur-md">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
            Código de la Partida
          </span>

          <div className="my-2 text-4xl sm:text-5xl font-black tracking-widest text-amber-300 font-mono drop-shadow-md select-all">
            {room.id}
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
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

        {/* Parámetros de la partida */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            {room.members.length} / {room.maxPlayers} Jugadores
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Modo Ayuda {room.helpMode ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Lista de Jugadores Conectados */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Jugadores en la mesa
          </div>

          <div className="space-y-2">
            {room.members.map((member) => {
              const isMe = member.uid === currentUserUid;
              const presenceInfo = presence.find((p) => p.uid === member.uid);
              const isOnline = presenceInfo ? presenceInfo.isOnline : true;

              return (
                <motion.div
                  key={member.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                    isMe
                      ? 'bg-indigo-950/40 border-indigo-500/40'
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

            {/* Ranuras vacías */}
            {Array.from({ length: room.maxPlayers - room.members.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-3.5 rounded-2xl border-2 border-dashed border-slate-800/80 flex items-center justify-center text-xs font-medium text-slate-600"
              >
                Esperando jugador ({room.members.length + idx + 1}/{room.maxPlayers})...
              </div>
            ))}
          </div>
        </div>

        {/* Botón de Iniciar o Mensaje de Espera */}
        <div className="pt-2">
          {isHost ? (
            <div>
              <motion.button
                whileHover={canStart ? { scale: 1.02 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
                onClick={onStartGame}
                disabled={!canStart}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  canStart
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Partida
              </motion.button>
              {!canStart && (
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Comparte el código o enlace para que se una al menos 1 amigo más.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 animate-pulse">
                <span>Esperando a que el anfitrión inicie la partida...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pie de página */}
      <div className="w-full text-center text-[11px] text-slate-600 mt-2">
        ALGEBRA UNO • Sincronización en Tiempo Real
      </div>
    </div>
  );
};
