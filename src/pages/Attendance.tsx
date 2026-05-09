import { useEffect, useState } from 'react';
import { 
  Clock, 
  MapPin, 
  LogIn, 
  LogOut, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import api from '../lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Attendance() {
  const { empleados, fetchEmployees } = useAppStore();
  const [fichadas, setFichadas] = useState<any[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [tipo, setTipo] = useState<'IN' | 'OUT'>('IN');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchRecent = async () => {
    try {
      const res = await api.get('/fichadas/recientes');
      setFichadas(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRecent();
  }, [fetchEmployees]);

  const handleRegister = async () => {
    if (!selectedEmpleado) return;
    setLoading(true);
    try {
      await api.post('/fichadas', {
        empleadoId: selectedEmpleado,
        tipo,
        origen: 'MANUAL',
        creadoPor: 'admin'
      });
      setSuccess(true);
      fetchRecent();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Error al registrar fichada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Control de Asistencia</h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">NexoLaboral • Tiempo Real</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registro Manual */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 card-shadow flex flex-col space-y-6">
          <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-700">Registrar Marcación</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">Empleado</label>
              <select 
                value={selectedEmpleado}
                onChange={(e) => setSelectedEmpleado(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.apellido}, {emp.nombre} (#{emp.legajo})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setTipo('IN')}
                className={`py-2 rounded-md border-2 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-wider ${
                  tipo === 'IN' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrada
              </button>
              <button 
                onClick={() => setTipo('OUT')}
                className={`py-2 rounded-md border-2 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-wider ${
                  tipo === 'OUT' 
                  ? 'border-amber-500 bg-amber-50 text-amber-700' 
                  : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Salida
              </button>
            </div>
          </div>

          <button 
            disabled={!selectedEmpleado || loading}
            onClick={handleRegister}
            className="w-full bg-indigo-600 text-white py-3 rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 justify-center text-green-700 bg-green-100 py-2 rounded font-bold text-[10px] uppercase"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Registro Correcto
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Listado Reciente */}
        <div className="lg:col-span-2 bg-white rounded-xl card-shadow border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-700">Últimas Fichadas Registradas</h3>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Vivo</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3">Empleado</th>
                  <th className="px-6 py-3 text-center">Tipo</th>
                  <th className="px-6 py-3">Hora / Origen</th>
                  <th className="px-6 py-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fichadas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase tracking-tighter">
                        {(f.empleado?.nombre?.[0] || '?')}{(f.empleado?.apellido?.[0] || '?')}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{f.empleado?.apellido || '-'}, {f.empleado?.nombre || '-'}</div>
                        <div className="text-[10px] text-slate-400"># {f.empleado?.legajo || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.tipo === 'IN' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {f.tipo === 'IN' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-slate-700">{format(new Date(f.timestamp), 'HH:mm:ss')}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{f.origen}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">Procesado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fichadas.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No hay registros</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
