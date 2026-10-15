import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  getPlayerEconomy,
  equipMusic,
  togglePlaylistTrack,
  setPlaylist as setEconomyPlaylist,
  SHOP_CATALOG,
  ShopItem,
  getEffectiveTrackValue,
} from '../utils/economy';

const MUSIC_ENABLED_KEY = 'algebra_uno_music_enabled';
const MUSIC_VOLUME_KEY = 'algebra_uno_music_volume';

export interface MusicContextType {
  isMusicEnabled: boolean;
  toggleMusic: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
  playMusic: () => void;
  pauseMusic: () => void;
  restartMusic: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  playTrackAtIndex: (index: number) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
  openShop: () => void;
  closeShop: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  equippedTrack: ShopItem | null;
  effectiveVideoId: string;
  equippedPlaylist: string[];
  activePlaylistTracks: ShopItem[];
  forceFallbackTrackIds: string[];
  currentTrackIndex: number;
  equipTrack: (trackId: string | null) => void;
  toggleTrackInPlaylist: (trackId: string) => void;
  setPlaylist: (trackIds: string[]) => void;
  allMusicTracks: ShopItem[];
  unlockedMusicIds: string[];
  refreshEconomyState: () => void;
  handleIframeLoad: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Estado de habilitado
  const [isMusicEnabled, setIsMusicEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(MUSIC_ENABLED_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // 2. Volumen (0 a 100)
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(MUSIC_VOLUME_KEY);
      if (saved !== null) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 0 && val <= 100) return val;
      }
      return 50;
    } catch {
      return 50;
    }
  });

  // 3. Estado de reproducción actual
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 4. Modales
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);

  // 5. Estado de inventario musical
  const [economyState, setEconomyState] = useState(() => getPlayerEconomy());
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [forceFallbackTrackIds, setForceFallbackTrackIds] = useState<string[]>([]);

  const refreshEconomyState = useCallback(() => {
    setEconomyState(getPlayerEconomy());
  }, []);

  const allMusicTracks = SHOP_CATALOG.filter((item) => item.type === 'music');
  const unlockedMusicIds = economyState.unlockedMusic || [];

  // Pistas activas en el bucle (solo las que el usuario ha comprado/desbloqueado)
  const equippedPlaylistIds = (economyState.equippedPlaylist || []).filter((id) =>
    unlockedMusicIds.includes(id)
  );

  const activePlaylistTracks = equippedPlaylistIds
    .map((id) => allMusicTracks.find((t) => t.id === id))
    .filter(Boolean) as ShopItem[];

  // Pista actual en reproducción
  const clampedIndex =
    activePlaylistTracks.length > 0
      ? Math.min(Math.max(0, currentTrackIndex), activePlaylistTracks.length - 1)
      : 0;

  const equippedTrack = activePlaylistTracks[clampedIndex] || null;

  // ID efectivo para el iframe de YouTube (selecciona versión móvil sin restricciones si aplica)
  const effectiveVideoId = equippedTrack
    ? getEffectiveTrackValue(equippedTrack, forceFallbackTrackIds.includes(equippedTrack.id))
    : '';

  // Referencias mutables para evitar cierres obsoletos (stale closures) en manejadores asíncronos
  const activePlaylistTracksRef = useRef<ShopItem[]>(activePlaylistTracks);
  activePlaylistTracksRef.current = activePlaylistTracks;

  const currentTrackIndexRef = useRef<number>(clampedIndex);
  currentTrackIndexRef.current = clampedIndex;

  const forceFallbackTrackIdsRef = useRef<string[]>(forceFallbackTrackIds);
  forceFallbackTrackIdsRef.current = forceFallbackTrackIds;

  const isMusicEnabledRef = useRef<boolean>(isMusicEnabled);
  isMusicEnabledRef.current = isMusicEnabled;

  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;

  const lastAdvanceTimeRef = useRef<number>(0);
  const lastCurrentTimeRef = useRef<number>(0);
  const lastDurationRef = useRef<number>(0);

  // Envío de comandos al IFrame de YouTube mediante postMessage
  const sendCommand = useCallback((func: string, args: unknown[] = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    } catch {
      // Ignorar restricciones entre orígenes
    }
  }, []);

  // Handshake fundamental para que YouTube active el envío de mensajes de estado (infoDelivery / onStateChange)
  const sendListening = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'listening',
          id: iframeRef.current.id || 'algebra-uno-bg-music-iframe',
        }),
        '*'
      );
    } catch {
      // Ignorar restricciones
    }
  }, []);

  const playMusic = useCallback(() => {
    if (!equippedTrack) return;
    sendListening();
    sendCommand('unMute');
    sendCommand('setVolume', [volumeRef.current]);
    sendCommand('playVideo');
    setIsPlaying(true);
  }, [equippedTrack, sendCommand, sendListening]);

  const pauseMusic = useCallback(() => {
    sendCommand('pauseVideo');
    setIsPlaying(false);
  }, [sendCommand]);

  const restartMusic = useCallback(() => {
    if (!equippedTrack) return;
    sendCommand('seekTo', [0, true]);
    if (isMusicEnabledRef.current) {
      playMusic();
    }
  }, [equippedTrack, playMusic, sendCommand]);

  // Reproduce una pista específica por índice sin recargar el iframe del DOM
  const playTrackAtIndex = useCallback(
    (index: number) => {
      const tracks = activePlaylistTracksRef.current;
      if (tracks.length === 0) return;
      const targetIndex = ((index % tracks.length) + tracks.length) % tracks.length;
      setCurrentTrackIndex(targetIndex);
      currentTrackIndexRef.current = targetIndex;
      lastCurrentTimeRef.current = 0;
      lastDurationRef.current = 0;

      const targetTrack = tracks[targetIndex];
      if (targetTrack) {
        const vidId = getEffectiveTrackValue(
          targetTrack,
          forceFallbackTrackIdsRef.current.includes(targetTrack.id)
        );
        if (vidId) {
          sendListening();
          sendCommand('loadVideoById', [vidId, 0]);
          sendCommand('unMute');
          sendCommand('setVolume', [volumeRef.current]);
          sendCommand('playVideo');
          setIsPlaying(true);
        }
      }
    },
    [sendCommand, sendListening]
  );

  // Avanza a la siguiente canción del bucle (o reinicia si es solo 1 canción)
  const nextTrack = useCallback(() => {
    const tracks = activePlaylistTracksRef.current;
    if (tracks.length === 0) return;
    if (tracks.length === 1) {
      // Si hay 1 sola pista seleccionada, reinicia desde el segundo 0 en bucle continuo
      sendCommand('seekTo', [0, true]);
      sendCommand('unMute');
      sendCommand('setVolume', [volumeRef.current]);
      sendCommand('playVideo');
      setIsPlaying(true);
      return;
    }
    const nextIdx = (currentTrackIndexRef.current + 1) % tracks.length;
    playTrackAtIndex(nextIdx);
  }, [playTrackAtIndex, sendCommand]);

  // Retrocede a la canción anterior del bucle
  const prevTrack = useCallback(() => {
    const tracks = activePlaylistTracksRef.current;
    if (tracks.length === 0) return;
    if (tracks.length === 1) {
      sendCommand('seekTo', [0, true]);
      sendCommand('unMute');
      sendCommand('setVolume', [volumeRef.current]);
      sendCommand('playVideo');
      setIsPlaying(true);
      return;
    }
    const prevIdx = (currentTrackIndexRef.current - 1 + tracks.length) % tracks.length;
    playTrackAtIndex(prevIdx);
  }, [playTrackAtIndex, sendCommand]);

  // Disparo de transición con cooldown anti-rebote (mínimo 1.5s entre avances para evitar saltos dobles)
  const triggerNextTrack = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceTimeRef.current < 1500) {
      return;
    }
    lastAdvanceTimeRef.current = now;
    nextTrack();
  }, [nextTrack]);

  const setMusicEnabled = (enabled: boolean) => {
    setIsMusicEnabledState(enabled);
    try {
      localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
    } catch {
      // Ignorar
    }

    if (enabled && equippedTrack) {
      playMusic();
    } else {
      pauseMusic();
    }
  };

  const toggleMusic = () => {
    setMusicEnabled(!isMusicEnabled);
  };

  const setVolume = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    setVolumeState(clamped);
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(clamped));
    } catch {
      // Ignorar
    }
    sendCommand('setVolume', [clamped]);
    if (clamped === 0) {
      sendCommand('mute');
    } else {
      sendCommand('unMute');
    }
  };

  // Equipa una pista exclusiva (establece solo esa en el bucle)
  const equipTrack = (trackId: string | null) => {
    const updated = equipMusic(trackId);
    setEconomyState(updated);
    setCurrentTrackIndex(0);
    currentTrackIndexRef.current = 0;
    if (trackId && isMusicEnabledRef.current) {
      setTimeout(() => {
        playTrackAtIndex(0);
      }, 100);
    } else if (!trackId) {
      pauseMusic();
    }
  };

  // Alterna una pista en la lista de bucle
  const toggleTrackInPlaylist = (trackId: string) => {
    const updated = togglePlaylistTrack(trackId);
    setEconomyState(updated);

    const newPlaylist = updated.equippedPlaylist || [];
    const newActiveTracks = newPlaylist
      .map((id) => allMusicTracks.find((t) => t.id === id))
      .filter(Boolean) as ShopItem[];
    activePlaylistTracksRef.current = newActiveTracks;

    const prevTracks = activePlaylistTracksRef.current;
    const currentItem = prevTracks[currentTrackIndexRef.current];

    // Si la canción actual sigue en la nueva lista, mantenerse en ella
    if (currentItem && newPlaylist.includes(currentItem.id)) {
      const newIdx = newPlaylist.indexOf(currentItem.id);
      if (newIdx !== -1) {
        setCurrentTrackIndex(newIdx);
        currentTrackIndexRef.current = newIdx;
      }
    } else {
      // Si la canción actual fue desactivada, reproducir la primera de las que quedan
      setCurrentTrackIndex(0);
      currentTrackIndexRef.current = 0;
      if (newPlaylist.length > 0 && isMusicEnabledRef.current) {
        setTimeout(() => {
          playTrackAtIndex(0);
        }, 100);
      } else if (newPlaylist.length === 0) {
        pauseMusic();
      }
    }
  };

  // Establece toda la lista en bucle
  const setPlaylist = (trackIds: string[]) => {
    const updated = setEconomyPlaylist(trackIds);
    setEconomyState(updated);

    const newPlaylist = updated.equippedPlaylist || [];
    const newActiveTracks = newPlaylist
      .map((id) => allMusicTracks.find((t) => t.id === id))
      .filter(Boolean) as ShopItem[];
    activePlaylistTracksRef.current = newActiveTracks;

    setCurrentTrackIndex(0);
    currentTrackIndexRef.current = 0;
    if (updated.equippedPlaylist.length > 0 && isMusicEnabledRef.current) {
      setTimeout(() => {
        playTrackAtIndex(0);
      }, 100);
    } else {
      pauseMusic();
    }
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const openShop = () => setIsShopOpen(true);
  const closeShop = () => {
    setIsShopOpen(false);
    refreshEconomyState();
  };

  // Disparado cuando el iframe de YouTube termina de cargar en el DOM
  const handleIframeLoad = useCallback(() => {
    sendListening();
    if (!isMusicEnabledRef.current || !equippedTrack) return;
    const triggerPlay = () => {
      sendListening();
      sendCommand('unMute');
      sendCommand('setVolume', [volumeRef.current]);
      sendCommand('playVideo');
    };
    setTimeout(triggerPlay, 250);
    setTimeout(triggerPlay, 750);
    setTimeout(triggerPlay, 1500);
  }, [equippedTrack, sendCommand, sendListening]);

  // Escuchar mensajes de estado de YouTube IFrame API (infoDelivery, onStateChange, etc.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;

      // Respaldo de handshake al recibir eventos de inicio
      if (data.event === 'initialDelivery' || data.event === 'onReady') {
        sendListening();
      }

      // Estado del reproductor de YouTube:
      // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      let playerState: number | undefined;
      if (data.event === 'infoDelivery' && data.info && typeof data.info.playerState !== 'undefined') {
        playerState = Number(data.info.playerState);
      } else if (data.event === 'onStateChange') {
        if (typeof data.info === 'number') {
          playerState = data.info;
        } else if (typeof data.data === 'number') {
          playerState = data.data;
        } else if (data.info && typeof data.info.playerState !== 'undefined') {
          playerState = Number(data.info.playerState);
        }
      }

      if (typeof playerState !== 'undefined') {
        if (playerState === 1) {
          setIsPlaying(true);
        } else if (playerState === 2) {
          setIsPlaying(false);
        } else if (playerState === 0) {
          // ¡La canción terminó! Pasar a la siguiente en bucle
          setIsPlaying(false);
          triggerNextTrack();
        }
      }

      // Si YouTube embebido cambia de video por su cola interna, sincronizar el índice de la playlist
      if (data.info?.videoData?.video_id) {
        const currentYtVid = data.info.videoData.video_id;
        const tracks = activePlaylistTracksRef.current;
        const matchIdx = tracks.findIndex((t) => {
          const v = getEffectiveTrackValue(
            t,
            forceFallbackTrackIdsRef.current.includes(t.id)
          );
          return v === currentYtVid || t.value === currentYtVid || (t.mobileValue && t.mobileValue === currentYtVid);
        });
        if (matchIdx !== -1 && matchIdx !== currentTrackIndexRef.current) {
          setCurrentTrackIndex(matchIdx);
          currentTrackIndexRef.current = matchIdx;
        }
      }

      // Detección de progreso y fin de canción para videos normales y Shorts (ej. canción para políticos)
      if (
        data.info &&
        typeof data.info.currentTime === 'number' &&
        typeof data.info.duration === 'number'
      ) {
        const currTime = data.info.currentTime;
        const dur = data.info.duration;
        const prevTime = lastCurrentTimeRef.current;
        const prevDur = lastDurationRef.current || dur;

        lastCurrentTimeRef.current = currTime;
        lastDurationRef.current = dur;

        // Detección 1: Fin natural de pista por aproximación a la duración (ventana de 1.2 segundos)
        if (dur > 2) {
          const timeLeft = dur - currTime;
          if (timeLeft <= 1.2 || currTime >= dur - 1.2) {
            triggerNextTrack();
          }
        }

        // Detección 2: Salto hacia atrás / auto-bucle interno (caso específico de YouTube Shorts)
        // Si el video ya había reproducido más del 40% (o más de 4s) y de repente el tiempo cae a menos de 2.5s:
        // significa que YouTube reinició el video automáticamente en vez de emitir ended.
        // Si hay más de 1 canción en cola, avanzamos de inmediato a la siguiente pista.
        if (
          activePlaylistTracksRef.current.length > 1 &&
          prevDur > 2 &&
          prevTime > 4 &&
          prevTime >= prevDur * 0.4 &&
          currTime < 2.5
        ) {
          triggerNextTrack();
        }
      }

      // Detección de error de reproducción en YouTube (ej. restricciones de embebido o video bloqueado)
      if (data.event === 'onError' || (data.info && typeof data.info.error !== 'undefined')) {
        console.warn('YouTube IFrame reportó restricción o error para la pista actual:', data);
        const tracks = activePlaylistTracksRef.current;
        const curIdx = currentTrackIndexRef.current;
        const track = tracks[curIdx];
        if (track && track.mobileValue && !forceFallbackTrackIdsRef.current.includes(track.id)) {
          setForceFallbackTrackIds((prev) => [...prev, track.id]);
          sendCommand('loadVideoById', [track.mobileValue, 0]);
          sendCommand('playVideo');
        } else {
          triggerNextTrack();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendListening, triggerNextTrack, sendCommand]);

  // Sondeo activo de tiempo cada 400ms para atrapar con precisión el final de cualquier canción o Short
  useEffect(() => {
    if (!isMusicEnabled) return;
    const interval = setInterval(() => {
      sendListening();
      if (isPlaying) {
        sendCommand('getCurrentTime');
      }
    }, 400);
    return () => clearInterval(interval);
  }, [isMusicEnabled, isPlaying, sendListening, sendCommand]);

  // Autoplay y desbloqueo de audio en móvil ante gestos del usuario
  useEffect(() => {
    if (!isMusicEnabled || !equippedTrack) return;

    const handleUserGesture = () => {
      if (!isPlaying) {
        sendListening();
        sendCommand('unMute');
        sendCommand('setVolume', [volumeRef.current]);
        sendCommand('playVideo');
      }
    };

    window.addEventListener('click', handleUserGesture);
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('keydown', handleUserGesture);

    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, [isMusicEnabled, equippedTrack, isPlaying, sendCommand, sendListening]);

  return (
    <MusicContext.Provider
      value={{
        isMusicEnabled,
        toggleMusic,
        setMusicEnabled,
        volume,
        setVolume,
        isPlaying,
        playMusic,
        pauseMusic,
        restartMusic,
        nextTrack,
        prevTrack,
        playTrackAtIndex,
        isSettingsOpen,
        setIsSettingsOpen,
        openSettings,
        closeSettings,
        isShopOpen,
        setIsShopOpen,
        openShop,
        closeShop,
        iframeRef,
        equippedTrack,
        effectiveVideoId,
        equippedPlaylist: equippedPlaylistIds,
        activePlaylistTracks,
        forceFallbackTrackIds,
        currentTrackIndex: clampedIndex,
        equipTrack,
        toggleTrackInPlaylist,
        setPlaylist,
        allMusicTracks,
        unlockedMusicIds,
        refreshEconomyState,
        handleIframeLoad,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic debe usarse dentro de un MusicProvider');
  }
  return context;
};

export const LEGENDARY_TRACK = {
  id: 'ga4_APeE4Yg',
  youtubeUrl: 'https://youtu.be/ga4_APeE4Yg?si=CX6cc6DYx5yKCwGe',
  title: 'Bailando',
  artist: 'Enrique Iglesias ft. Descemer Bueno, Gente De Zona',
  tag: 'Legendaria',
};
