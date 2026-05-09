import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Calendar,
  Briefcase
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Employees() {
  const { empleados, fetchEmployees, createEmployee } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    legajo: '',
    cuil: '',
    fechaIngreso: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await createEmployee(formData);
      setIsModalOpen(false);
      fetchEmployees();
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        legajo: '',
        cuil: '',
        fechaIngreso: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al crear empleado');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateSafe = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'dd/MM/yyyy');
    } catch (e) {
      return 'N/A';
    }
  };

  const filteredEmployees = Array.isArray(empleados) ? empleados.filter(emp => {
    const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.toLowerCase();
    const findTerm = (searchTerm || '').toLowerCase();
    
    return nombreCompleto.includes(findTerm) ||
      (emp.legajo || '').toLowerCase().includes(findTerm) ||
      (emp.dni || '').toLowerCase().includes(findTerm);
  }) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Gestión de Empleados</h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">NexoLaboral • Personal Activo</p>
          <button 
            onClick={async () => {
              try {
                const res = await api.get('/diagnose-supabase');
                alert(`✅ ${res.data.message}`);
              } catch (err: any) {
                alert(`❌ Error: ${err.response?.data?.message || err.message}\nDetalles: ${err.response?.data?.details || 'N/A'}`);
              }
            }}
            className="mt-2 text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            Diagnosticar Conexión
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Empleado
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Buscar empleado por legajo, nombre o DNI..." 
            className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3">Empleado</th>
              <th className="px-6 py-3">Legajo / DNI</th>
              <th className="px-6 py-3">Categoría</th>
              <th className="px-6 py-3">Estado Motor</th>
              <th className="px-6 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map((emp, idx) => {
              if (!emp) return null;
              return (
                <tr key={emp?.id || `emp-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {(emp.nombre?.[0] || '?')}{(emp.apellido?.[0] || '?')}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{emp.nombre || 'Sin nombre'} {emp.apellido || ''}</div>
                      <div className="text-[10px] text-slate-400">CUIL {emp.cuil || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-slate-700">#{emp.legajo || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400">DNI {emp.dni || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600">{emp.categoria || 'Sin categoría'}</div>
                    <div className="text-[10px] text-slate-400">
                      Ingreso: {formatDateSafe(emp.fechaIngreso)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      emp?.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {emp?.estado || 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600 font-semibold transition-colors">Detalles</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-900 font-medium">No se encontraron empleados</p>
            <p className="text-sm text-slate-500">Intenta con otros términos de búsqueda.</p>
          </div>
        )}
      </div>

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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-tight">Registar Nuevo Empleado</h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl uppercase tracking-wider">
                    {typeof error === 'string' ? error : (typeof error === 'object' && error !== null && 'message' in error) ? (error as any).message : JSON.stringify(error)}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nombre</label>
                      <input 
                        type="text" 
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Apellido</label>
                      <input 
                        type="text" 
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">DNI</label>
                      <input 
                        type="text" 
                        value={formData.dni}
                        onChange={(e) => setFormData({...formData, dni: e.target.value})}
                        placeholder="Ej: 30.123.456"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Legajo</label>
                      <input 
                        type="text" 
                        value={formData.legajo}
                        onChange={(e) => setFormData({...formData, legajo: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">CUIL</label>
                      <input 
                        type="text" 
                        value={formData.cuil}
                        onChange={(e) => setFormData({...formData, cuil: e.target.value})}
                        placeholder="Ej: 20-30123456-7"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Fecha Ingreso</label>
                      <input 
                        type="date" 
                        value={formData.fechaIngreso}
                        onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Registrando...' : 'Confirmar Registro'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
