import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  Sparkles,
  ArrowRight,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { MatchAnalysisReport, AnalyzedMove } from '../../utils/gameAnalysis';
import { MathView } from '../common/MathView';
import { soundEffects } from '../../utils/audio';

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MatchAnalysisReport;
  onOpenQuiz?: () => void;
  onOpenPodium?: () => void;
  hasCompletedQuiz?: boolean;
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onOpenQuiz,
  onOpenPodium,
  hasCompletedQuiz = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'good' | 'bad'>('all');
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(0);

  const filteredMoves = useMemo(() => {
    if (filter === 'good') {
      return report.moves.filter((m) => m.rating === 'good' || m.rating === 'brilliant');
    }
    if (filter === 'bad') {
      return report.moves.filter((m) => m.rating === 'blunder' || m.rating === 'inaccuracy');
    }
    return report.moves;
  }, [report.moves, filter]);

  const currentMove: AnalyzedMove | undefined = filteredMoves[selectedMoveIndex] || filteredMoves[0];
  const isGood = currentMove && (currentMove.rating === 'good' || currentMove.rating === 'brilliant');

  const handleNext = () => {
    soundEffects.calculatorClick();
    if (selectedMoveIndex < filteredMoves.length - 1) {
      setSelectedMoveIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    soundEffects.calculatorClick();
    if (selectedMoveIndex > 0) {
      setSelectedMoveIndex((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-2xl rounded-3xl bg-slate-950 border-2 border-slate-700/80 p-5 sm:p-6 shadow-[0_0_80px_rgba(30,41,59,0.8)] text-slate-100 relative overflow-hidden"
        >
          {/* Luces y ambientación elegante */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Encabezado */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Revisión de Partida</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold border border-amber-400/30">
                    Análisis Táctico
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Evaluación de cambios de variable por mismo valor y errores de cálculo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Métricas Generales (Precisión circular + Buenas / Malas) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 relative z-10">
            {/* Precisión Circular */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center gap-3 shadow-md">
              <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400"
                    strokeDasharray={`${report.accuracy}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black text-emerald-300">{report.accuracy}%</span>
              </div>
              <div>
                <div className="text-xs font-black text-white">Precisión</div>
                <div className="text-[10px] text-slate-400">Rendimiento táctico</div>
              </div>
            </div>

            {/* Buenas Jugadas */}
            <button
              type="button"
              onClick={() => {
                setFilter('good');
                setSelectedMoveIndex(0);
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                filter === 'good'
                  ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40'
                  : 'bg-slate-900/80 border-emerald-500/30 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-emerald-300">🟢 {report.goodCount}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400/80">Aciertos</span>
              </div>
              <div className="text-xs font-bold text-white mt-0.5">Buenas Jugadas</div>
              <div className="text-[10px] text-slate-400">Cambios de variable por mismo valor</div>
            </button>

            {/* Malas Jugadas */}
            <button
              type="button"
              onClick={() => {
                setFilter('bad');
                setSelectedMoveIndex(0);
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                filter === 'bad'
                  ? 'bg-rose-950/80 border-rose-400 ring-2 ring-rose-400/40'
                  : 'bg-slate-900/80 border-rose-500/30 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-rose-300">🔴 {report.badCount}</span>
                <span className="text-[10px] uppercase font-bold text-rose-400/80">Errores</span>
              </div>
              <div className="text-xs font-bold text-white mt-0.5">Malas Jugadas</div>
              <div className="text-[10px] text-slate-400">Cálculos erróneos o cambios perdidos</div>
            </button>
          </div>

          {/* Pestañas de filtrado de jugadas */}
          <div className="flex items-center gap-1.5 mb-3 relative z-10">
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setSelectedMoveIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              Todas ({report.moves.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('good');
                setSelectedMoveIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'good'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              🟢 Buenas Jugadas ({report.goodCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('bad');
                setSelectedMoveIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'bad'
                  ? 'bg-rose-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              🔴 Malas Jugadas ({report.badCount})
            </button>
          </div>

          {/* Visor paso a paso de Jugadas */}
          {filteredMoves.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-white/10">
              No hay jugadas registradas en esta categoría para esta partida.
            </div>
          ) : currentMove ? (
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 relative z-10">
              {/* Encabezado de la jugada */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
                      isGood
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500 text-rose-300'
                    }`}
                  >
                    <span>{isGood ? '🟢 BUENA JUGADA' : '🔴 MALA JUGADA'}</span>
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[280px]">
                    {currentMove.title}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedMoveIndex + 1} de {filteredMoves.length}
                </span>
              </div>

              {/* Explicación táctica de la jugada */}
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5">
                {currentMove.description}
              </p>

              {/* Comparación visual de Cartas y Ecuaciones con KaTeX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Carta en la mesa */}
                {currentMove.topCard && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Carta en la Mesa:
                    </span>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white">
                        {currentMove.topCard.variable} ({currentMove.topCard.color.toUpperCase()})
                      </span>
                      {currentMove.topCard.value !== undefined && (
                        <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                          Solución: {currentMove.topCard.value}
                        </span>
                      )}
                    </div>
                    {currentMove.topCard.expressionLatex && (
                      <div className="text-[12px] text-white font-mono bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <MathView math={currentMove.topCard.expressionLatex} />
                      </div>
                    )}
                  </div>
                )}

                {/* Tu jugada o la carta de oportunidad perdida */}
                {(currentMove.cardPlayed || currentMove.missedCard) && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {currentMove.actionType === 'blunder_play'
                        ? 'Tu Carta Errónea (Penalizada con +2):'
                        : currentMove.missedCard
                        ? 'Carta que Tenías en Mano para Cambiar:'
                        : 'Tu Carta Jugada (Cambio Exitoso):'}
                    </span>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white">
                        {(currentMove.cardPlayed || currentMove.missedCard)?.variable} (
                        {(currentMove.cardPlayed || currentMove.missedCard)?.color.toUpperCase()})
                      </span>
                      {(currentMove.cardPlayed || currentMove.missedCard)?.value !== undefined && (
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            isGood ? 'text-emerald-300 bg-emerald-400/10' : 'text-rose-300 bg-rose-400/10'
                          }`}
                        >
                          Solución: {(currentMove.cardPlayed || currentMove.missedCard)?.value}
                        </span>
                      )}
                    </div>
                    {currentMove.equationLatex && (
                      <div className="text-[12px] text-white font-mono bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <MathView math={currentMove.equationLatex} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Solución didáctica de la ecuación paso a paso */}
              {currentMove.explanationLatex && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                  <span className="font-bold text-amber-300 block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Resolución matemática paso a paso:</span>
                  </span>
                  <div className="font-mono text-[12px] text-white bg-black/40 p-2 rounded-lg">
                    <MathView math={currentMove.explanationLatex} />
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Barra inferior: Navegación de jugadas, Volver al Podio y botón de Prueba */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 mt-4 border-t border-white/10 relative z-10">
            {/* Navegación anterior / siguiente */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrev}
                disabled={selectedMoveIndex === 0}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedMoveIndex >= filteredMoves.length - 1}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Acciones de Navegación: Volver al Podio y Prueba */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onOpenPodium || onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Volver al Podio</span>
              </button>

              {onOpenQuiz && (
                !hasCompletedQuiz ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onOpenQuiz}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Ir a la Prueba</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-400/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 opacity-80 cursor-default">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Prueba Realizada ✅</span>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
