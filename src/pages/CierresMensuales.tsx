import { useEffect, useState } from "react";
import {
  Lock,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  FolderLock,
} from "lucide-react";
import api from "../lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CierresMensuales() {
  const [cierres, setCierres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoToClose, setPeriodoToClose] = useState(
    format(new Date(), "yyyy-MM"),
  );

  const fetchCierres = async () => {
    try {
      const res = await api.get("/cierres");
      setCierres(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCierres();
  }, []);

  const handleCerrarMes = async () => {
    if (
      !confirm(
        `¿Está seguro de que desea cerrar el período ${periodoToClose}? Esta acción es irreversible y consolidará todos los datos.`,
      )
    )
      return;

    try {
      await api.post("/cierres", {
        periodo: periodoToClose,
        cerradoPor: "admin", // in a real app this would come from the auth token
      });
      alert("Período cerrado exitosamente");
      fetchCierres();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al cerrar el mes");
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">
            Cierre Mensual
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            NexoLaboral • Consolidación & Resumen Operativo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={periodoToClose}
            onChange={(e) => setPeriodoToClose(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring"
          />
          <button
            onClick={handleCerrarMes}
            className="bg-slate-800 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-900 transition-all shadow-sm active:scale-95"
          >
            <Lock className="w-4 h-4" />
            Cerrar Período
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl card-shadow overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-slate-700 text-sm">
          <FolderLock className="w-5 h-5 text-slate-400" />
          <span className="font-bold uppercase text-[11px] tracking-wider">
            Historial de Cierres Inmutables
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando...</div>
        ) : cierres.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderLock className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No hay períodos cerrados
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3">Período</th>
                <th className="px-6 py-3">Cerrado Por</th>
                <th className="px-6 py-3">Fecha de Cierre</th>
                <th className="px-6 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cierres.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-mono text-slate-800 font-bold bg-slate-100 px-2 py-1 inline-block rounded text-[11px] shadow-sm">
                      {c.periodo}
                    </div>
                  </td>
                  <td className="px-6 py-4 uppercase text-xs font-bold text-slate-600">
                    {c.cerradoPor}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {format(new Date(c.fechaCierre), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase border bg-green-50 text-green-700 border-green-200">
                      Consolidado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
