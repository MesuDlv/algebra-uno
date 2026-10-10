import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  ExternalLink,
  Sparkles,
  Music,
  Check,
  ShoppingBag,
  Disc,
  Repeat,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { soundEffects } from '../../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    isMusicEnabled,
    toggleMusic,
    volume,
    setVolume,
    isPlaying,
    playMusic,
    pauseMusic,
    restartMusic,
    nextTrack,
    prevTrack,
    equippedTrack,
    equippedPlaylist,
    activePlaylistTracks,
    currentTrackIndex,
    toggleTrackInPlaylist,
    allMusicTracks,
    unlockedMusicIds,
    openShop,
  } = useMusic();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundEffects.isSoundEnabled());
  const [testedSound, setTestedSound] = useState<boolean>(false);

  const handleToggleSound = () => {
    const next = soundEffects.toggleSound();
    setSoundEnabled(next);
  };

  const handleTestSound = () => {
    soundEffects.playCard();
    setTestedSound(true);
    setTimeout(() => setTestedSound(false), 1200);
  };

  const handleGoToShop = () => {
    onClose();
    openShop();
  };

  if (!isOpen) return null;

  // Solo mostrar las canciones adquiridas/desbloqueadas (patria milagro solo si fue desbloqueada con código)
  const ownedTracks = allMusicTracks.filter((track) => unlockedMusicIds.includes(track.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
        {/* Fondo desenfocado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Contenedor del Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-slate-950/95 border-2 border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white overflow-hidden z-10"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Configuración</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Ajustes
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Control de música, bucle de canciones y efectos de sonido
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              title="Cerrar configuración"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo con scroll */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
            {/* 1. SECCIÓN DE MÚSICA DE FONDO (ACTIVAR / DESACTIVAR + VOLUMEN + REPRODUCTOR) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 via-slate-900/80 to-black border border-purple-500/40 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white">Música del Lobby</span>
                    <span className="block text-[11px] text-purple-200/80">
                      Reproduce tu selección en bucle continuo
                    </span>
                  </div>
                </div>

                {/* Switch Toggle (100% calibrado, sin bugs visuales) */}
                <button
                  type="button"
                  onClick={toggleMusic}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isMusicEnabled
                      ? 'bg-amber-400 shadow-md shadow-amber-400/40'
                      : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isMusicEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                      isMusicEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider de Volumen */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-4 h-4 text-amber-300" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-yellow-300" />
                    )}
                    <span>Volumen de Música</span>
                  </span>
                  <span className="font-mono text-amber-300">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  disabled={!isMusicEnabled || !equippedTrack}
                  className="w-full accent-amber-400 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Controles de la pista activa en el bucle */}
              {equippedTrack ? (
                <div className="p-3 sm:p-3.5 rounded-xl bg-black/60 border border-purple-400/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      Pista {currentTrackIndex + 1} de {activePlaylistTracks.length} en bucle
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isMusicEnabled && isPlaying ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {isMusicEnabled && isPlaying ? '● Reproduciendo' : '○ En pausa'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/20 shadow-md">
                      <img
                        src={`https://img.youtube.com/vi/${equippedTrack.value}/mqdefault.jpg`}
                        alt={equippedTrack.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isPlaying && isMusicEnabled && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="flex items-end gap-1 h-3.5">
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bounce h-2" />
                            <span className="w-0.5 bg-yellow-300 rounded-full animate-bounce h-3.5 delay-75" />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-bounce h-2.5 delay-150" />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Solo Título (Sin descripciones largas) */}
                      <h4 className="text-sm font-black text-white truncate">
                        {equippedTrack.name}
                      </h4>
                      {equippedTrack.realTitle && (
                        <p className="text-[11px] text-slate-300 truncate">
                          {equippedTrack.realTitle} • {equippedTrack.artist}
                        </p>
                      )}

                      {/* Botones de navegación y reproducción en el bucle */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {/* Botón Anterior */}
                        {activePlaylistTracks.length > 1 && (
                          <button
                            type="button"
                            onClick={prevTrack}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer border border-white/10"
                            title="Canción anterior en el bucle"
                          >
                            <SkipBack className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Botón Play / Pause */}
                        {isMusicEnabled && (
                          <button
                            type="button"
                            onClick={isPlaying ? pauseMusic : playMusic}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-md active:scale-95"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Reproducir</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Botón Siguiente */}
                        {activePlaylistTracks.length > 1 && (
                          <button
                            type="button"
                            onClick={nextTrack}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer border border-white/10"
                            title="Siguiente canción en el bucle"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reiniciar */}
                        <button
                          type="button"
                          onClick={restartMusic}
                          disabled={!isMusicEnabled}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer border border-white/10 disabled:opacity-30"
                          title="Reiniciar pista"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Enlace oficial */}
                        {equippedTrack.youtubeUrl && (
                          <a
                            href={equippedTrack.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer border border-white/10 ml-auto"
                            title="Abrir en YouTube oficial"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aviso para celulares si no está reproduciendo */}
                  {isMusicEnabled && !isPlaying && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-amber-200/90 bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
                      <span>📱 ¿No suena en tu celular? Pulsa "Reproducir":</span>
                      <button
                        type="button"
                        onClick={playMusic}
                        className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse cursor-pointer shadow"
                      >
                        ▶️ Iniciar Audio
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/15 text-center space-y-2">
                  <div className="text-xs text-amber-200/90 font-medium">
                    {ownedTracks.length === 0
                      ? 'No tienes ninguna canción comprada todavía.'
                      : 'No has seleccionado canciones para el bucle.'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {ownedTracks.length === 0
                      ? 'Compra una canción en la Tienda para que aparezca aquí y puedas ponerla en bucle.'
                      : 'Marca una o varias de tus canciones adquiridas abajo para activar el bucle.'}
                  </p>
                  {ownedTracks.length === 0 && (
                    <button
                      type="button"
                      onClick={handleGoToShop}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ir a la Tienda</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. CATÁLOGO DE CANCIONES ADQUIRIDAS PARA EL BUCLE (Solo las compradas) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-yellow-300" />
                    Bucle de Canciones ({equippedPlaylist.length} activas)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Elige 1, 2 o más: acaba una y empieza la siguiente automáticamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoToShop}
                  className="text-[11px] font-bold text-amber-300 hover:text-white underline flex items-center gap-1 transition"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Tienda</span>
                </button>
              </div>

              {ownedTracks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1.5">
                  <div className="text-xs text-slate-300 font-bold">
                    🔒 No hay canciones disponibles en configuración
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Las canciones solo aparecen aquí después de comprarlas en la Tienda o desbloquearlas con código.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ownedTracks.map((track) => {
                    const inLoop = equippedPlaylist.includes(track.id);
                    const isCurrentlyPlaying = isPlaying && equippedTrack?.id === track.id;
                    const isLegendary = track.rarity === 'legendario';

                    return (
                      <div
                        key={track.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          inLoop
                            ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-black border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40'
                            : 'bg-slate-900/70 border-white/15 hover:border-purple-400/50'
                        }`}
                      >
                        {/* Portada oficial visible (porque ya está comprada) */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-900 border border-white/20 shadow">
                          <img
                            src={`https://img.youtube.com/vi/${track.value}/mqdefault.jpg`}
                            alt={track.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isCurrentlyPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            </div>
                          )}
                        </div>

                        {/* Solo Título (Sin descripciones largas) */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                                isLegendary
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {track.rarity}
                            </span>
                            {inLoop && (
                              <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                                <Check className="w-3 h-3 text-amber-400" /> En bucle
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-white truncate">
                            {track.name}
                          </h4>
                          {track.realTitle && (
                            <p className="text-[10px] text-slate-400 truncate">
                              {track.realTitle} • {track.artist}
                            </p>
                          )}
                        </div>

                        {/* Botón para alternar en el bucle */}
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleTrackInPlaylist(track.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1 ${
                              inLoop
                                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                            }`}
                          >
                            {inLoop ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>En Bucle</span>
                              </>
                            ) : (
                              <>
                                <Disc className="w-3.5 h-3.5" />
                                <span>Añadir</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. SECCIÓN DE EFECTOS DE SONIDO (SFX) CON SWITCH CORREGIDO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/15 shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white">Efectos Acústicos (SFX)</span>
                    <span className="block text-[11px] text-slate-400">
                      Sonidos físicos de cartas, turnos y victoria
                    </span>
                  </div>
                </div>

                {/* Switch Toggle (100% calibrado, sin bugs visuales) */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/40'
                      : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Botón de prueba de sonido */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  Prueba el efecto acústico de carta:
                </span>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  {testedSound ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">¡Sonó!</span>
                    </>
                  ) : (
                    <>
                      <span>🃏</span>
                      <span>Probar Sonido</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pie del Modal */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-900/80 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">ALGEBRA UNO • Configuración</span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
