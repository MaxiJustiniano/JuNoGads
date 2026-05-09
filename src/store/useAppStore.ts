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
  empleados: [
    {
      id: 'e1',
      legajo: '1001',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '30.123.456',
      cuil: '20-30123456-7',
      fechaIngreso: '2022-01-15',
      categoria: 'Administrativo',
      tipoJornada: 'FULL_TIME',
      estado: 'ACTIVO',
      horarioId: 'h1'
    },
    {
      id: 'e2',
      legajo: '1002',
      nombre: 'María',
      apellido: 'González',
      dni: '32.987.654',
      cuil: '27-32987654-1',
      fechaIngreso: '2023-03-10',
      categoria: 'Operario',
      tipoJornada: 'FULL_TIME',
      estado: 'ACTIVO',
      horarioId: 'h1'
    }
  ],
  horarios: [
    {
      id: 'h1',
      nombre: 'Normal 09-18',
      horaEntrada: '09:00',
      horaSalida: '18:00',
      toleranciaEntrada: 15,
      toleranciaSalida: 0,
      diasLaborales: [1, 2, 3, 4, 5]
    }
  ],
  fichadas: [],
  novedades: [
    {
      id: 'n1',
      empleadoId: 'e1',
      tipo: NovedadType.TARDANZA,
      fechaDesde: '2024-05-08',
      cantidad: 0.5,
      estado: NovedadStatus.PENDIENTE,
      esAutomatica: true,
      createdAt: '2024-05-08T09:35:00Z'
    }
  ],
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
        horarioId: 'h1' 
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
  fetchHorarios: async () => {
    try {
      const response = await api.get('/horarios');
      set({ horarios: response.data });
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }
}));
