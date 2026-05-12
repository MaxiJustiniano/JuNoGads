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
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import api from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useRef } from 'react';

export default function Employees() {
  const { empleados, fetchEmployees, createEmployee, updateEmployee, deleteEmployee, horarios, fetchHorarios } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    legajo: '',
    cuil: '',
    fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
    categoria: '',
    tipoJornada: 'FULL_TIME',
    horarioId: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchEmployees();
    fetchHorarios();
  }, [fetchEmployees, fetchHorarios]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      legajo: '',
      cuil: '',
      fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
      categoria: '',
      tipoJornada: 'FULL_TIME',
      horarioId: horarios.length > 0 ? horarios[0].id : '',
      estado: 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setEditingId(emp.id);
    setFormData({
      nombre: emp.nombre || '',
      apellido: emp.apellido || '',
      dni: emp.dni || '',
      legajo: emp.legajo || '',
      cuil: emp.cuil || '',
      fechaIngreso: emp.fechaIngreso ? emp.fechaIngreso.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
      categoria: emp.categoria || '',
      tipoJornada: emp.tipoJornada || 'FULL_TIME',
      horarioId: emp.horarioId || (horarios.length > 0 ? horarios[0].id : ''),
      estado: emp.estado || 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este empleado?')) {
      try {
        await deleteEmployee(id);
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
        await updateEmployee(editingId, formData as any);
      } else {
        await createEmployee(formData as any);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al guardar empleado');
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
    
    const matchesSearch = nombreCompleto.includes(findTerm) ||
      (emp.legajo || '').toLowerCase().includes(findTerm) ||
      (emp.dni || '').toLowerCase().includes(findTerm);

    const matchesStatus = statusFilter === 'TODOS' || (emp.estado || 'ACTIVO') === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/empleados/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
      fetchEmployees();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && data.errors && data.errors.length > 0) {
        alert('Errores al importar:\n' + data.errors.join('\n'));
      } else {
        alert('Error al importar archivo: ' + (data?.message || err.message));
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`${api.defaults.baseURL}/empleados/template`, '_blank');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Gestión de Empleados</h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">NexoLaboral • Personal Activo</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadTemplate}
            className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Descargar Plantilla
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isImporting ? 'Importando...' : 'Importar Excel'}
          </button>
          <button 
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Registrar
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Buscar empleado por legajo, nombre o DNI..." 
            className="w-full bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none w-full md:w-auto"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="SUSPENDIDO">Suspendidos</option>
          </select>
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
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modificar empleado"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar empleado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                <h2 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-tight">
                  {editingId ? 'Modificar Empleado' : 'Registrar Nuevo Empleado'}
                </h2>
                
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

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Información Laboral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Categoría</label>
                        <select 
                          value={formData.categoria}
                          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="">Seleccione Categoría</option>
                          <option value="Administrativo">Administrativo</option>
                          <option value="Operario">Operario</option>
                          <option value="Gerencia">Gerencia</option>
                          <option value="Soporte">Soporte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tipo de Jornada</label>
                        <select 
                          value={formData.tipoJornada}
                          onChange={(e) => setFormData({...formData, tipoJornada: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="FULL_TIME">Jornada Completa</option>
                          <option value="PART_TIME">Media Jornada</option>
                          <option value="FLEXIBLE">Flexible</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Horario Asignado</label>
                        <select 
                          value={formData.horarioId}
                          onChange={(e) => setFormData({...formData, horarioId: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="">Seleccione Horario</option>
                          {horarios.map(h => (
                            <option key={h.id} value={h.id}>{h.nombre} ({h.horaEntrada} - {h.horaSalida})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Estado</label>
                        <select 
                          value={formData.estado}
                          onChange={(e) => setFormData({...formData, estado: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="ACTIVO">Activo</option>
                          <option value="INACTIVO">Inactivo</option>
                          <option value="SUSPENDIDO">Suspendido</option>
                        </select>
                      </div>
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
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Confirmar Registro')}
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
