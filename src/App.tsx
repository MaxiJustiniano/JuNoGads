import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Schedules from './pages/Schedules';
import Attendance from './pages/Attendance';
import Novedades from './pages/Novedades';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Algo salió mal</h2>
        <p className="text-slate-500 text-sm mb-6 bg-slate-50 p-3 rounded-lg font-mono text-left overflow-auto max-h-32 mb-4">
          {typeof error.message === 'string' ? error.message : JSON.stringify(error.message || error)}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Router>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="ml-64 flex-1 flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/empleados" element={<Employees />} />
                <Route path="/horarios" element={<Schedules />} />
                <Route path="/fichadas" element={<Attendance />} />
                <Route path="/novedades" element={<Novedades />} />
                <Route path="/conciliacion" element={<div className="p-8">Conciliación (V6)</div>} />
                <Route path="/cierre" element={<div className="p-8">Cierre Mensual (V7)</div>} />
                <Route path="/configuracion" element={<div className="p-8">Configuración</div>} />
              </Routes>
            </div>
            <footer className="h-10 bg-slate-800 text-white flex items-center justify-between px-8 text-[10px] uppercase tracking-widest font-medium">
              <div className="flex space-x-6">
                <span>SISTEMA: OK</span>
                <span>BASE DE DATOS: CONECTADA</span>
                <span>MOTOR DE REGLAS: ACTIVO</span>
              </div>
              <div>PYMETIME V1.0.4 • 2026</div>
            </footer>
          </main>
        </div>
      </div>
    </Router>
    </ErrorBoundary>
  );
}
