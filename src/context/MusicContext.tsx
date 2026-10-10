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

  const playMusic = useCallback(() => {
    if (!equippedTrack) return;
    sendCommand('unMute');
    sendCommand('setVolume', [volume]);
    sendCommand('playVideo');
    setIsPlaying(true);
  }, [equippedTrack, volume, sendCommand]);

  const pauseMusic = useCallback(() => {
    sendCommand('pauseVideo');
    setIsPlaying(false);
  }, [sendCommand]);

  const restartMusic = useCallback(() => {
    if (!equippedTrack) return;
    sendCommand('seekTo', [0, true]);
    if (isMusicEnabled) {
      playMusic();
    }
  }, [equippedTrack, isMusicEnabled, playMusic, sendCommand]);

  // Avanza a la siguiente canción del bucle (o reinicia si es solo 1)
  const nextTrack = useCallback(() => {
    if (activePlaylistTracks.length === 0) return;
    if (activePlaylistTracks.length === 1) {
      sendCommand('seekTo', [0, true]);
      sendCommand('playVideo');
      setIsPlaying(true);
      return;
    }
    const nextIdx = (clampedIndex + 1) % activePlaylistTracks.length;
    setCurrentTrackIndex(nextIdx);
  }, [activePlaylistTracks.length, clampedIndex, sendCommand]);

  // Retrocede a la canción anterior del bucle
  const prevTrack = useCallback(() => {
    if (activePlaylistTracks.length === 0) return;
    if (activePlaylistTracks.length === 1) {
      sendCommand('seekTo', [0, true]);
      sendCommand('playVideo');
      setIsPlaying(true);
      return;
    }
    const prevIdx = (clampedIndex - 1 + activePlaylistTracks.length) % activePlaylistTracks.length;
    setCurrentTrackIndex(prevIdx);
  }, [activePlaylistTracks.length, clampedIndex, sendCommand]);

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
    if (trackId && isMusicEnabled) {
      setTimeout(() => {
        playMusic();
      }, 300);
    } else if (!trackId) {
      pauseMusic();
    }
  };

  // Alterna una pista en la lista de bucle
  const toggleTrackInPlaylist = (trackId: string) => {
    const updated = togglePlaylistTrack(trackId);
    setEconomyState(updated);
    setCurrentTrackIndex(0);
    if (updated.equippedPlaylist.length > 0 && isMusicEnabled) {
      setTimeout(() => {
        playMusic();
      }, 300);
    } else if (updated.equippedPlaylist.length === 0) {
      pauseMusic();
    }
  };

  // Establece toda la lista en bucle
  const setPlaylist = (trackIds: string[]) => {
    const updated = setEconomyPlaylist(trackIds);
    setEconomyState(updated);
    setCurrentTrackIndex(0);
    if (updated.equippedPlaylist.length > 0 && isMusicEnabled) {
      setTimeout(() => {
        playMusic();
      }, 300);
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
    if (!isMusicEnabled || !equippedTrack) return;
    const triggerPlay = () => {
      sendCommand('unMute');
      sendCommand('setVolume', [volume]);
      sendCommand('playVideo');
    };
    setTimeout(triggerPlay, 350);
    setTimeout(triggerPlay, 900);
  }, [isMusicEnabled, equippedTrack, volume, sendCommand]);

  // Escuchar mensajes de estado de YouTube IFrame API
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);

          // Estado del reproductor de YouTube:
          // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
          if (data.event === 'infoDelivery' && data.info) {
            const playerState = data.info.playerState;
            if (typeof playerState !== 'undefined') {
              if (playerState === 1) {
                setIsPlaying(true);
              } else if (playerState === 2) {
                setIsPlaying(false);
              } else if (playerState === 0) {
                // ¡La canción terminó! Pasar a la siguiente en bucle
                setIsPlaying(false);
                nextTrack();
              }
            }
          }

          // Detección de error de reproducción en YouTube (ej. restricciones de embebido móvil o video no disponible)
          if (data.event === 'onError' || (data.info && typeof data.info.error !== 'undefined')) {
            console.warn('YouTube IFrame reportó restricción o error para la pista actual:', data);
            if (
              equippedTrack &&
              equippedTrack.mobileValue &&
              !forceFallbackTrackIds.includes(equippedTrack.id)
            ) {
              setForceFallbackTrackIds((prev) => [...prev, equippedTrack.id]);
            } else {
              nextTrack();
            }
          }
        } catch {
          // Ignorar mensajes ajenos a JSON de YouTube
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nextTrack, equippedTrack, forceFallbackTrackIds]);

  // Autoplay y desbloqueo de audio en móvil ante gestos del usuario
  useEffect(() => {
    if (!isMusicEnabled || !equippedTrack) return;

    const handleUserGesture = () => {
      if (!isPlaying) {
        sendCommand('unMute');
        sendCommand('setVolume', [volume]);
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
  }, [isMusicEnabled, equippedTrack, isPlaying, volume, sendCommand]);

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
