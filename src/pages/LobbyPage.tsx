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
  const [profile, setProfile] = useState<PlayerProfile>(() => getPlayerProfile());
  const [nameInput, setNameInput] = useState<string>(() => profile.name);
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
    // Permitir borrar todo y escribir libremente sin forzar "Jugador" ni recortar mientras escribe
    setNameInput(name);
  };

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      const updated = savePlayerProfile(trimmed, profile.avatar);
      setProfile(updated);
    }
    // Si trimmed está vacío, NO forzamos ningún texto en el input para que se pueda borrar y escribir libremente.
  };

  const handleAvatarSelect = (avatar: string) => {
    const currentName = nameInput.trim() || profile.name || 'Jugador';
    const updated = savePlayerProfile(currentName, avatar);
    setProfile(updated);
  };

  const handleCreateRoom = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      const finalName = nameInput.trim() || profile.name || 'Jugador';
      const currentProfile = savePlayerProfile(finalName, profile.avatar);
      setProfile(currentProfile);

      const roomId = await createRoom(currentProfile, helpMode, maxPlayers);
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
      const finalName = nameInput.trim() || profile.name || 'Jugador';
      const currentProfile = savePlayerProfile(finalName, profile.avatar);
      setProfile(currentProfile);

      await joinRoom(cleanCode, currentProfile);
      onJoinRoom(cleanCode);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo unir a la sala';
      setErrorMsg(message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen uno-board-bg text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto select-none">
      {/* Encabezado Logo */}
      <div className="w-full max-w-md flex flex-col items-center text-center mt-2 mb-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/20 text-amber-300 text-xs font-semibold mb-3 backdrop-blur-md shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          Juego de Cartas Multijugador Online
        </motion.div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-2 drop-shadow-md">
          <span>ALGEBRA</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-white">
            UNO
          </span>
        </h1>
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-md space-y-4">
        {/* Mensaje de Error si lo hay */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs text-left font-medium shadow-lg space-y-1.5"
          >
            <div className="font-semibold text-rose-100 flex items-center gap-1.5">
              ⚠️ {errorMsg}
            </div>
            {errorMsg.includes('Firestore') && (
              <div className="text-[11px] text-amber-200/90 bg-amber-950/40 p-2 rounded-xl border border-amber-500/30 font-normal leading-relaxed">
                <span className="font-bold text-amber-300">¿Cómo solucionarlo?</span> Abre tu consola de Firebase en{' '}
                <a
                  href="https://console.firebase.google.com/project/algebra-54480/firestore/rules"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-amber-300 font-semibold hover:text-white"
                >
                  Firestore &gt; Reglas
                </a>
                , pega el contenido del archivo <code className="font-mono bg-black/50 px-1 py-0.5 rounded text-amber-300">firestore.rules</code> y pulsa <strong>Publicar</strong>.
              </div>
            )}
          </motion.div>
        )}

        {/* Perfil del Jugador */}
        <div className="p-4 rounded-3xl bg-black/40 border border-white/15 shadow-2xl backdrop-blur-md">
          <label className="block text-xs font-bold text-amber-200/90 uppercase tracking-wider mb-2">
            Tu Perfil de Jugador
          </label>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              {profile.avatar}
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Tu nombre o apodo (Ej: Messi)"
              maxLength={15}
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Selección rápida de avatar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-1">
            {AVAILABLE_AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => handleAvatarSelect(av)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                  profile.avatar === av
                    ? 'bg-amber-400/30 border-2 border-amber-300 scale-110 shadow-lg'
                    : 'bg-black/30 hover:bg-white/10 border border-white/15'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta: Crear Sala */}
        <div className="p-5 rounded-3xl bg-black/40 border border-white/15 shadow-2xl backdrop-blur-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            Crear Nueva Sala
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Jugadores máximos */}
            <div className="p-2.5 rounded-2xl bg-black/30 border border-white/10">
              <span className="block text-[11px] font-semibold text-amber-200/80 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Jugadores
              </span>
              <div className="flex gap-1">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      maxPlayers === num
                        ? 'bg-amber-500 text-slate-950 shadow font-black'
                        : 'bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Modo Ayuda */}
            <div className="p-2.5 rounded-2xl bg-black/30 border border-white/10 flex flex-col justify-between">
              <span className="block text-[11px] font-semibold text-amber-200/80 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Modo Ayuda
              </span>
              <button
                type="button"
                onClick={() => setHelpMode(!helpMode)}
                className={`w-full py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  helpMode
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                    : 'bg-white/10 text-white/60'
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
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCreating ? 'Creando sala...' : 'Crear Sala y Esperar Amigos'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Tarjeta: Unirse a Sala */}
        <form
          onSubmit={handleJoinSubmit}
          className="p-5 rounded-3xl bg-black/40 border border-white/15 shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-amber-300" />
            Unirse a una Sala
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO (5 LETRAS)"
              maxLength={5}
              className="flex-1 bg-black/40 border border-white/20 rounded-2xl px-4 py-3 text-center text-lg font-black tracking-widest text-yellow-300 placeholder:text-white/40 placeholder:text-xs placeholder:tracking-normal focus:outline-none focus:border-amber-400 font-mono transition"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isJoining || joinCode.length < 5}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/30 disabled:opacity-40 cursor-pointer"
            >
              {isJoining ? '...' : 'Entrar'}
            </motion.button>
          </div>
        </form>

        {/* Botón Galería de Cartas */}
        <button
          type="button"
          onClick={onOpenGallery}
          className="w-full py-3 px-4 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/15 text-amber-200/90 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-sm"
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          Explorar Galería de las 108 Cartas Algebraicas
        </button>
      </div>

      {/* Pie de página */}
      <div className="w-full text-center text-[11px] text-amber-200/70 mt-6">
        ALGEBRA UNO • Multijugador Serverless en Tiempo Real
      </div>
    </div>
  );
};
