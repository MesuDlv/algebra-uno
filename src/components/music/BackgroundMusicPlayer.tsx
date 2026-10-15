import React, { useRef, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { getEffectiveTrackValue } from '../../utils/economy';

export const BackgroundMusicPlayer: React.FC = () => {
  const {
    iframeRef,
    equippedTrack,
    effectiveVideoId,
    activePlaylistTracks,
    forceFallbackTrackIds,
    handleIframeLoad,
  } = useMusic();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const initialVideoIdRef = useRef<string | null>(null);

  // Inicializar el ID del primer video montado en el iframe
  if (!initialVideoIdRef.current && effectiveVideoId) {
    initialVideoIdRef.current = effectiveVideoId;
  }

  // Si no hay pistas activas, reiniciar referencia inicial
  useEffect(() => {
    if (!equippedTrack) {
      initialVideoIdRef.current = null;
    }
  }, [equippedTrack]);

  if (!equippedTrack || !effectiveVideoId) {
    return null;
  }

  const initialVideoId = initialVideoIdRef.current || effectiveVideoId;

  // Lista de video IDs de toda la playlist activa para bucle continuo nativo en YouTube
  const playlistVideoIds = activePlaylistTracks
    .map((t) => getEffectiveTrackValue(t, forceFallbackTrackIds.includes(t.id)))
    .filter(Boolean);

  const playlistParam =
    playlistVideoIds.length > 0
      ? `&loop=1&playlist=${playlistVideoIds.join(',')}`
      : `&loop=1&playlist=${initialVideoId}`;

  return (
    <div
      className="fixed bottom-0 right-0 w-[1px] h-[1px] opacity-[0.01] pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <iframe
        ref={iframeRef}
        id="algebra-uno-bg-music-iframe"
        width="200"
        height="120"
        src={`https://www.youtube.com/embed/${initialVideoId}?enablejsapi=1&autoplay=1&mute=0&playsinline=1&controls=0${playlistParam}${
          origin ? `&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}` : ''
        }`}
        title={`ALGEBRA UNO Pista de Fondo - ${equippedTrack.name}`}
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleIframeLoad}
      />
    </div>
  );
};

