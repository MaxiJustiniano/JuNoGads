import { useEffect, useState } from 'react';
import { 
  Calendar,
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Clock,
  RotateCw,
  Coffee,
  CalendarCheck2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lunes', short: 'L' },
  { id: 2, label: 'Martes', short: 'M' },
  { id: 3, label: 'Miércoles', short: 'M' },
  { id: 4, label: 'Jueves', short: 'J' },
  { id: 5, label: 'Viernes', short: 'V' },
  { id: 6, label: 'Sábado', short: 'S' },
  { id: 0, label: 'Domingo', short: 'D' }
];

export default function Schedules() {
  const { horarios, fetchHorarios, createSchedule, updateSchedule, deleteSchedule } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    tipoJornada: 'TURNO_FIJO',
    horaEntrada: '09:00',
    horaSalida: '18:00',
    toleranciaEntrada: 15,
    toleranciaSalida: 0,
    tiempoMinimoDescanso: 60,
    umbralHorasExtra: 8,
    estado: 'ACTIVO',
    diasLaborales: [1, 2, 3, 4, 5]
  });

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const toggleDay = (dayId: number) => {
    setFormData(prev => {
      const current = prev.diasLaborales;
      if (current.includes(dayId)) {
        return { ...prev, diasLaborales: current.filter(d => d !== dayId) };
      }
      return { ...prev, diasLaborales: [...current, dayId].sort() };
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      tipoJornada: 'TURNO_FIJO',
      horaEntrada: '09:00',
      horaSalida: '18:00',
      toleranciaEntrada: 15,
      toleranciaSalida: 0,
      tiempoMinimoDescanso: 60,
      umbralHorasExtra: 8,
      estado: 'ACTIVO',
      diasLaborales: [1, 2, 3, 4, 5]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (h: any) => {
    setEditingId(h.id);
    setFormData({
      nombre: h.nombre || '',
      tipoJornada: h.tipoJornada || 'TURNO_FIJO',
      horaEntrada: h.horaEntrada || '09:00',
      horaSalida: h.horaSalida || '18:00',
      toleranciaEntrada: h.toleranciaEntrada || 0,
      toleranciaSalida: h.toleranciaSalida || 0,
      tiempoMinimoDescanso: h.tiempoMinimoDescanso || 60,
      umbralHorasExtra: h.umbralHorasExtra || 8,
      estado: h.estado || 'ACTIVO',
      diasLaborales: Array.isArray(h.diasLaborales) ? h.diasLaborales : [1, 2, 3, 4, 5]
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de desactivar este horario?')) {
      try {
        await deleteSchedule(id);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingId) {
        await updateSchedule(editingId, formData as any);
      } else {
        await createSchedule(formData as any);
      }
      setIsModalOpen(false);
      fetchHorarios();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al guardar horario');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHorarios = Array.isArray(horarios) ? horarios.filter(h => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (h.nombre || '').toLowerCase().includes(term);
    const matchesTipo = filterTipo === 'TODOS' || (h.tipoJornada || 'TURNO_FIJO') === filterTipo;
    return matchesSearch && matchesTipo;
  }) : [];

  const getTipoJornadaIcon = (tipo: string) => {
    switch (tipo) {
      case 'TURNO_ROTATIVO': return <RotateCw className="w-3 h-3 text-amber-500" />;
      case 'FLEXIBLE': return <Coffee className="w-3 h-3 text-emerald-500" />;
      case 'REDUCIDA': return <Clock className="w-3 h-3 text-purple-500" />;
      default: return <CalendarCheck2 className="w-3 h-3 text-indigo-500" />;
    }
  };

  const getTipoJornadaLabel = (tipo: string) => {
    switch (tipo) {
      case 'TURNO_ROTATIVO': return 'Rotativo';
      case 'FLEXIBLE': return 'Flexible';
      case 'REDUCIDA': return 'Reducida';
      default: return 'Fijo';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Configuración de Horarios</h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Reglas de Asistencia y Turnos</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Crear Horario
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Buscar horario por nombre..." 
            className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none w-full md:w-auto font-medium text-slate-600 uppercase text-xs"
        >
          <option value="TODOS">Todos los Tipos</option>
          <option value="TURNO_FIJO">Turno Fijo</option>
          <option value="TURNO_ROTATIVO">Turno Rotativo</option>
          <option value="FLEXIBLE">Flexible</option>
          <option value="REDUCIDA">Jornada Reducida</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3">Nombre del Horario</th>
              <th className="px-6 py-3 min-w-[150px]">Tipo de Jornada</th>
              <th className="px-6 py-3">Rango Horario</th>
              <th className="px-6 py-3">Días Laborales</th>
              <th className="px-6 py-3 text-center">Estado</th>
              <th className="px-6 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHorarios.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{h.nombre}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Tolerancia: {h.toleranciaEntrada}m / {h.toleranciaSalida}m</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      {getTipoJornadaIcon(h.tipoJornada as string)}
                    </div>
                    <span className="font-medium text-slate-700 text-xs uppercase">{getTipoJornadaLabel(h.tipoJornada as string)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit text-xs border border-slate-100">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{h.horaEntrada}</span>
                    <span className="text-slate-300">-</span>
                    <span>{h.horaSalida}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map(d => {
                      const isActive = h.diasLaborales?.includes(d.id);
                      return (
                        <div 
                          key={d.id} 
                          className={`w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold ${
                            isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-300'
                          }`}
                          title={d.label}
                        >
                          {d.short}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    h.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {h.estado || 'ACTIVO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(h)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar Horario"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(h.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={h.estado === 'ACTIVO' ? "Desactivar Horario" : "Horario Inactivo"}
                      disabled={h.estado === 'INACTIVO'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredHorarios.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium">No se encontraron horarios</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex-1 overflow-y-auto p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  {editingId ? 'Editar Horario' : 'Nuevo Horario'}
                </h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl uppercase tracking-wider">
                    {typeof error === 'string' ? error : (error as any).message || 'Error'}
                  </div>
                )}

                <div className="space-y-6">
                  {/* General Config */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nombre del Horario</label>
                      <input 
                        type="text" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: Turno Mañana"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tipo de Jornada</label>
                      <select 
                        value={formData.tipoJornada}
                        onChange={(e) => setFormData({...formData, tipoJornada: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                      >
                        <option value="TURNO_FIJO">Turno Fijo</option>
                        <option value="TURNO_ROTATIVO">Turno Rotativo</option>
                        <option value="FLEXIBLE">Horario Flexible</option>
                        <option value="REDUCIDA">Jornada Reducida</option>
                      </select>
                    </div>
                  </div>

                  {/* Time Ranges */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Hora Entrada</label>
                      <input 
                        type="time" 
                        value={formData.horaEntrada}
                        onChange={(e) => setFormData({...formData, horaEntrada: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Hora Salida</label>
                      <input 
                        type="time" 
                        value={formData.horaSalida}
                        onChange={(e) => setFormData({...formData, horaSalida: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>
                  </div>

                  {/* Tolerances and Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tolerancia Ent. (min)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.toleranciaEntrada}
                        onChange={(e) => setFormData({...formData, toleranciaEntrada: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tolerancia Sal. (min)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.toleranciaSalida}
                        onChange={(e) => setFormData({...formData, toleranciaSalida: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Descanso Min. (min)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.tiempoMinimoDescanso}
                        onChange={(e) => setFormData({...formData, tiempoMinimoDescanso: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Umbral Horas Extra (hs)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.5"
                        value={formData.umbralHorasExtra}
                        onChange={(e) => setFormData({...formData, umbralHorasExtra: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" 
                      />
                    </div>
                  </div>

                  {/* Work Days */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Días Laborales (Semanal/Bisemanal)</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(d => {
                        const isSelected = formData.diasLaborales.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDay(d.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                              isSelected 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Estado</label>
                    <select 
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>

                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl mt-auto">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading || formData.diasLaborales.length === 0}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Confirmar Registro')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
