import React, { useRef, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';

export const BackgroundMusicPlayer: React.FC = () => {
  const {
    iframeRef,
    equippedTrack,
    effectiveVideoId,
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

  return (
    <div
      className="fixed bottom-0 right-0 w-[200px] h-[120px] opacity-[0.001] pointer-events-none z-[-1] overflow-hidden"
      aria-hidden="true"
    >
      <iframe
        ref={iframeRef}
        id="algebra-uno-bg-music-iframe"
        width="200"
        height="120"
        src={`https://www.youtube.com/embed/${initialVideoId}?enablejsapi=1&autoplay=1&mute=0&playsinline=1&controls=0${
          origin ? `&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}` : ''
        }`}
        title={`ALGEBRA UNO Pista de Fondo - ${equippedTrack.name}`}
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleIframeLoad}
      />
    </div>
  );
};

