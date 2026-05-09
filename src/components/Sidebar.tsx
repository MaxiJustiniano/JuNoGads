import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Clock, 
  FileText, 
  Settings, 
  LogOut, 
  Calendar,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { useAppStore, Role } from '../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, disabled = false }: { to: string, icon: any, label: string, disabled?: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "sidebar-link flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
      isActive 
        ? "bg-indigo-50 text-indigo-700 shadow-sm" 
        : "text-slate-600 hover:text-slate-900",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none"
    )}
  >
    {({ isActive }) => (
      <>
        <Icon className="w-5 h-5 mr-3" strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { currentUser } = useAppStore();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-lg">
          P
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800">PymeTime</span>
      </div>

      <nav className="flex-1 mt-2 px-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Principal</div>
        <SidebarItem to="/" icon={BarChart3} label="Dashboard" />
        <SidebarItem to="/empleados" icon={Users} label="Empleados" />
        <SidebarItem to="/horarios" icon={Calendar} label="Horarios" />
        <SidebarItem to="/fichadas" icon={Clock} label="Control Horario" />
        
        <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gestión</div>
        <SidebarItem to="/novedades" icon={FileText} label="Novedades" />
        <SidebarItem to="/conciliacion" icon={ClipboardCheck} label="Conciliación" />
        
        {currentUser?.role === Role.ADMIN && (
          <>
            <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Empresa</div>
            <SidebarItem to="/cierre" icon={ShieldCheck} label="Cierre Mensual" />
            <SidebarItem to="/configuracion" icon={Settings} label="Configuración" />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-4 group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-200 bg-cover bg-center overflow-hidden border border-slate-200">
            <img src={currentUser?.avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</div>
            <div className="text-[10px] text-slate-500 truncate leading-tight">Admin PymeTime</div>
          </div>
        </div>
        <button className="w-full flex items-center px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors font-medium">
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
