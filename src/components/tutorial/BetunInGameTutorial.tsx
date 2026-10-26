import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects, playBetunVoice, stopBetunVoice } from '../../utils/audio';
import { MathView } from '../common/MathView';
import { addCoins } from '../../utils/economy';
import confetti from 'canvas-confetti';
import {
  Volume2,
  Sparkles,
  ChevronRight,
  Check,
  X,
  Coins,
  ArrowRight,
  ShieldAlert,
  Flame,
  Award,
} from 'lucide-react';
import ninoBetunAsset from '../../assets/avatars/nino_betun.jpg';
import jesusAlCuadradoAsset from '../../assets/avatars/jesus_al_cuadrado.jpg';
import sixsevenaldoAsset from '../../assets/avatars/sixsevenaldo.jpg';

export const TUTORIAL_STORAGE_KEY = 'algebra_uno_has_seen_tutorial';

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markTutorialAsSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  } catch {
    // Ignorar si el almacenamiento está restringido
  }
}

interface BetunInGameTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialCard {
  id: string;
  color: 'red' | 'green' | 'blue' | 'yellow' | 'wild';
  variable: string;
  value: number | string;
  latex: string;
  solutionLatex?: string;
  isAction?: boolean;
  actionName?: string;
}

/**
 * Componente que renderiza texto animado letra por letra (animación de barrido / máquina de escribir)
 * sincronizado con la reproducción del audio MP3 de Betún.
 */
