import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Novedades from './pages/Novedades';

export default function App() {
  return (
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
                <Route path="/horarios" element={<div className="p-8">Módulo de Horarios (V1)</div>} />
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
  );
}
