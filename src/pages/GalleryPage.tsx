import { useState, useMemo } from 'react';
import { generateFullDeck } from '../engine/deckGenerator';
import { Card as CardType, CardColor, CardType as TypeOfCard } from '../types/card';
import { Card } from '../components/card/Card';
import { CardZoomModal } from '../components/card/CardZoomModal';
import { Filter, Eye, Sparkles, BookOpen } from 'lucide-react';

export function GalleryPage() {
  const deck = useMemo(() => generateFullDeck(), []);
  const [selectedColor, setSelectedColor] = useState<CardColor | 'all'>('all');
  const [selectedType, setSelectedType] = useState<TypeOfCard | 'all'>('all');
  const [showSolutions, setShowSolutions] = useState<boolean>(true);
  const [activeZoomCard, setActiveZoomCard] = useState<CardType | null>(null);

  const filteredDeck = useMemo(() => {
    return deck.filter((card) => {
      const matchColor = selectedColor === 'all' || card.color === selectedColor;
      const matchType = selectedType === 'all' || card.type === selectedType;
      return matchColor && matchType;
    });
  }, [deck, selectedColor, selectedType]);

  return (
    <div className="min-h-screen uno-gradient-bg text-white p-4 sm:p-6 pb-20 select-none">
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-black text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Fase 2
            </span>
            <span className="text-white/80 text-xs font-semibold">108 Cartas Verificadas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">
            Galería de Cartas <span className="text-yellow-300">ALGEBRA UNO</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            Toca cualquier carta para hacer zoom y ver su resolución algebraica paso a paso.
          </p>
        </div>

        {/* Toggle Modo Ayuda */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSolutions(!showSolutions)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all
              ${showSolutions ? 'bg-yellow-400 text-black shadow-yellow-400/30' : 'bg-black/40 text-white/80 border border-white/20'}
            `}
          >
            <Eye size={16} />
            <span>{showSolutions ? 'Modo Ayuda: ACTIVO' : 'Modo Ayuda: OCULTO'}</span>
          </button>
        </div>
      </header>

      {/* Filter Controls */}
      <section className="max-w-6xl mx-auto mt-6 bg-black/30 backdrop-blur-md border border-white/15 rounded-3xl p-4 flex flex-col gap-4">
        {/* Color Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase text-white/60 flex items-center gap-1.5 mr-2">
            <Filter size={14} /> Color:
          </span>
          <button
            type="button"
            onClick={() => setSelectedColor('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedColor === 'all' ? 'bg-white text-black shadow' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Todos ({deck.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedColor('green')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedColor === 'green' ? 'bg-emerald-500 text-white ring-2 ring-white' : 'bg-emerald-700/60 text-white/90 hover:bg-emerald-600'
            }`}
          >
            🟢 Verde (Y)
          </button>
          <button
            type="button"
            onClick={() => setSelectedColor('red')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedColor === 'red' ? 'bg-red-500 text-white ring-2 ring-white' : 'bg-red-700/60 text-white/90 hover:bg-red-600'
            }`}
          >
            🔴 Rojo (Z)
          </button>
          <button
            type="button"
            onClick={() => setSelectedColor('blue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedColor === 'blue' ? 'bg-blue-500 text-white ring-2 ring-white' : 'bg-blue-700/60 text-white/90 hover:bg-blue-600'
            }`}
          >
            🔵 Azul (F)
          </button>
          <button
            type="button"
            onClick={() => setSelectedColor('yellow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedColor === 'yellow' ? 'bg-yellow-400 text-black ring-2 ring-white' : 'bg-amber-600/60 text-white/90 hover:bg-amber-500'
            }`}
          >
            🟡 Amarillo (N)
          </button>
          <button
            type="button"
            onClick={() => setSelectedColor('wild')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedColor === 'wild' ? 'bg-neutral-800 text-white ring-2 ring-white' : 'bg-neutral-800/60 text-white/90 hover:bg-neutral-700'
            }`}
          >
            🌈 Comodín (x)
          </button>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <span className="text-xs font-black uppercase text-white/60 flex items-center gap-1.5 mr-2">
            <Sparkles size={14} /> Tipo:
          </span>
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'all' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('number')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'number' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Numéricas (0-9)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('skip')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'skip' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Bloqueo (/0)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('reverse')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'reverse' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Cambio Sentido (* -1)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('draw2')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'draw2' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            +2 Espejo
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('wild4')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'wild4' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            +4 Comodín
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('wild')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'wild' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Comodín Color
          </button>
        </div>
      </section>

      {/* Counter */}
      <div className="max-w-6xl mx-auto my-4 flex items-center justify-between text-xs text-white/70 px-1">
        <span>Mostrando {filteredDeck.length} de {deck.length} cartas</span>
        <span className="flex items-center gap-1 font-mono">
          <BookOpen size={13} /> Haz clic en cualquier carta para ampliar
        </span>
      </div>

      {/* Cards Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 justify-items-center">
        {filteredDeck.map((card) => (
          <div key={card.id} className="flex flex-col items-center">
            <Card
              card={card}
              size="md"
              showSolution={showSolutions}
              onClick={() => setActiveZoomCard(card)}
            />
          </div>
        ))}
      </main>

      {/* Zoom Modal */}
      <CardZoomModal
        card={activeZoomCard}
        onClose={() => setActiveZoomCard(null)}
        showSolution={showSolutions}
      />
    </div>
  );
}