const TypewriterSweep: React.FC<{
  text: string;
  progress: number;
  className?: string;
  onCompleteNode?: React.ReactNode;
}> = ({ text, progress, className = '', onCompleteNode }) => {
  const isDone = progress >= 1;
  const count = isDone ? text.length : Math.max(0, Math.floor(progress * text.length));
  const visible = text.slice(0, count);

  if (isDone && onCompleteNode) {
    return <div className={className}>{onCompleteNode}</div>;
  }

  return (
    <div className={className}>
      <span>{visible}</span>
      {!isDone && (
        <span className="inline-block w-1.5 h-3.5 bg-amber-400 ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
};

export const BetunInGameTutorial: React.FC<BetunInGameTutorialProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(0);

  // Animación de barrido de texto letra por letra sincronizada con el MP3 de Betún
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados interactivos dentro de la mesa simulada
  const [playedFirstCard, setPlayedFirstCard] = useState(false);
  const [playedSecondCard, setPlayedSecondCard] = useState(false);
  const [hasCalledUno, setHasCalledUno] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);

  // Cartas de la mesa de tutorial
  const [discardTopCard, setDiscardTopCard] = useState<TutorialCard>({
    id: 'table_initial',
    color: 'red',
    variable: 'Z',
    value: 2,
    latex: 'Z - 2 = 0',
    solutionLatex: 'Z = 2',
  });

  const [activeColor, setActiveColor] = useState<'red' | 'green' | 'blue' | 'yellow'>('red');

  // Función para reproducir el MP3 nino.mp3 y sincronizar el barrido letra por letra
  const startVoiceForStep = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    stopBetunVoice();
    setAudioProgress(0);
    setIsAudioSpeaking(true);

    const audio = playBetunVoice(() => {
      setAudioProgress(1);
      setIsAudioSpeaking(false);
    });

    if (audio) {
      const updateProgress = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          const p = Math.min(1, audio.currentTime / audio.duration);
          setAudioProgress(p);
          if (p < 1 && !audio.paused && !audio.ended) {
            animFrameRef.current = requestAnimationFrame(updateProgress);
          } else {
            setAudioProgress(1);
            setIsAudioSpeaking(false);
          }
        } else {
          animFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };
      animFrameRef.current = requestAnimationFrame(updateProgress);

      // Temporizador de respaldo por si el audio termina antes o no dispara onended
      fallbackTimerRef.current = setTimeout(() => {
        setAudioProgress(1);
        setIsAudioSpeaking(false);
      }, 3500);
    } else {
      // Si el navegador bloquea audio o no hay contexto, simular el barrido (~2.4s)
      const startT = Date.now();
      const dur = 2400;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startT;
        const p = Math.min(1, elapsed / dur);
        setAudioProgress(p);
        if (p >= 1) {
          clearInterval(interval);
          setIsAudioSpeaking(false);
        }
      }, 30);
    }
  }, []);

  // Al hacer clic sobre el texto se completa de inmediato el barrido
  const handleFastForwardText = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioProgress(1);
    setIsAudioSpeaking(false);
  }, []);

  // Reproducir voz de Betún y activar animación de barrido cada vez que se abre o avanza de paso
  useEffect(() => {
    if (isOpen) {
      startVoiceForStep();
    } else {
      stopBetunVoice();
      setIsAudioSpeaking(false);
      setAudioProgress(1);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [isOpen, step, startVoiceForStep]);

  // Acreditar 100 monedas garantizadas al llegar al paso 7 de graduación
  useEffect(() => {
    if (isOpen && step === 7 && !hasClaimedReward) {
      addCoins(100);
      setHasClaimedReward(true);
      try {
        window.dispatchEvent(new Event('economy_updated'));
      } catch {
        // Ignorar
      }
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, step, hasClaimedReward]);

  // Resetear estados al abrir el tutorial
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setPlayedFirstCard(false);
      setPlayedSecondCard(false);
      setHasCalledUno(false);
      setHasClaimedReward(false);
      setDiscardTopCard({
        id: 'table_initial',
        color: 'red',
        variable: 'Z',
        value: 2,
        latex: 'Z - 2 = 0',
        solutionLatex: 'Z = 2',
      });
      setActiveColor('red');
    }
  }, [isOpen]);

  const handleNextStep = useCallback(() => {
    soundEffects.calculatorClick();
    setStep((prev) => Math.min(prev + 1, 7));
  }, []);

  const handleFinishTutorial = useCallback(() => {
    markTutorialAsSeen();
    if (!hasClaimedReward) {
      addCoins(100);
      setHasClaimedReward(true);
      try {
        window.dispatchEvent(new Event('economy_updated'));
      } catch {
        // Ignorar
      }
    }
    stopBetunVoice();
    onClose();
  }, [hasClaimedReward, onClose]);

  // Manejador del primer ejemplo interactivo (Mismo color: Red Z)
  const handlePlayFirstCard = (cardId: string) => {
    if (cardId !== 'player_c1') return; // Solo la carta roja válida
    soundEffects.playCard();
    setPlayedFirstCard(true);
    setDiscardTopCard({
      id: 'player_c1',
      color: 'red',
      variable: 'Z',
      value: 2,
      latex: 'Z + 3 = 5',
      solutionLatex: 'Z = 2',
    });
    // Preparar la mesa para el siguiente paso (un rival lanza una carta azul de valor 2)
    setTimeout(() => {
      soundEffects.playCard();
      setDiscardTopCard({
        id: 'rival_c_blue',
        color: 'blue',
        variable: 'F',
        value: 2,
        latex: 'n - 2 = 0',
        solutionLatex: 'n = 2',
      });
      setActiveColor('blue');
      handleNextStep();
    }, 900);
  };

  // Manejador del segundo ejemplo interactivo (Cambio de variable: 3N = 6 sobre n - 2 = 0)
  const handlePlaySecondCard = (cardId: string) => {
    if (cardId !== 'player_c3') return; // Solo 3N = 6
    soundEffects.playCard();
    setPlayedSecondCard(true);
    setDiscardTopCard({
      id: 'player_c3',
      color: 'yellow',
      variable: 'N',
      value: 2,
      latex: '3N = 6',
      solutionLatex: 'N = 2',
    });
    setActiveColor('yellow');
    setTimeout(() => {
      handleNextStep();
    }, 1000);
  };

  // Manejador para Cantar UNO
  const handleCallUnoInteractive = () => {
    soundEffects.unoCall();
    setHasCalledUno(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    setTimeout(() => {
      handleNextStep();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none p-0 sm:p-4 overflow-y-auto overflow-x-hidden">
        {/* ========================================================
            MESA DE JUEGO VERDE TÁCTICA DE ÁLGEBRA UNO
        ======================================================== */}
        <div className="w-full h-full max-h-[100dvh] sm:max-h-[95vh] max-w-6xl rounded-none sm:rounded-3xl bg-gradient-to-b from-[#0a2718] via-[#0d3b24] to-[#071f13] border-0 sm:border-4 border-[#2b593f]/80 relative shadow-[0_0_120px_rgba(16,185,129,0.2)] flex flex-col justify-between overflow-y-auto sm:overflow-hidden">
          
          {/* Textura y cuadrícula táctica de mesa */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-black/60 pointer-events-none" />

          {/* BARRA SUPERIOR DEL TUTORIAL */}
          <div className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 flex items-center justify-between border-b border-emerald-500/20 bg-black/40 backdrop-blur-md relative z-20 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs shadow-md">
                TUTORIAL • ÁLGEBRA UNO
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-200">
                Paso {step + 1} de 8
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => startVoiceForStep()}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-yellow-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Volver a escuchar la voz de Betún y reiniciar barrido"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Escuchar Voz</span>
              </button>

              <button
                type="button"
                onClick={handleFinishTutorial}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-rose-900/50 border border-white/10 hover:border-rose-500 text-slate-300 hover:text-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Saltar</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              ZONA SUPERIOR: RIVALES SIMULADOS DE LA PARTIDA (Jesús al Cuadrado y sixsevenaldo)
          ======================================================== */}
          <div className="flex justify-center gap-2 sm:gap-14 items-center px-2 sm:px-4 pt-1 sm:pt-2 relative z-10 opacity-80 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-black/50 border border-white/10 shadow-md">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border sm:border-2 border-emerald-400 shrink-0">
                <img src={jesusAlCuadradoAsset} alt="Jesús al Cuadrado" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="text-[10px] sm:text-[11px] font-bold text-white">Jesús al Cuadrado</div>
                <div className="text-[8px] sm:text-[9px] text-emerald-300 font-mono">4 cartas</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-black/50 border border-white/10 shadow-md">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border sm:border-2 border-amber-400 shrink-0">
                <img src={sixsevenaldoAsset} alt="sixsevenaldo" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="text-[10px] sm:text-[11px] font-bold text-white">sixsevenaldo</div>
                <div className="text-[8px] sm:text-[9px] text-yellow-300 font-mono">3 cartas</div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ZONA CENTRAL: PILA DE DESCARTE Y MAZO (CENTRO DE LA MESA)
          ======================================================== */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-12 px-2 sm:px-4 relative z-10 py-1 sm:py-2 shrink-0">
            
            {/* Pila de Descarte Central */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300/80 mb-0.5 sm:mb-1 tracking-wider text-center">
                <span className="sm:hidden">Descarte ({activeColor.toUpperCase()})</span>
                <span className="hidden sm:inline">Mesa de Descarte (Color Activo: {activeColor.toUpperCase()})</span>
              </span>

              <motion.div
                key={discardTopCard.id}
                initial={{ scale: 0.8, rotate: -5, y: -20 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className={`w-20 h-28 sm:w-32 sm:h-44 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between border sm:border-2 shadow-2xl relative select-none shrink-0 ${
                  discardTopCard.color === 'red'
                    ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-950 border-red-300 shadow-red-500/40 text-white'
                    : discardTopCard.color === 'blue'
                    ? 'bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-950 border-blue-300 shadow-blue-500/40 text-white'
                    : discardTopCard.color === 'yellow'
                    ? 'bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-950 border-yellow-200 shadow-yellow-500/40 text-slate-950'
                    : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 border-emerald-300 shadow-emerald-500/40 text-white'
                }`}
              >
                <div className="flex justify-between items-start font-black text-[9px] sm:text-xs">
                  <span>{discardTopCard.variable}</span>
                  <span>{discardTopCard.value}</span>
                </div>

                <div className="text-center font-bold">
                  <div className="text-xs sm:text-lg font-mono">
                    <MathView math={discardTopCard.latex} />
                  </div>
                  {discardTopCard.solutionLatex && (
                    <div className="text-[8px] sm:text-[10px] opacity-90 font-mono mt-0.5 sm:mt-1">
                      {discardTopCard.solutionLatex}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end font-black text-[9px] sm:text-xs rotate-180">
                  <span>{discardTopCard.variable}</span>
                  <span>{discardTopCard.value}</span>
                </div>
              </motion.div>
            </div>

            {/* Mazo para Robar */}
            <div className="flex flex-col items-center opacity-85">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300/80 mb-0.5 sm:mb-1 tracking-wider text-center">
                Baraja Central
              </span>
              <div className="w-18 h-26 sm:w-28 sm:h-40 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border sm:border-2 border-amber-400/60 p-1.5 sm:p-2 flex items-center justify-center shadow-xl relative cursor-not-allowed shrink-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-yellow-300 font-black text-[10px] sm:text-xs rotate-12">
                  UNO
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              BETÚN FLOTANTE (TUTOR OFICIAL) + GLOBO DE DIÁLOGO
          ======================================================== */}
          <div className="relative z-30 px-2 sm:px-6 my-auto sm:my-0">
            <div className="max-w-3xl mx-auto flex flex-row items-start sm:items-end gap-2 sm:gap-4 mb-1 sm:mb-2">
              
              {/* Carta de Betún (Animación flotante con vibración al hablar) */}
              <motion.div
                animate={{
                  y: isAudioSpeaking ? [0, -6, 0] : [0, -3, 0],
                  rotate: isAudioSpeaking ? [-2, 2, -2] : [-1, 1, -1],
                  scale: isAudioSpeaking ? [1, 1.03, 1] : 1,
                }}
                transition={{
                  repeat: Infinity,
                  duration: isAudioSpeaking ? 0.6 : 3.2,
                  ease: 'easeInOut',
                }}
                className="w-16 h-22 sm:w-24 sm:h-32 rounded-xl sm:rounded-2xl bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 p-0.5 sm:p-1 border sm:border-2 border-yellow-200 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex-shrink-0 relative overflow-hidden"
              >
                <div className="w-full h-full rounded-lg sm:rounded-xl bg-slate-950 overflow-hidden flex flex-col items-center justify-between p-1">
                  <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-300">
                    TUTOR
                  </div>
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border border-amber-400/50 shadow-inner">
                    <img src={ninoBetunAsset} alt="Niño Betún Tutor" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-bold text-amber-200 flex items-center gap-0.5 sm:gap-1">
                    {isAudioSpeaking && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                    <span>{isAudioSpeaking ? 'HABLANDO' : 'BETÚN'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Globo de Diálogo de Betún (Animación de barrido letra por letra) */}
              <div
                onClick={handleFastForwardText}
                className="flex-1 min-w-0 bg-slate-950/95 border sm:border-2 border-amber-400 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-[0_0_25px_rgba(251,191,36,0.25)] text-slate-100 relative cursor-pointer max-h-[42vh] sm:max-h-none overflow-y-auto"
                title="Toca para mostrar todo el texto de inmediato"
              >
                {/* Flecha apuntando a Betún */}
                <div className="absolute -left-2 top-5 sm:bottom-8 sm:top-auto w-0 h-0 border-t-4 sm:border-t-8 border-t-transparent border-b-4 sm:border-b-8 border-b-transparent border-r-4 sm:border-r-8 border-r-amber-400" />

                {/* Paso 0: Bienvenida a la mesa */}
                {step === 0 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300 flex items-center gap-1.5">
                      <span>¡Epa! Soy Betún. Bienvenido a tu mesa de Álgebra UNO.</span>
                    </h3>
                    <TypewriterSweep
                      text="A diferencia del UNO normal donde solo juegas por color y números fijos, aquí en Álgebra UNO juegas en una mesa en vivo donde cada carta tiene una ecuación matemática viva. Tu objetivo clásico se mantiene: ¡ser el primero en vaciar tu mano y cantar ¡UNO!!"
                      progress={audioProgress}
                      className="text-[11px] sm:text-sm text-slate-200 leading-snug sm:leading-relaxed"
                      onCompleteNode={
                        <p className="text-[11px] sm:text-sm text-slate-200 leading-snug sm:leading-relaxed">
                          A diferencia del <strong>UNO normal</strong> donde solo juegas por color y números fijos, aquí en <strong>Álgebra UNO</strong> juegas en una mesa en vivo donde cada carta tiene una <strong>ecuación matemática viva</strong>. Tu objetivo clásico se mantiene: <strong>¡ser el primero en vaciar tu mano y cantar ¡UNO!!</strong>
                        </p>
                      }
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer transition active:scale-95"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 1: Las 4 Familias y Variables */}
                {step === 1 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300">
                      Las 4 Familias Matemáticas (Diferencia con el UNO Normal)
                    </h3>
                    <TypewriterSweep
                      text="En el UNO tradicional hay 4 colores básicos con números del 0 al 9. En Álgebra UNO, cada color representa una familia matemática con su propia incógnita algebraica:"
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <p className="text-[11px] sm:text-xs text-slate-200">
                          En el <strong>UNO tradicional</strong> hay 4 colores básicos con números simples. En <strong>Álgebra UNO</strong>, cada color representa una familia matemática con su propia incógnita algebraica:
                        </p>
                      }
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-center">
                        🔴 ROJO = Variable <strong className="text-white text-[11px] sm:text-xs">Z</strong>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-center">
                        🟢 VERDE = Variable <strong className="text-white text-[11px] sm:text-xs">Y</strong>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-950/80 border border-blue-500 text-blue-200 text-center">
                        🔵 AZUL = Variable <strong className="text-white text-[11px] sm:text-xs">F</strong>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 text-center">
                        🟡 AMARILLO = Variable <strong className="text-white text-[11px] sm:text-xs">N</strong>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-amber-300/90 font-medium">
                      🌈 ¡Y las cartas de Comodín usan la variable universal <strong className="text-white">x</strong>!
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer transition active:scale-95"
                      >
                        <span>Ver Ejemplo de Jugada</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 2: Ejemplo Interactivo 1 (Mismo Color) */}
                {step === 2 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                      <span>Ejemplo 1: Jugada por Misma Familia de Color</span>
                    </h3>
                    <TypewriterSweep
                      text={
                        playedFirstCard
                          ? "¡Excelente jugada! Lanzaste tu carta roja. Al igual que en el UNO tradicional, coincide por familia de color."
                          : "En el centro de la mesa hay una carta ROJA (Z - 2 = 0). Como en el UNO normal, puedes tirar una carta de tu mano del mismo color. ¡Toca tu carta roja abajo para jugarla!"
                      }
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <p className="text-[11px] sm:text-xs text-slate-200">
                          En el centro de la mesa hay una carta <strong>ROJA</strong> (<MathView math="Z - 2 = 0 \implies Z = 2" />).
                          {playedFirstCard ? (
                            <span className="text-emerald-300 font-bold ml-1">
                              ¡Excelente! Lanzaste tu carta roja. Al igual que en el UNO tradicional, coincide por familia de color.
                            </span>
                          ) : (
                            <span className="text-amber-200 font-bold ml-1">
                              ¡Toca la carta roja de tu mano abajo para jugarla a la mesa!
                            </span>
                          )}
                        </p>
                      }
                    />
                    {playedFirstCard ? (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <span>Siguiente Ejemplo</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold animate-pulse">
                          👉 Toca la carta roja abajo
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePlayFirstCard('player_c1')}
                          className="px-2.5 py-1 sm:hidden rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold"
                        >
                          Jugar por mí
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 3: Ejemplo Interactivo 2 (Cambio de variable por mismo valor) */}
                {step === 3 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 animate-bounce" />
                      <span>¡La Regla Estrella: Cambio de Variable por Mismo Valor!</span>
                    </h3>
                    <TypewriterSweep
                      text={
                        playedSecondCard
                          ? "¡Brillante! Cambiaste el color a Amarillo porque ambas ecuaciones daban 2. En el análisis final esto cuenta como una Buena Jugada."
                          : "¡Esta es la gran diferencia con el UNO normal! El rival lanzó una carta Azul con resultado 2. Tú tienes una Amarilla (3N = 6) que también da 2. ¡Como ambas dan 2, puedes cambiar de color sin comodín! Toca 3N = 6 para jugarla."
                      }
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <div className="space-y-1">
                          <p className="text-[11px] sm:text-xs text-slate-200">
                            ¡Atento a esto! El rival acaba de lanzar una carta Azul: <strong className="text-blue-300"><MathView math="n - 2 = 0 \implies n = 2" /></strong>.
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-200">
                            En tu mano tienes una carta Amarilla: <strong className="text-yellow-300"><MathView math="3N = 6 \implies N = 2" /></strong>.
                            {playedSecondCard ? (
                              <span className="text-emerald-300 font-bold block mt-1">
                                ¡Brillante! Cambiaste el color a Amarillo porque ambas ecuaciones daban 2. En el análisis de partida esto cuenta como una <strong className="text-yellow-300">Buena Jugada</strong>.
                              </span>
                            ) : (
                              <span className="text-yellow-300 font-bold block mt-1">
                                ¡A diferencia del UNO normal, no requieres comodín! Como ambas ecuaciones dan 2, ¡toca tu carta 3N = 6 abajo para cambiar el color a Amarillo!
                              </span>
                            )}
                          </p>
                        </div>
                      }
                    />
                    {playedSecondCard ? (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver Cartas Especiales</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold animate-pulse">
                          👉 Toca la carta 3N=6 abajo
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePlaySecondCard('player_c3')}
                          className="px-2.5 py-1 sm:hidden rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold"
                        >
                          Jugar por mí
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 4: Cartas de Acción y Estrategia */}
                {step === 4 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300">
                      Cartas Especiales y Reglas Tácticas
                    </h3>
                    <TypewriterSweep
                      text="A diferencia del UNO convencional, las cartas de acción se basan en propiedades algebraicas reales:"
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <p className="text-[11px] sm:text-xs text-slate-200">
                          A diferencia del <strong>UNO convencional</strong>, las cartas de acción se basan en propiedades algebraicas reales:
                        </p>
                      }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 border border-white/10">
                        <div className="font-black text-rose-300 text-[10px] sm:text-xs">🚫 Bloqueo (k / 0)</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-300 mt-0.5 sm:mt-1">
                          División entre cero: salta el turno del siguiente jugador.
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 border border-white/10">
                        <div className="font-black text-cyan-300 text-[10px] sm:text-xs">🔄 Reversa (× -1)</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-300 mt-0.5 sm:mt-1">
                          Multiplicar por -1: invierte la dirección de la ronda.
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 border border-white/10">
                        <div className="font-black text-amber-300 text-[10px] sm:text-xs">⚡ +2 y +4 Acumulativo</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-300 mt-0.5 sm:mt-1">
                          ¡Si te tiran +2, responde con otro +2 para acumular 4 cartas!
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <span>Regla de Cantar UNO</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 5: Cantar ¡UNO! (Interactivo) */}
                {step === 5 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                      <span>¡Regla Clásica: Cantar UNO!</span>
                    </h3>
                    <TypewriterSweep
                      text={
                        hasCalledUno
                          ? "¡Excelente! Cantaste UNO a tiempo. Ahora ningún rival podrá atraparte."
                          : "Igual que en las reglas del UNO clásico: cuando te quede 1 sola carta en la mano, ¡es OBLIGATORIO cantar UNO de inmediato! Si te atrapan, robarás 2 cartas de penalización."
                      }
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <div className="space-y-1">
                          <p className="text-[11px] sm:text-xs text-slate-200">
                            Igual que en el <strong>UNO clásico</strong>: cuando te quede <strong>1 sola carta</strong> en la mano, ¡es OBLIGATORIO presionar el botón <strong>¡CANTAR UNO!</strong>!
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-200">
                            Si lanzas tu penúltima carta y no cantas UNO, cualquier rival te atrapará y robarás <strong>2 cartas de penalización</strong>.
                          </p>
                        </div>
                      }
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold">
                        {hasCalledUno ? '✅ ¡CANTADO CON ÉXITO!' : '👉 Presiona el botón amarillo brillante abajo:'}
                      </span>
                      {hasCalledUno ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCallUnoInteractive}
                          className="px-2.5 py-1 sm:hidden rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold"
                        >
                          Cantar por mí
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Paso 6: Modo con Ayuda vs Modo Sin Ayuda */}
                {step === 6 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-base font-black text-yellow-300">
                      Modo Con Ayuda vs Modo Sin Ayuda
                    </h3>
                    <TypewriterSweep
                      text="En Álgebra UNO tú decides el nivel de dificultad antes de jugar cada partida en las salas:"
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <p className="text-[11px] sm:text-xs text-slate-200">
                          En <strong>Álgebra UNO</strong> tú decides el nivel de dificultad antes de jugar cada partida:
                        </p>
                      }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                      <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-950/60 border border-emerald-500/40">
                        <div className="font-bold text-emerald-300 flex items-center gap-1 text-[10px] sm:text-xs">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Modo Con Ayuda (Casual)</span>
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-slate-300 mt-0.5 sm:mt-1">
                          Muestra soluciones y resalta cartas válidas. Ideal para aprender.
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-950/60 border border-rose-500/40">
                        <div className="font-bold text-rose-300 flex items-center gap-1 text-[10px] sm:text-xs">
                          <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Modo Sin Ayuda (Ranked)</span>
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-slate-300 mt-0.5 sm:mt-1">
                          Calculas mentalmente. ¡Si fallas te penalizan con <strong>2 cartas</strong>!
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <span>Finalizar Tutorial</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 7: Victoria y Recompensa de 100 Monedas Garantizadas */}
                {step === 7 && (
                  <div className="space-y-1.5 sm:space-y-2 text-center py-1">
                    <h3 className="text-sm sm:text-lg font-black text-yellow-300 flex items-center justify-center gap-1.5 sm:gap-2">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-spin" />
                      <span>¡Graduado de Álgebra UNO con Betún!</span>
                    </h3>
                    <TypewriterSweep
                      text="¡Felicitaciones! Has completado el tutorial oficial de Álgebra UNO. Ya dominas las familias de variables, los cambios por mismo valor y la emoción del UNO. ¡Disfruta tus 100 monedas de bienvenida!"
                      progress={audioProgress}
                      className="text-[11px] sm:text-xs text-slate-200"
                      onCompleteNode={
                        <p className="text-[11px] sm:text-xs text-slate-200">
                          Ya conoces las familias de variables, los cambios por mismo valor y las reglas tácticas del juego.
                        </p>
                      }
                    />
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-400/20 border border-amber-400 text-yellow-300 text-xs sm:text-sm font-black shadow-lg">
                      <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-bounce" />
                      <span>¡Has recibido 100 Monedas Acreditadas a tu Saldo!</span>
                    </div>
                    <div className="pt-1 sm:pt-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleFinishTutorial}
                        className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>¡Empezar a Jugar en las Salas!</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================
              ZONA INFERIOR: MANO DEL JUGADOR INTERACTIVA
          ======================================================== */}
          <div className="w-full bg-black/75 border-t sm:border-t-2 border-emerald-500/30 px-2 sm:px-3 py-1.5 sm:py-3 rounded-b-none sm:rounded-b-3xl relative z-20 backdrop-blur-md shrink-0">
            
            {/* Botón flotante para Cantar UNO (Aparece en el Paso 5) */}
            {step === 5 && !hasCalledUno && (
              <motion.div
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: [1, 1.08, 1], y: 0 }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex justify-center mb-1 sm:mb-2"
              >
                <button
                  type="button"
                  onClick={handleCallUnoInteractive}
                  className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-slate-950 font-black text-xs sm:text-base border border-yellow-200 sm:border-2 shadow-[0_0_30px_rgba(251,191,36,0.8)] cursor-pointer active:scale-95 flex items-center gap-1.5 sm:gap-2"
                >
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 animate-pulse" />
                  <span>¡CANTAR UNO!</span>
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 animate-pulse" />
                </button>
              </motion.div>
            )}

            <div className="flex items-center justify-center gap-1.5 sm:gap-3 overflow-x-auto py-1 max-w-full">
              
              {/* Carta 1: Roja Z+3=5 (Se juega en Paso 2) */}
              {!playedFirstCard && (
                <div className="relative shrink-0">
                  {step === 2 && (
                    <motion.div
                      animate={{ y: [-4, 0, -4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[8px] sm:text-[9px] shadow-lg whitespace-nowrap z-30"
                    >
                      👇 ¡Toca aquí!
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ y: -6, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handlePlayFirstCard('player_c1')}
                    className={`w-16 h-22 sm:w-24 sm:h-34 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between border sm:border-2 select-none cursor-pointer transition ${
                      step === 2
                        ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-950 border-yellow-300 ring-2 sm:ring-4 ring-yellow-400/60 shadow-[0_0_20px_rgba(239,68,68,0.7)] text-white'
                        : 'bg-gradient-to-br from-red-700 to-red-950 border-red-400/50 text-white opacity-80'
                    }`}
                  >
                    <div className="flex justify-between font-black text-[9px] sm:text-[10px]">
                      <span>Z</span>
                      <span>2</span>
                    </div>
                    <div className="text-center font-bold font-mono text-[10px] sm:text-xs">
                      <MathView math="Z+3=5" />
                      <div className="text-[8px] sm:text-[9px] opacity-80">Z = 2</div>
                    </div>
                    <div className="flex justify-between font-black text-[9px] sm:text-[10px] rotate-180">
                      <span>Z</span>
                      <span>2</span>
                    </div>
                  </motion.button>
                </div>
              )}

              {/* Carta 2: Azul 2F=8 */}
              <motion.div
                className="w-16 h-22 sm:w-24 sm:h-34 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between border sm:border-2 bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-950 border-blue-400/40 text-white opacity-60 select-none shrink-0"
              >
                <div className="flex justify-between font-black text-[9px] sm:text-[10px]">
                  <span>F</span>
                  <span>4</span>
                </div>
                <div className="text-center font-bold font-mono text-[10px] sm:text-xs">
                  <MathView math="2F=8" />
                  <div className="text-[8px] sm:text-[9px] opacity-80">F = 4</div>
                </div>
                <div className="flex justify-between font-black text-[9px] sm:text-[10px] rotate-180">
                  <span>F</span>
                  <span>4</span>
                </div>
              </motion.div>

              {/* Carta 3: Amarilla 3N=6 (Se juega en Paso 3) */}
              {!playedSecondCard && (
                <div className="relative shrink-0">
                  {step === 3 && (
                    <motion.div
                      animate={{ y: [-4, 0, -4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[8px] sm:text-[9px] shadow-lg whitespace-nowrap z-30"
                    >
                      👇 ¡Cambia a Amarillo!
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ y: -6, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handlePlaySecondCard('player_c3')}
                    className={`w-16 h-22 sm:w-24 sm:h-34 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between border sm:border-2 select-none cursor-pointer transition ${
                      step === 3
                        ? 'bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-950 border-yellow-200 ring-2 sm:ring-4 ring-yellow-400/60 shadow-[0_0_20px_rgba(245,158,11,0.8)] text-slate-950'
                        : 'bg-gradient-to-br from-yellow-600 to-yellow-950 border-yellow-400/50 text-slate-950 opacity-80'
                    }`}
                  >
                    <div className="flex justify-between font-black text-[9px] sm:text-[10px]">
                      <span>N</span>
                      <span>2</span>
                    </div>
                    <div className="text-center font-bold font-mono text-[10px] sm:text-xs">
                      <MathView math="3N=6" />
                      <div className="text-[8px] sm:text-[9px] font-black">N = 2</div>
                    </div>
                    <div className="flex justify-between font-black text-[9px] sm:text-[10px] rotate-180">
                      <span>N</span>
                      <span>2</span>
                    </div>
                  </motion.button>
                </div>
              )}

              {/* Carta 4: Verde Y+5=10 */}
              <motion.div
                className="w-16 h-22 sm:w-24 sm:h-34 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between border sm:border-2 bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-950 border-emerald-400/40 text-white opacity-60 select-none shrink-0"
              >
                <div className="flex justify-between font-black text-[9px] sm:text-[10px]">
                  <span>Y</span>
                  <span>5</span>
                </div>
                <div className="text-center font-bold font-mono text-[10px] sm:text-xs">
                  <MathView math="Y+5=10" />
                  <div className="text-[8px] sm:text-[9px] opacity-80">Y = 5</div>
                </div>
                <div className="flex justify-between font-black text-[9px] sm:text-[10px] rotate-180">
                  <span>Y</span>
                  <span>5</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
