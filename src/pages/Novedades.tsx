import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Filter,
  Download,
} from "lucide-react";
import api from "../lib/api";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export default function Novedades() {
  const [novedades, setNovedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "TODAS" | "PENDIENTES" | "APROBADAS" | "RECHAZADAS"
  >("TODAS");

  const fetchNovedades = async () => {
    try {
      const res = await api.get("/novedades");
      setNovedades(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    try {
      const mes = format(new Date(), "yyyy-MM");
      const res = await api.get(`/resumen-mensual?mes=${mes}`);
      const data = res.data;

      if (!data || Object.keys(data).length === 0) {
        alert("No hay datos de resumen para exportar.");
        return;
      }

      const rows = Object.values(data).map((emp: any) => ({
        Legajo: emp.legajo,
        Empleado: emp.nombreCompleto,
        Período: emp.mes,
        "Días Trabajados": emp.diasTrabajados,
        "Tardanza (min)": emp.minutosTardanzaTotales,
        "Horas Extra": emp.horasExtraTotales,
        Ausencias: emp.ausenciasTotales,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen");

      const wscols = [
        { wch: 10 },
        { wch: 30 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, `Resumen_Operativo_${mes}.xlsx`, {
        compression: true,
      });
    } catch (e) {
      console.error(e);
      alert("Error al exportar a Excel");
    }
  };

  useEffect(() => {
    fetchNovedades();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "APROBADA":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "RECHAZADA":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">
            Historial de Novedades
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            NexoLaboral • Visor Histórico Inmutable
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchResumen()}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar Resumen (Excel)
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
            onClick={() => setFilter("TODAS")}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === "TODAS" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-indigo-600"}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter("PENDIENTES")}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === "PENDIENTES" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-indigo-600"}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter("APROBADAS")}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === "APROBADAS" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-indigo-600"}`}
          >
            Aprobadas
          </button>
          <button
            onClick={() => setFilter("RECHAZADAS")}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${filter === "RECHAZADAS" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-indigo-600"}`}
          >
            Rechazadas
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3">Empleado / Tipo</th>
              <th className="px-6 py-3">Período / Cant.</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Trazabilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {novedades
              .filter((nov) => {
                if (filter === "TODAS") return true;
                if (filter === "PENDIENTES" && nov.estado === "PENDIENTE") return true;
                if (filter === "APROBADAS" && nov.estado === "APROBADA") return true;
                if (filter === "RECHAZADAS" && nov.estado === "RECHAZADA") return true;
                return false;
              })
              .map((nov) => (
                <tr
                  key={nov.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                      {nov.empleado?.nombre?.[0] || "?"}
                      {nov.empleado?.apellido?.[0] || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">
                        {nov.empleado?.apellido || "-"},{" "}
                        {nov.empleado?.nombre || "-"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tighter bg-indigo-50 px-1.5 rounded">
                          {(nov.tipo || "").replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-slate-700">
                      {format(new Date(nov.fechaDesde), "dd/MM/yyyy")}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">
                      {nov.cantidad}{" "}
                      {nov.tipo.includes("HORA")
                        ? "Horas"
                        : nov.tipo.includes("ANTIC") ||
                            nov.tipo.includes("TARDANZA")
                          ? "Minuto(s)"
                          : "Día(s)"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(nov.estado)}`}
                    >
                      {nov.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {nov.trazabilidad ? (
                      <div className="text-[10px] text-slate-500">
                        <div>
                          <span className="font-bold">Por:</span>{" "}
                          {nov.trazabilidad.by}
                        </div>
                        <div>
                          <span className="font-bold">Motivo:</span>{" "}
                          {nov.trazabilidad.reason}
                        </div>
                        <div>
                          <span className="font-bold">Fecha:</span>{" "}
                          {format(
                            new Date(nov.trazabilidad.at),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 uppercase">
                        Sin trazabilidad
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && novedades.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No hay novedades históricas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
