import { useEffect, useState } from "react";
import { Lock, FolderLock, Download, CheckCircle, X } from "lucide-react";
import api from "../lib/api";
import { format } from "date-fns";

export default function CierresMensuales() {
  const [cierres, setCierres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoToClose, setPeriodoToClose] = useState(
    format(new Date(), "yyyy-MM"),
  );

  const [showSuccessModal, setShowSuccessModal] = useState<{
    show: boolean;
    id: string;
    periodo: string;
  }>({ show: false, id: "", periodo: "" });

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

  const downloadExcel = async (id: string, periodo: string) => {
    try {
      const response = await api.get(`/cierre/${id}/exportar`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Preliquidacion_${periodo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Error al generar o descargar el reporte Excel");
    }
  };

  const handleCerrarMes = async () => {
    if (
      !confirm(
        `¿Está seguro de que desea cerrar el período ${periodoToClose}? Esta acción es irreversible y consolidará todos los datos.`,
      )
    )
      return;

    try {
      const res = await api.post("/cierres", {
        periodo: periodoToClose,
        cerradoPor: "admin",
      });

      setShowSuccessModal({
        show: true,
        id: res.data.id,
        periodo: res.data.periodo,
      });
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
                <th className="px-6 py-3 text-right">Acciones</th>
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
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => downloadExcel(c.id, c.periodo)}
                      className="px-3 py-1 flex items-center justify-end w-full gap-1.5 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Reporte Excel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  Cierre Exitoso
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  El período{" "}
                  <span className="font-bold text-slate-800">
                    {showSuccessModal.periodo}
                  </span>{" "}
                  ha sido cerrado y consolidado correctamente.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => {
                    downloadExcel(
                      showSuccessModal.id,
                      showSuccessModal.periodo,
                    );
                    setShowSuccessModal({ show: false, id: "", periodo: "" });
                  }}
                  className="w-full bg-emerald-600 text-white font-bold uppercase text-xs tracking-wider py-3 rounded-lg shadow flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte Excel
                </button>
                <button
                  onClick={() =>
                    setShowSuccessModal({ show: false, id: "", periodo: "" })
                  }
                  className="w-full bg-slate-100 text-slate-600 font-bold uppercase text-xs tracking-wider py-3 rounded-lg hover:bg-slate-200 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
