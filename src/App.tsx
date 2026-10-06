export default function App() {
  return (
    <main className="min-h-screen uno-gradient-bg flex flex-col items-center justify-between p-4 sm:p-6 text-white select-none">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <span className="bg-yellow-400 text-black text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
            Fase 1
          </span>
          <span className="text-white/80 text-xs font-medium tracking-wide">
            Setup Inicial
          </span>
        </div>
        <div className="text-xs bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 font-mono">
          v1.0.0
        </div>
      </header>

      {/* Hero / Logo Section */}
      <section className="flex flex-col items-center text-center my-auto py-8">
        <div className="relative mb-6">
          {/* Card Mockup Icon */}
          <div className="w-28 h-40 bg-uno-red rounded-2xl border-4 border-white shadow-2xl rotate-[-6deg] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-x-[-20%] inset-y-[20%] bg-white rounded-[50%] transform rotate-[-25%] flex items-center justify-center">
              <span className="text-uno-red font-black text-5xl italic font-display">
                UNO
              </span>
            </div>
            <span className="absolute top-2 left-2 text-white font-mono text-xs font-bold">2+Y=4</span>
            <span className="absolute bottom-2 right-2 text-white font-mono text-xs font-bold rotate-180">2+Y=4</span>
          </div>
          <div className="w-28 h-40 bg-uno-green rounded-2xl border-4 border-white shadow-xl rotate-[12deg] absolute -right-6 -bottom-2 -z-10 flex items-center justify-center overflow-hidden">
            <span className="text-white font-black text-3xl font-display">Y</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-lg mb-2">
          ALGEBRA <span className="text-yellow-300">UNO</span>
        </h1>
        <p className="text-base sm:text-lg text-white/90 max-w-xs font-medium leading-relaxed drop-shadow">
          El clásico juego de cartas, donde los números son ecuaciones algebraicas.
        </p>

        {/* Variables Preview Badge */}
        <div className="mt-6 flex items-center gap-2 bg-black/35 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider mr-1">Variables:</span>
          <span className="bg-emerald-500/80 text-white font-mono font-bold px-2 py-0.5 rounded text-xs shadow-sm">Y (Verde)</span>
          <span className="bg-red-500/80 text-white font-mono font-bold px-2 py-0.5 rounded text-xs shadow-sm">Z (Rojo)</span>
          <span className="bg-blue-500/80 text-white font-mono font-bold px-2 py-0.5 rounded text-xs shadow-sm">F (Azul)</span>
          <span className="bg-amber-400/90 text-black font-mono font-bold px-2 py-0.5 rounded text-xs shadow-sm">N (Amarillo)</span>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="w-full max-w-md text-center text-xs text-white/70 pb-4">
        <p className="font-medium">ALGEBRA UNO • MesuDlv / algebra-uno</p>
        <p className="text-white/50 text-[11px] mt-1">Listo para la Fase 2: Generador del Mazo y Componente de Carta</p>
      </footer>
    </main>
  )
}
