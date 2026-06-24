import { ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Users,
  Clock,
  FileText,
  Settings,
  LogOut,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  Key,
} from "lucide-react";
import { useAppStore, Role } from "../store/useAppStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import api from "../lib/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({
  to,
  icon: Icon,
  label,
  disabled = false,
}: {
  to: string;
  icon: any;
  label: string;
  disabled?: boolean;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "sidebar-link flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
        isActive
          ? "bg-indigo-50 text-indigo-700 shadow-sm"
          : "text-slate-600 hover:text-slate-900",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      )
    }
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
  const { currentUser, setCurrentUser } = useAppStore();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      setSuccess("Contraseña actualizada exitosamente");
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-lg">
          P
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800">
          PymeTime
        </span>
      </div>

      <nav className="flex-1 mt-2 px-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Principal
        </div>
        <SidebarItem to="/" icon={BarChart3} label="Dashboard" />
        <SidebarItem to="/empleados" icon={Users} label="Empleados" />
        <SidebarItem to="/horarios" icon={Calendar} label="Horarios" />
        <SidebarItem to="/fichadas" icon={Clock} label="Control Horario" />

        <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Gestión
        </div>
        <SidebarItem to="/novedades" icon={FileText} label="Novedades" />
        <SidebarItem
          to="/conciliacion"
          icon={ClipboardCheck}
          label="Conciliación"
        />

        {currentUser?.role === Role.ADMIN && (
          <>
            <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Empresa
            </div>
            <SidebarItem
              to="/cierre"
              icon={ShieldCheck}
              label="Cierre Mensual"
            />
            <SidebarItem to="/usuarios" icon={Users} label="Usuarios" />
            <SidebarItem
              to="/configuracion"
              icon={Settings}
              label="Configuración"
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-2 group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-200 bg-cover bg-center overflow-hidden border border-slate-200">
            <img
              src={currentUser?.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.name}
            </div>
            <div className="text-[10px] text-slate-500 truncate leading-tight">
              Admin PymeTime
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded transition-colors font-medium mb-1"
        >
          <Key className="w-3.5 h-3.5 mr-2" />
          Cambiar Contraseña
        </button>
        <button
          onClick={() => setCurrentUser(null)}
          className="w-full flex items-center px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Cerrar Sesión
        </button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Cambiar Contraseña
              </h2>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-600 rounded-lg text-xs font-medium border border-green-200">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
