import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  getPlayerProfile,
  savePlayerProfile,
  AVAILABLE_AVATARS,
  PlayerProfile,
} from '../firebase/auth';
import { createRoom, joinRoom, addBotToRoom } from '../firebase/roomService';
import { Sparkles, Users, BookOpen, ArrowRight, PlusCircle, Check, Eye, Bot, Coins, ShoppingBag } from 'lucide-react';
import { getPlayerEconomy, SHOP_CATALOG, PlayerEconomy } from '../utils/economy';
import { AvatarDisplay } from '../components/common/AvatarDisplay';
import { ShopModal } from '../components/shop/ShopModal';

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
  const [hostAsSpectator, setHostAsSpectator] = useState(false);
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [economy, setEconomy] = useState<PlayerEconomy>(() => getPlayerEconomy());
  const [showShop, setShowShop] = useState(false);

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

      const roomId = await createRoom(currentProfile, helpMode, maxPlayers, hostAsSpectator);
      onJoinRoom(roomId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la sala';
      setErrorMsg(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePracticeWithBot = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      const finalName = nameInput.trim() || profile.name || 'Jugador';
      const currentProfile = savePlayerProfile(finalName, profile.avatar);
      setProfile(currentProfile);

      const roomId = await createRoom(currentProfile, helpMode, 2, false);
      await addBotToRoom(roomId, '🤖 Bot Pitágoras', '🧠');
      onJoinRoom(roomId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la partida de prueba';
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

      await joinRoom(cleanCode, currentProfile, joinAsSpectator);
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

        {/* Barra de Monedas y Botón de Tienda */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-amber-400/30 text-amber-300 font-black text-xs shadow-md">
            <Coins className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>{economy.coins.toLocaleString()}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowShop(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Tienda</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-md space-y-4">
        {/* Mensaje de Error si lo hay */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs text-left font-medium shadow-[0_0_30px_rgba(244,63,94,0.3)] backdrop-blur-md space-y-2"
          >
            <div className="font-bold text-rose-100 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
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
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 flex items-center justify-center shadow-inner overflow-hidden">
              <AvatarDisplay avatar={profile.avatar} className="w-full h-full rounded-2xl object-cover" fallbackClassName="text-2xl" />
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Tu nombre o apodo (Ej: Gauss)"
              maxLength={15}
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Selección de avatar: Avatares estándar + Desbloqueados de la tienda */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {[
              ...AVAILABLE_AVATARS,
              ...SHOP_CATALOG.filter((i) => economy.unlockedAvatars.includes(i.id)).map((i) => i.value),
            ].map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => handleAvatarSelect(av)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer overflow-hidden flex-shrink-0 ${
                  profile.avatar === av
                    ? 'bg-amber-400/30 border-2 border-amber-300 scale-110 shadow-lg'
                    : 'bg-black/30 hover:bg-white/10 border border-white/15'
                }`}
              >
                <AvatarDisplay avatar={av} className="w-full h-full rounded-xl object-cover" fallbackClassName="text-base" />
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

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Jugadores máximos (2 a 6) */}
            <div className="p-2.5 rounded-2xl bg-black/30 border border-white/10">
              <span className="block text-[11px] font-semibold text-amber-200/80 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Jugadores
              </span>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6].map((num) => (
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

          {/* Opción Crear como Espectador */}
          <div className="mb-4 p-2.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-300" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Entrar como Anfitrión Espectador</div>
                <div className="text-[10px] text-slate-400">Verás la partida sin jugar en la mesa</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHostAsSpectator(!hostAsSpectator)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                hostAsSpectator
                  ? 'bg-purple-600 text-white shadow border border-purple-400'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {hostAsSpectator ? 'Sí' : 'No'}
            </button>
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleCreatePracticeWithBot}
            disabled={isCreating}
            className="w-full mt-2.5 py-3 px-4 rounded-2xl bg-purple-950/70 hover:bg-purple-900 border border-purple-400/50 text-purple-200 font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Bot className="w-4 h-4 text-purple-300" />
            <span>🎮 Probar Ahora (Partida Rápida vs Bot)</span>
          </motion.button>
        </div>

        {/* Tarjeta: Unirse a Sala */}
        <form
          onSubmit={handleJoinSubmit}
          className="p-5 rounded-3xl bg-black/40 border border-white/15 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-300" />
              Unirse a una Sala
            </h2>

            {/* Toggle entrar como espectador */}
            <button
              type="button"
              onClick={() => setJoinAsSpectator(!joinAsSpectator)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                joinAsSpectator
                  ? 'bg-purple-600/80 border-purple-400 text-white'
                  : 'bg-black/30 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-300" />
              <span>{joinAsSpectator ? 'Como Espectador' : 'Como Jugador'}</span>
            </button>
          </div>

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

      {/* Modal de Tienda */}
      <ShopModal
        isOpen={showShop}
        onClose={() => {
          setShowShop(false);
          setEconomy(getPlayerEconomy());
          setProfile(getPlayerProfile());
        }}
        onProfileUpdated={() => {
          setProfile(getPlayerProfile());
          setEconomy(getPlayerEconomy());
        }}
      />

      {/* Pie de página */}
      <div className="w-full text-center text-[11px] text-amber-200/70 mt-6">
        ALGEBRA UNO • Multijugador Serverless en Tiempo Real
      </div>
    </div>
  );
};
