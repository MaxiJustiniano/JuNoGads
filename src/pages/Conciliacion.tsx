import { useEffect, useState } from "react";
import { FileText, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../lib/api";
import { format } from "date-fns";

export default function Conciliacion() {
  const [novedades, setNovedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchNovedades = async () => {
    try {
      const res = await api.get("/novedades");
      setNovedades(res.data.filter((n: any) => n.estado === "PENDIENTE"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovedades();
  }, []);

  const handleStatusChange = async (
    id: string,
    status: string,
    reason?: string,
  ) => {
    if (status === "RECHAZADA" && (!reason || reason.trim() === "")) {
      alert("Debe proveer un motivo de rechazo");
      return;
    }

    try {
      await api.patch(`/novedades/${id}/status`, {
        estado: status,
        observaciones: reason,
        usuario: "admin-auditor",
      });
      fetchNovedades();
      if (status === "RECHAZADA") {
        setRejectingId(null);
        setRejectReason("");
      }
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

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
            Bandeja de Conciliación
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            NexoLaboral • Auditoría y Validación
          </p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3">Empleado / Tipo</th>
              <th className="px-6 py-3">Período / Cant.</th>
              <th className="px-6 py-3 text-center">Estado Motor</th>
              <th className="px-6 py-3 text-right">Acciones de Auditoría</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {novedades.map((nov) => (
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
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(nov.estado)}`}
                  >
                    {nov.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {rejectingId === nov.id ? (
                    <div className="flex flex-col items-end gap-2">
                      <input
                        type="text"
                        placeholder="Motivo obligatorio del rechazo..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="px-2 py-1 text-xs border rounded w-56 focus:ring bg-white text-slate-800"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                          className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              nov.id,
                              "RECHAZADA",
                              rejectReason,
                            )
                          }
                          className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded uppercase hover:bg-rose-700 transition-colors"
                        >
                          Confirmar Rechazo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleStatusChange(nov.id, "APROBADA")}
                        className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded flex items-center gap-1 uppercase hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Aprobar
                      </button>
                      <button
                        onClick={() => setRejectingId(nov.id)}
                        className="px-2 py-1 bg-white border border-rose-200 text-rose-600 text-[10px] font-bold rounded flex items-center gap-1 uppercase hover:bg-rose-50 transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" /> Rechazar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && novedades.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-10 text-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No hay novedades pendientes de auditoría
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
