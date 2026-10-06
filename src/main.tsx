import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h1 className="text-2xl font-black mb-2 text-red-400">Error al iniciar el juego</h1>
            <p className="text-sm text-slate-300 mb-6">
              {this.state.error?.message || 'Ocurrió un error inesperado al cargar la aplicación.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-amber-600 font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Recargar juego 🔄
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
