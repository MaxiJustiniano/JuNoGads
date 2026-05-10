import { create } from 'zustand';
import api from '../lib/api';

export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  ACCOUNTANT = 'ACCOUNTANT'
}

export enum FichadaType {
  IN = 'IN',
  OUT = 'OUT'
}

export enum NovedadType {
  TARDANZA = 'TARDANZA',
  AUSENCIA = 'AUSENCIA',
  HORA_EXTRA_50 = 'HORA_EXTRA_50',
  HORA_EXTRA_100 = 'HORA_EXTRA_100',
  SALIDA_ANTICIPADA = 'SALIDA_ANTICIPADA',
  LICENCIA_MEDICA = 'LICENCIA_MEDICA',
  VACACIONES = 'VACACIONES',
  SUSPENSION = 'SUSPENSION',
  EXAMEN = 'EXAMEN',
  PERMISO_ESPECIAL = 'PERMISO_ESPECIAL'
}

export enum NovedadStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Empleado {
  id: string;
  legajo: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  fechaIngreso: string;
  categoria: string;
  tipoJornada: 'FULL_TIME' | 'PART_TIME' | 'FLEX';
  estado: 'ACTIVO' | 'INACTIVO';
  horarioId: string;
}

export interface Horario {
  id: string;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
  toleranciaEntrada: number; // minutos
  toleranciaSalida: number; // minutos
  diasLaborales: number[]; // 0-6
}

export interface Fichada {
  id: string;
  empleadoId: string;
  timestamp: string;
  tipo: FichadaType;
  origen: 'MANUAL' | 'BIOMETRICO' | 'QR' | 'API';
  creadoPor: string;
  observaciones?: string;
}

export interface Novedad {
  id: string;
  empleadoId: string;
  tipo: NovedadType;
  fechaDesde: string;
  fechaHasta?: string;
  cantidad: number; // horas o días
  estado: NovedadStatus;
  observaciones?: string;
  esAutomatica: boolean;
  createdAt: string;
}

interface AppState {
  currentUser: User | null;
  empleados: Empleado[];
  horarios: Horario[];
  fichadas: Fichada[];
  novedades: Novedad[];
  setEmployees: (emps: Empleado[]) => void;
  setCurrentUser: (user: User | null) => void;
  fetchEmployees: () => Promise<void>;
  createEmployee: (data: Omit<Empleado, 'id' | 'estado'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Empleado>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  fetchHorarios: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: '1',
    name: 'Admin PymeTime',
    email: 'admin@pymetime.com',
    role: Role.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  },
  empleados: [],
  horarios: [],
  fichadas: [],
  novedades: [],
  setEmployees: (empleados: Empleado[]) => set({ empleados }),
  setCurrentUser: (currentUser: User | null) => set({ currentUser }),
  fetchEmployees: async () => {
    try {
      const response = await api.get('/empleados');
      if (Array.isArray(response.data)) {
        set({ empleados: response.data });
      } else {
        console.error('Expected array of employees, got:', response.data);
        set({ empleados: [] });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      set({ empleados: [] });
    }
  },
  createEmployee: async (data) => {
    try {
      console.log('Enviando datos de empleado:', data);
      const response = await api.post('/empleados', {
        ...data,
        estado: 'ACTIVO',
        categoria: 'Administrativo', 
        tipoJornada: 'FULL_TIME',
        horarioId: '81109015-ab23-4f9c-ad98-b80c352bbded'
      });
      console.log('Respuesta de creación:', response.data);
    } catch (error: any) {
      if (error.response) {
        const contentType = error.response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
          console.error('El servidor devolvió HTML en lugar de JSON. ¿Ruta incorrecta o caída?');
          throw new Error('El servidor devolvió una página de error (404/500). Revisa las credenciales de Supabase.');
        }
        console.error('Error in createEmployee:', error.response.data || error.message);
      } else {
        console.error('Error in createEmployee (No response):', error.message);
      }
      throw error;
    }
  },
  updateEmployee: async (id: string, data: Partial<Empleado>) => {
    try {
      await api.put(`/empleados/${id}`, data);
      const emps = useAppStore.getState().empleados;
      set({ empleados: emps.map(emp => emp.id === id ? { ...emp, ...data } : emp) });
    } catch (error: any) {
      console.error('Error in updateEmployee:', error.response?.data || error.message);
      throw error;
    }
  },
  deleteEmployee: async (id: string) => {
    try {
      await api.delete(`/empleados/${id}`);
      const emps = useAppStore.getState().empleados;
      set({ empleados: emps.filter(emp => emp.id !== id) });
    } catch (error: any) {
      console.error('Error in deleteEmployee:', error.response?.data || error.message);
      throw error;
    }
  },
  fetchHorarios: async () => {
    try {
      const response = await api.get('/horarios');
      set({ horarios: response.data });
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }
}));
