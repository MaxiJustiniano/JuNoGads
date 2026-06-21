import { useEffect, useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  AlertTriangle,
  Plus,
  Filter
} from 'lucide-react';
import api from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Novedades() {
  const [novedades, setNovedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODAS' | 'PENDIENTES' | 'APROBADAS'>('TODAS');
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [resumen, setResumen] = useState<any>(null);

  const fetchNovedades = async () => {
    try {
      const res = await api.get('/novedades');
      setNovedades(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    if (novedades.length > 0) {
        try {
            const empId = novedades[0].empleadoId; // Just for demo, we grab the first employee
            const mes = format(new Date(), 'yyyy-MM');
            const res = await api.get(`/resumen-mensual?empleadoId=${empId}&mes=${mes}`);
            setResumen(res.data);
            alert(`Resumen ${mes}:\nDías Trabajados: ${res.data.diasTrabajados}\nHoras Extra Adic.: ${res.data.horasExtraTotales}\nAusencias: ${res.data.ausenciasTotales}\nTardanza Acumulada: ${res.data.minutosTardanzaTotales}m`);
        } catch(e) {
            console.error(e);
        }
    } else {
        alert("No hay novedades para deducir un empleado de muestra.");
    }
  }

  useEffect(() => {
    fetchNovedades();
  }, []);

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    try {
      await api.patch(`/novedades/${id}/status`, { estado: status, observaciones: reason });
      fetchNovedades();
      if (status === 'RECHAZADA') {
        setRejectingId(null);
        setRejectReason('');
      }
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'APROBADA': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'RECHAZADA': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'TARDANZA') return <Clock className="w-4 h-4 text-orange-500" />;
    if (type === 'AUSENCIA') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    return <Calendar className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Gestión de Novedades</h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">NexoLaboral • Administración de Incidencias</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => fetchResumen()}
                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-100 transition-all shadow-sm"
            >
                <Calendar className="w-4 h-4" />
                Resumen Curso
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" />
            Nueva Novedad
            </button>
        </div>
      </header>

      <div className="flex gap-4 items-center">
        <div className="flex bg-white border border-slate-200 rounded-md p-1 shadow-sm">
          <button 
            onClick={() => setFilter('TODAS')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === 'TODAS' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter('PENDIENTES')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === 'PENDIENTES' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter('APROBADAS')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === 'APROBADAS' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            Aprobadas
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3">Empleado / Tipo</th>
              <th className="px-6 py-3">Período / Cant.</th>
              <th className="px-6 py-3 text-center">Estado Motor</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {novedades
              .filter(nov => 
                filter === 'TODAS' || 
                (filter === 'PENDIENTES' && nov.estado === 'PENDIENTE') || 
                (filter === 'APROBADAS' && nov.estado === 'APROBADA')
              )
              .map((nov) => (
              <tr key={nov.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                    {(nov.empleado?.nombre?.[0] || '?')}{(nov.empleado?.apellido?.[0] || '?')}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{nov.empleado?.apellido || '-'}, {nov.empleado?.nombre || '-'}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tighter bg-indigo-50 px-1.5 rounded">{(nov.tipo || '').replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-slate-700">{format(new Date(nov.fechaDesde), 'dd/MM/yyyy')}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{nov.cantidad} {nov.tipo.includes('HORA') ? 'Horas' : nov.tipo.includes('ANTIC') || nov.tipo.includes('TARDANZA') ? 'Minuto(s)' : 'Día(s)'}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(nov.estado)}`}>
                    {nov.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {nov.estado === 'PENDIENTE' ? (
                    rejectingId === nov.id ? (
                      <div className="flex flex-col items-end gap-2">
                        <input 
                          type="text" 
                          placeholder="Motivo del rechazo..." 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="px-2 py-1 text-xs border rounded w-48 focus:ring bg-white text-slate-800"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setRejectingId(null)}
                            className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-700"
                          >Cancelar</button>
                          <button 
                            onClick={() => handleStatusChange(nov.id, 'RECHAZADA', rejectReason)}
                            className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded uppercase hover:bg-rose-700 transition-colors"
                          >Confirmar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleStatusChange(nov.id, 'APROBADA')}
                          className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded uppercase hover:bg-indigo-700 transition-colors"
                        >
                          Aprobar
                        </button>
                        <button 
                          onClick={() => setRejectingId(nov.id)}
                          className="px-2 py-1 border border-slate-300 text-slate-600 text-[10px] font-bold rounded uppercase hover:bg-slate-100 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Procesado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && novedades.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No hay novedades para revisión</p>
          </div>
        )}
      </div>
    </div>
  );
}
