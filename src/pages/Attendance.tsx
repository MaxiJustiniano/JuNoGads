import { useEffect, useState } from "react";
import {
  Clock,
  MapPin,
  LogIn,
  LogOut,
  Search,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Calendar,
  Info,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import api from "../lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";

export default function Attendance() {
  const { empleados, fetchEmployees } = useAppStore();
  const [fichadas, setFichadas] = useState<any[]>([]);
  const [interpretaciones, setInterpretaciones] = useState<any[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState("");
  const [tipo, setTipo] = useState<
    "ENTRADA" | "SALIDA" | "INICIO_DESCANSO" | "FIN_DESCANSO"
  >("ENTRADA");
  const [origen, setOrigen] = useState<"MANUAL" | "BIOMETRICO" | "QR" | "PIN">(
    "MANUAL",
  );
  const [observaciones, setObservaciones] = useState("");
  const [timestampManual, setTimestampManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<"FICHADAS" | "MOTOR">("FICHADAS");
  const [fechaInterpretacion, setFechaInterpretacion] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const [file, setFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const fetchRecent = async () => {
    try {
      const res = await api.get("/fichadas/recientes");
      setFichadas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setFichadas([]);
    }
  };

  const fetchInterpretaciones = async () => {
    try {
      const res = await api.get(
        `/fichadas/interpretaciones?fecha=${fechaInterpretacion}`,
      );
      setInterpretaciones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setInterpretaciones([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRecent();
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab === "MOTOR") {
      fetchInterpretaciones();
    }
  }, [activeTab, fechaInterpretacion]);

  const [registroType, setRegistroType] = useState<"FICHADA" | "NOVEDAD">("FICHADA");
  const [novedadTipo, setNovedadTipo] = useState<"AUSENCIA_JUSTIFICADA" | "AUSENCIA_INJUSTIFICADA" | "LICENCIA_ORDINARIA" | "LICENCIA_ENFERMEDAD" | "VACACIONES">("AUSENCIA_INJUSTIFICADA");
  const [fechaDesde, setFechaDesde] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fechaHasta, setFechaHasta] = useState("");

  const handleRegister = async () => {
    if (!selectedEmpleado) return;
    setLoading(true);
    try {
      if (registroType === "FICHADA") {
        await api.post("/fichadas", {
          empleadoId: selectedEmpleado,
          tipo,
          origen,
          observaciones,
          creadoPor: "admin",
          timestamp: timestampManual
            ? new Date(timestampManual).toISOString()
            : new Date().toISOString(),
        });
        setTimestampManual("");
      } else {
        const start = new Date(fechaDesde);
        const end = fechaHasta ? new Date(fechaHasta) : start;
        let days = 1;
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = Math.abs(end.getTime() - start.getTime());
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        await api.post("/novedades", {
          empleadoId: selectedEmpleado,
          tipo: novedadTipo,
          fechaDesde,
          fechaHasta: fechaHasta ? fechaHasta : fechaDesde,
          cantidad: days,
          estado: "APROBADA", // By default approve it from Admin
          observaciones,
          esAutomatica: false,
        });
        setFechaDesde(format(new Date(), "yyyy-MM-dd"));
        setFechaHasta("");
      }
      setSuccess(true);
      fetchRecent();
      if (activeTab === "MOTOR") fetchInterpretaciones();
      setObservaciones("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(
        "Error al registrar: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (t: string) => {
    switch (t) {
      case "ENTRADA":
        return "Entrada";
      case "SALIDA":
        return "Salida";
      case "INICIO_DESCANSO":
        return "Inicio Descanso";
      case "FIN_DESCANSO":
        return "Fin Descanso";
      default:
        return t;
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Legajo: "L01",
        FechaHora: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        Tipo: "ENTRADA",
        Origen: "MANUAL",
        Observaciones: "Llegada tarde por tráfico",
      },
      {
        Legajo: "L01",
        FechaHora: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        Tipo: "SALIDA",
        Origen: "MANUAL",
        Observaciones: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fichadas");
    XLSX.writeFile(wb, "plantilla_fichadas.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportError("");
      setImportSuccess("");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImportLoading(true);
    setImportError("");
    setImportSuccess("");

    try {
      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(result, { type: "array" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const json = XLSX.utils.sheet_to_json(ws, { raw: false });
            resolve(json);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      if (!data || data.length === 0) {
        throw new Error(
          "El archivo está vacío o no tiene el formato correcto.",
        );
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          const legajo = row.Legajo?.toString();
          const empleado = empleados.find((e) => e.legajo === legajo);
          if (!empleado) {
            throw new Error(`Empleado con legajo ${legajo} no encontrado.`);
          }

          let dateStr = row.FechaHora || row.Fecha;
          if (!dateStr)
            throw new Error(`Falta FechaHora para legajo ${legajo}`);

          let timestamp = new Date(dateStr);
          if (isNaN(timestamp.getTime()) && typeof dateStr === "string") {
            const [datePart, timePart] = dateStr.split(" ");
            if (datePart && datePart.includes("/")) {
              const [d, m, y] = datePart.split("/");
              if (y && y.length === 4) {
                const timeStr = timePart || "00:00:00";
                timestamp = new Date(
                  `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${timeStr}`,
                );
              }
            }
          }

          if (isNaN(timestamp.getTime())) {
            throw new Error(`Fecha inválida para legajo ${legajo}: ${dateStr}`);
          }

          await api.post("/fichadas", {
            empleadoId: empleado.id,
            tipo: row.Tipo || "ENTRADA",
            origen: row.Origen || "MANUAL",
            observaciones: row.Observaciones || "",
            creadoPor: "admin_import",
            timestamp: timestamp.toISOString(),
          });
          successCount++;
        } catch (err) {
          console.error(err);
          errorCount++;
        }
      }

      setImportSuccess(
        `Importación: ${successCount} ok, ${errorCount} errores.`,
      );
      fetchRecent();
      if (activeTab === "MOTOR") fetchInterpretaciones();
      setFile(null);
    } catch (err: any) {
      setImportError(err.message || "Error al procesar el archivo Excel.");
    } finally {
      setImportLoading(false);
      const fileInput = document.getElementById(
        "excel-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">
            Control de Asistencia
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            NexoLaboral • Registro & Motor de Reglas
          </p>
        </div>
      </header>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("FICHADAS")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === "FICHADAS"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Registro Manual & Logs
        </button>
        <button
          onClick={() => setActiveTab("MOTOR")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === "MOTOR"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Motor de Interpretación
        </button>
      </div>

      {activeTab === "FICHADAS" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registro Manual */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 card-shadow flex flex-col space-y-6">
              <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-700">Registrar</h3>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-md">
                <button
                  onClick={() => setRegistroType("FICHADA")}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-all ${
                    registroType === "FICHADA"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Fichada
                </button>
                <button
                  onClick={() => setRegistroType("NOVEDAD")}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-all ${
                    registroType === "NOVEDAD"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Ausencia / Licencia
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                    Empleado
                  </label>
                  <select
                    value={selectedEmpleado}
                    onChange={(e) => setSelectedEmpleado(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.apellido}, {emp.nombre} (#{emp.legajo})
                      </option>
                    ))}
                  </select>
                </div>

                {registroType === "FICHADA" ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                        Fecha y Hora (Opcional - por defecto Actual)
                      </label>
                      <input
                        type="datetime-local"
                        value={timestampManual}
                        onChange={(e) => setTimestampManual(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                        Tipo de Fichada
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "ENTRADA", label: "Entrada", icon: LogIn },
                          { id: "SALIDA", label: "Salida", icon: LogOut },
                          {
                            id: "INICIO_DESCANSO",
                            label: "Inicio Desc.",
                            icon: Coffee,
                          },
                          { id: "FIN_DESCANSO", label: "Fin Desc.", icon: Clock },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTipo(t.id as any)}
                            className={`py-2 px-1 rounded-md border text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                              tipo === t.id
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                        Origen
                      </label>
                      <select
                        value={origen}
                        onChange={(e) => setOrigen(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                      >
                        <option value="MANUAL">Manual (Admin)</option>
                        <option value="BIOMETRICO">Dispositivo Biométrico</option>
                        <option value="QR">Código QR</option>
                        <option value="PIN">PIN / Teclado</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                        Tipo de Ausencia / Licencia
                      </label>
                      <select
                        value={novedadTipo}
                        onChange={(e) => setNovedadTipo(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                      >
                        <option value="AUSENCIA_INJUSTIFICADA">Ausencia Injustificada</option>
                        <option value="AUSENCIA_JUSTIFICADA">Ausencia Justificada</option>
                        <option value="LICENCIA_ORDINARIA">Licencia Ordinaria / Especial</option>
                        <option value="LICENCIA_ENFERMEDAD">Licencia por Enfermedad</option>
                        <option value="VACACIONES">Vacaciones</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                          Fecha Desde
                        </label>
                        <input
                          type="date"
                          value={fechaDesde}
                          onChange={(e) => setFechaDesde(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                          Fecha Hasta
                        </label>
                        <input
                          type="date"
                          value={fechaHasta}
                          onChange={(e) => setFechaHasta(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-slate-700"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Justificaciones, notas..."
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                  />
                </div>
              </div>

              <button
                disabled={!selectedEmpleado || loading}
                onClick={handleRegister}
                className="w-full bg-indigo-600 text-white py-3 rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? "Procesando..." : (registroType === "FICHADA" ? "Confirmar Fichada" : "Confirmar Novedad")}
              </button>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 justify-center text-green-700 bg-green-100 py-2 rounded font-bold text-[10px] uppercase"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Registro Guardado (Inmutable)
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Importación por Excel */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 card-shadow flex flex-col space-y-6">
              <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">Importar Excel</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Carga masiva
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-xs font-bold uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-50 transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Modelo
                </button>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                      Seleccionar archivo Excel
                    </span>
                    {file && (
                      <span className="text-[10px] text-slate-500">
                        {file.name}
                      </span>
                    )}
                  </label>
                </div>

                {importError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-200">
                    {importError}
                  </div>
                )}
                {importSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-md border border-emerald-200">
                    {importSuccess}
                  </div>
                )}

                <button
                  disabled={!file || importLoading}
                  onClick={handleImport}
                  className="w-full bg-emerald-600 text-white py-3 rounded-md font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                  {importLoading ? "Importando..." : "Subir y Registrar"}
                </button>
              </div>
            </div>
          </div>

          {/* Listado Reciente */}
          <div className="lg:col-span-2 bg-white rounded-xl card-shadow border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-700">
                Logs de Fichadas (Dato Crudo)
              </h3>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Inmutable
              </span>
            </div>
            <div className="flex-1 overflow-auto max-h-[600px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3 text-center">Tipo</th>
                    <th className="px-6 py-3">Timestamp / Origen</th>
                    <th className="px-6 py-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fichadas.map((f) => {
                    const d = new Date(f.timestamp);
                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase tracking-tighter">
                            {f.empleado?.nombre?.[0] || "?"}
                            {f.empleado?.apellido?.[0] || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {f.empleado?.apellido || "-"},{" "}
                              {f.empleado?.nombre || "-"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              # {f.empleado?.legajo || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${
                              f.tipo === "ENTRADA"
                                ? "bg-green-100 text-green-700"
                                : f.tipo === "SALIDA"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {getTipoLabel(f.tipo)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-700 font-bold">
                            {format(d, "dd/MM/yyyy HH:mm:ss")}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 flex gap-1 items-center">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {f.origen} • {f.creadoPor}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-500 italic max-w-[200px] truncate">
                            {f.observaciones || (
                              <span className="text-slate-300">
                                Sin observaciones
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl card-shadow border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-700">
                Dashboard de Interpretación
              </h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                Resultados calculados por el Motor de Reglas
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={fechaInterpretacion}
                onChange={(e) => setFechaInterpretacion(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-600"
              />
              <button
                onClick={fetchInterpretaciones}
                className="p-1.5 bg-slate-100 text-slate-600 rounded drop-shadow-sm hover:bg-slate-200 transition-colors"
                title="Recalcular vista"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                  Total Interpretaciones
                </div>
                <div className="text-2xl font-black text-slate-800">
                  {interpretaciones.length}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="text-[10px] uppercase font-bold text-red-400 tracking-widest mb-1">
                  Tardanzas Detectadas
                </div>
                <div className="text-2xl font-black text-red-700">
                  {interpretaciones.filter((i) => i.minutosTardanza > 0).length}
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-1">
                  Horas Extra (Casos)
                </div>
                <div className="text-2xl font-black text-amber-700">
                  {interpretaciones.filter((i) => i.minutosExtra > 0).length}
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-1">
                  Eventos Anómalos
                </div>
                <div className="text-2xl font-black text-indigo-700">
                  {
                    interpretaciones.filter(
                      (i) => i.resultado?.esDiaLaboral === false,
                    ).length
                  }
                </div>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Fichada Original</th>
                  <th className="px-4 py-3">Resultado Reglas</th>
                  <th className="px-4 py-3 text-right">Métricas Calculadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interpretaciones.map((inv) => {
                  let fichadaStr = "--:--";
                  if (inv.resultado?.horaEntrada || inv.resultado?.horaSalida) {
                    const e = inv.resultado?.horaEntrada || "--:--";
                    const s = inv.resultado?.horaSalida || "--:--";
                    fichadaStr = `${e} - ${s}`;
                  } else if (inv.fichada?.timestamp) {
                    try {
                      fichadaStr = format(
                        new Date(inv.fichada.timestamp),
                        "HH:mm",
                      );
                    } catch (e) {}
                  }

                  const tType =
                    inv.fichada?.tipo ||
                    (inv.resultado?.horaEntrada && inv.resultado?.horaSalida
                      ? "JORNADA"
                      : "DESCONOCIDO");
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800">
                          {inv.empleado?.apellido}, {inv.empleado?.nombre}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Leg: {inv.empleado?.legajo}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap border ${
                              tType === "ENTRADA"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : tType === "JORNADA"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {tType === "JORNADA"
                              ? "Jornada"
                              : getTipoLabel(tType)}
                          </span>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-xs whitespace-nowrap">
                            {fichadaStr}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 border-l-2 pl-3 border-indigo-200">
                          {inv.resultado?.esDiaLaboral === false && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold uppercase">
                              Día Inhábil
                            </span>
                          )}
                          {inv.minutosTardanza > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold uppercase flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Tardanza
                            </span>
                          )}
                          {inv.resultado?.salidaAnticipada && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-bold uppercase">
                              Salida Anticipada
                            </span>
                          )}
                          {inv.minutosExtra > 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">
                              Aplica Extra
                            </span>
                          )}
                          {Object.keys(inv.resultado || {}).length === 1 &&
                            inv.resultado?.tipoFichada &&
                            inv.minutosTardanza === 0 &&
                            inv.minutosExtra === 0 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">
                                Normal/Ok
                              </span>
                            )}
                          <div className="w-full mt-1 text-[10px] text-slate-500 italic">
                            {inv.resultado?.observaciones}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {inv.minutosTardanza > 0 && (
                          <div className="text-xs font-bold text-red-600 mb-0.5">
                            +{inv.minutosTardanza}m tardanza
                          </div>
                        )}
                        {inv.minutosExtra > 0 && (
                          <div className="text-xs font-bold text-emerald-600 mb-0.5">
                            +{inv.minutosExtra}m extra
                          </div>
                        )}
                        {inv.resultado?.minutosSalidaAnticipada > 0 && (
                          <div className="text-xs font-bold text-orange-600 mb-0.5">
                            -{inv.resultado.minutosSalidaAnticipada}m ant.
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                          {inv.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {interpretaciones.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400">
                      <Info className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        No hay interpretaciones para esta fecha
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
