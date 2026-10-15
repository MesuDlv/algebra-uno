import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  getPlayerEconomy,
  equipMusic,
  togglePlaylistTrack,
  setPlaylist as setEconomyPlaylist,
  SHOP_CATALOG,
  ShopItem,
  getEffectiveTrackValue,
  KNOWN_TRACK_DURATIONS,
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

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const lastAdvanceTimeRef = useRef<number>(0);
  const lastCurrentTimeRef = useRef<number>(0);
  const lastDurationRef = useRef<number>(0);
  const dynamicDurationsRef = useRef<Record<string, number>>({});
  const trackStartTimeRef = useRef<number>(Date.now());
  const pauseStartTimeRef = useRef<number>(0);

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

  // Obtiene la duración esperada en segundos para una pista dada
  const getExpectedDuration = useCallback((track: ShopItem | null): number => {
    if (!track) return 0;
    if (track.duration && track.duration > 0) return track.duration;
    if (KNOWN_TRACK_DURATIONS[track.id]) return KNOWN_TRACK_DURATIONS[track.id];
    if (dynamicDurationsRef.current[track.id]) return dynamicDurationsRef.current[track.id];
    if (lastDurationRef.current > 0) return lastDurationRef.current;
    return 0;
  }, []);

  const playMusic = useCallback(() => {
    if (!equippedTrack) return;
    if (pauseStartTimeRef.current > 0) {
      const pausedDuration = Date.now() - pauseStartTimeRef.current;
      trackStartTimeRef.current += pausedDuration;
      pauseStartTimeRef.current = 0;
    }
    sendListening();
    sendCommand('unMute');
    sendCommand('setVolume', [volumeRef.current]);
    sendCommand('playVideo');
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [equippedTrack, sendCommand, sendListening]);

  const pauseMusic = useCallback(() => {
    pauseStartTimeRef.current = Date.now();
    sendCommand('pauseVideo');
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [sendCommand]);

  const restartMusic = useCallback(() => {
    if (!equippedTrack) return;
    trackStartTimeRef.current = Date.now();
    pauseStartTimeRef.current = 0;
    lastCurrentTimeRef.current = 0;
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
      trackStartTimeRef.current = Date.now();
      pauseStartTimeRef.current = 0;

      const targetTrack = tracks[targetIndex];
      if (targetTrack) {
        const vidId = getEffectiveTrackValue(
          targetTrack,
          forceFallbackTrackIdsRef.current.includes(targetTrack.id)
        );
        if (vidId) {
          sendListening();
          sendCommand('loadVideoById', [vidId, 0]);
          sendCommand('loadVideoById', [{ videoId: vidId, startSeconds: 0 }]);
          sendCommand('unMute');
          sendCommand('setVolume', [volumeRef.current]);
          sendCommand('playVideo');
          setIsPlaying(true);
          isPlayingRef.current = true;
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
      trackStartTimeRef.current = Date.now();
      pauseStartTimeRef.current = 0;
      lastCurrentTimeRef.current = 0;
      sendCommand('seekTo', [0, true]);
      sendCommand('unMute');
      sendCommand('setVolume', [volumeRef.current]);
      sendCommand('playVideo');
      setIsPlaying(true);
      isPlayingRef.current = true;
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
      trackStartTimeRef.current = Date.now();
      pauseStartTimeRef.current = 0;
      lastCurrentTimeRef.current = 0;
      sendCommand('seekTo', [0, true]);
      sendCommand('unMute');
      sendCommand('setVolume', [volumeRef.current]);
      sendCommand('playVideo');
      setIsPlaying(true);
      isPlayingRef.current = true;
      return;
    }
    const prevIdx = (currentTrackIndexRef.current - 1 + tracks.length) % tracks.length;
    playTrackAtIndex(prevIdx);
  }, [playTrackAtIndex, sendCommand]);

  // Disparo de transición con cooldown anti-rebote (mínimo 1.8s entre avances para evitar saltos dobles)
  const triggerNextTrack = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceTimeRef.current < 1800) {
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
          isPlayingRef.current = true;
        } else if (playerState === 2) {
          setIsPlaying(false);
          isPlayingRef.current = false;
        } else if (playerState === 0) {
          // ¡La canción terminó! Pasar a la siguiente en bucle
          setIsPlaying(false);
          isPlayingRef.current = false;
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
          trackStartTimeRef.current = Date.now();
          pauseStartTimeRef.current = 0;
          lastCurrentTimeRef.current = 0;
        }
      }

      // 1. Guardar duración si viene en el evento (incluso si no viene currentTime en este mensaje)
      if (data.info && typeof data.info.duration === 'number' && data.info.duration > 0) {
        lastDurationRef.current = data.info.duration;
        const curTrack = activePlaylistTracksRef.current[currentTrackIndexRef.current];
        if (curTrack) {
          dynamicDurationsRef.current[curTrack.id] = data.info.duration;
        }
      }

      // 2. Comprobar currentTime reportado por YouTube
      if (data.info && typeof data.info.currentTime === 'number') {
        const currTime = data.info.currentTime;
        const prevTime = lastCurrentTimeRef.current;
        lastCurrentTimeRef.current = currTime;

        const tracks = activePlaylistTracksRef.current;
        const curTrack = tracks[currentTrackIndexRef.current];
        const dur = getExpectedDuration(curTrack);

        // Detección 1: Fin natural por aproximación a la duración (ventana de 1.2 segundos)
        if (dur > 2 && currTime >= dur - 1.2) {
          triggerNextTrack();
        }

        // Detección 2: Salto hacia atrás / auto-bucle interno de YouTube Shorts
        // Si el video ya había reproducido al menos 4 segundos y repentinamente retrocede a menos de 3s:
        if (
          tracks.length > 1 &&
          prevTime >= 4 &&
          currTime < 3 &&
          currTime < prevTime - 2
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
  }, [sendListening, triggerNextTrack, sendCommand, getExpectedDuration]);

  // Temporizador activo en tiempo real (cada 250ms):
  // 1. Mantiene el handshake postMessage activo con YouTube ('listening').
  // 2. Control de tiempo transcurrido (wall-clock): Si la canción alcanza su duración esperada
  //    (ej. 15 segundos para 'canción para políticos'), avanza automáticamente sin depender
  //    exclusivamente de los eventos de YouTube.
  useEffect(() => {
    if (!isMusicEnabled) return;
    const interval = setInterval(() => {
      sendListening();

      if (!isPlayingRef.current) return;

      const tracks = activePlaylistTracksRef.current;
      if (tracks.length === 0) return;

      const curTrack = tracks[currentTrackIndexRef.current];
      if (!curTrack) return;

      const expectedDur = getExpectedDuration(curTrack);

      if (expectedDur > 2) {
        const elapsed = (Date.now() - trackStartTimeRef.current) / 1000;
        // Si el tiempo transcurrido en el reloj real supera la duración esperada menos margen de 0.5s:
        if (elapsed >= expectedDur - 0.5) {
          triggerNextTrack();
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isMusicEnabled, sendListening, getExpectedDuration, triggerNextTrack]);

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
