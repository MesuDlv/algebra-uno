import React from 'react';
import { Settings, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMusic } from '../../context/MusicContext';

export interface SettingsButtonProps {
  className?: string;
  variant?: 'floating' | 'header';
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
  className = '',
  variant = 'floating',
}) => {
  const { openSettings, isPlaying, isMusicEnabled } = useMusic();

  if (variant === 'header') {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openSettings}
        className={`relative p-1.5 sm:p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400/80 text-slate-200 hover:text-white text-xs cursor-pointer transition flex items-center justify-center group shadow-sm ${className}`}
        title="Configuración y Música (⚙️)"
        aria-label="Abrir configuración y música"
      >
        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 group-hover:text-yellow-200 transition-transform duration-500 group-hover:rotate-90 drop-shadow" />

        {isMusicEnabled && (
          <span
            className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[8px] shadow-sm flex items-center gap-0.5 border border-yellow-200"
            title="Música activa"
          >
            {isPlaying ? (
              <span className="flex items-end gap-0.5 h-1.5 px-0.5">
                <span className="w-0.5 h-1 bg-slate-950 rounded-full animate-pulse" />
                <span className="w-0.5 h-1.5 bg-slate-950 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-0.5 bg-slate-950 rounded-full animate-pulse delay-150" />
              </span>
            ) : (
              <Music2 className="w-2 h-2" />
            )}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={openSettings}
      className={`group fixed top-3 right-3 sm:top-4 sm:right-4 z-50 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 hover:border-amber-400/80 shadow-xl flex items-center justify-center text-slate-200 hover:text-white cursor-pointer transition-all duration-300 ring-1 ring-white/10 hover:ring-amber-400/40 ${className}`}
      title="Configuración y Música (⚙️)"
      aria-label="Abrir configuración y música"
    >
      {/* Icono de Engranaje */}
      <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-amber-300 group-hover:text-yellow-200 transition-transform duration-500 group-hover:rotate-90 drop-shadow" />

      {/* Indicador de Música activa con mini ecualizador */}
      {isMusicEnabled && (
        <span
          className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] shadow-md flex items-center gap-0.5 border border-yellow-200"
          title="Música activa"
        >
          {isPlaying ? (
            <span className="flex items-end gap-0.5 h-2 px-0.5">
              <span className="w-0.5 h-1.5 bg-slate-950 rounded-full animate-pulse" />
              <span className="w-0.5 h-2 bg-slate-950 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-1 bg-slate-950 rounded-full animate-pulse delay-150" />
            </span>
          ) : (
            <Music2 className="w-2.5 h-2.5" />
          )}
        </span>
      )}
    </motion.button>
  );
};
