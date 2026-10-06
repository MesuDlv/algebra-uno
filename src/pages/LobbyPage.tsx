import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  getPlayerProfile,
  savePlayerProfile,
  AVAILABLE_AVATARS,
  PlayerProfile,
} from '../firebase/auth';
import { createRoom, joinRoom } from '../firebase/roomService';
import { Sparkles, Users, BookOpen, ArrowRight, PlusCircle, Check } from 'lucide-react';

interface LobbyPageProps {
  onJoinRoom: (roomId: string) => void;
  onOpenGallery: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinRoom, onOpenGallery }) => {
  const [profile, setProfile] = useState<PlayerProfile>(getPlayerProfile());
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [helpMode, setHelpMode] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Leer si vino con ?room=XXXXX en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(roomParam.toUpperCase());
    }
  }, []);

  const handleNameChange = (name: string) => {
    const updated = savePlayerProfile(name, profile.avatar);
    setProfile(updated);
  };

  const handleAvatarSelect = (avatar: string) => {
    const updated = savePlayerProfile(profile.name, avatar);
    setProfile(updated);
  };

  const handleCreateRoom = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      const roomId = await createRoom(profile, helpMode, maxPlayers);
      onJoinRoom(roomId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la sala';
      setErrorMsg(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length !== 5) {
      setErrorMsg('El código de sala debe tener exactamente 5 caracteres.');
      return;
    }

    setErrorMsg(null);
    setIsJoining(true);
    try {
      await joinRoom(cleanCode, profile);
      onJoinRoom(cleanCode);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo unir a la sala';
      setErrorMsg(message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Encabezado Logo */}
      <div className="w-full max-w-md flex flex-col items-center text-center mt-2 mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Juego de Cartas Multijugador Online
        </motion.div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>ALGEBRA</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400">
            UNO
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Donde las ecuaciones son números y el ingenio te da la victoria
        </p>
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-md space-y-4">
        {/* Mensaje de Error si lo hay */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center font-medium shadow-lg"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Perfil del Jugador */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tu Perfil de Jugador
          </label>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
              {profile.avatar}
            </div>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tu nombre o apodo"
              maxLength={15}
              className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Selección rápida de avatar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-1">
            {AVAILABLE_AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => handleAvatarSelect(av)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                  profile.avatar === av
                    ? 'bg-amber-400/20 border-2 border-amber-400 scale-110'
                    : 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta: Crear Sala */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900/80 border border-indigo-500/20 shadow-xl backdrop-blur-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            Crear Nueva Sala
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Jugadores máximos */}
            <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Jugadores
              </span>
              <div className="flex gap-1">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                      maxPlayers === num
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Modo Ayuda */}
            <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span className="block text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Modo Ayuda
              </span>
              <button
                type="button"
                onClick={() => setHelpMode(!helpMode)}
                className={`w-full py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                  helpMode
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {helpMode ? <Check className="w-3 h-3" /> : null}
                {helpMode ? 'Activado' : 'Desactivado'}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCreating ? 'Creando sala...' : 'Crear Sala y Esperar Amigos'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Tarjeta: Unirse a Sala */}
        <form
          onSubmit={handleJoinSubmit}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md"
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-amber-400" />
            Unirse a una Sala
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO (5 LETRAS)"
              maxLength={5}
              className="flex-1 bg-slate-950/70 border border-slate-700 rounded-2xl px-4 py-3 text-center text-lg font-black tracking-widest text-amber-300 placeholder:text-slate-600 placeholder:text-xs placeholder:tracking-normal focus:outline-none focus:border-amber-400 font-mono transition"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isJoining || joinCode.length < 5}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 disabled:opacity-40 cursor-pointer"
            >
              {isJoining ? '...' : 'Entrar'}
            </motion.button>
          </div>
        </form>

        {/* Botón Galería de Cartas */}
        <button
          type="button"
          onClick={onOpenGallery}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Explorar Galería de las 108 Cartas Algebraicas
        </button>
      </div>

      {/* Pie de página */}
      <div className="w-full text-center text-[11px] text-slate-600 mt-6">
        ALGEBRA UNO • Multijugador Serverless en Tiempo Real
      </div>
    </div>
  );
};
