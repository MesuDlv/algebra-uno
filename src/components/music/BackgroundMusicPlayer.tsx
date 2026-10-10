import React from 'react';
import { useMusic } from '../../context/MusicContext';

export const BackgroundMusicPlayer: React.FC = () => {
  const { iframeRef, equippedTrack, effectiveVideoId, handleIframeLoad } = useMusic();

  if (!equippedTrack || !effectiveVideoId) {
    return null;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div
      className="fixed bottom-0 right-0 w-[1px] h-[1px] opacity-[0.01] pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <iframe
        key={effectiveVideoId}
        ref={iframeRef}
        id="algebra-uno-bg-music-iframe"
        width="200"
        height="120"
        src={`https://www.youtube.com/embed/${effectiveVideoId}?enablejsapi=1&autoplay=1&mute=0&playsinline=1&controls=0${
          origin ? `&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}` : ''
        }`}
        title={`ALGEBRA UNO Pista de Fondo - ${equippedTrack.name}`}
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleIframeLoad}
      />
    </div>
  );
};
