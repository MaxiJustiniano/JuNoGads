import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle } from "lucide-react";
import api from "../lib/api";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [config, setConfig] = useState({
    toleranciaEntradaMinutos: 5,
    toleranciaSalidaMinutos: 0,
    umbralHorasExtraMinutos: 30,
    tiempoMinimoDescansoMinutos: 60,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get("/configuracion");
      if (res.data) {
        setConfig({
          toleranciaEntradaMinutos: res.data.toleranciaEntradaMinutos ?? 5,
          toleranciaSalidaMinutos: res.data.toleranciaSalidaMinutos ?? 0,
          umbralHorasExtraMinutos: res.data.umbralHorasExtraMinutos ?? 30,
          tiempoMinimoDescansoMinutos:
            res.data.tiempoMinimoDescansoMinutos ?? 60,
        });
      }
    } catch (error) {
      console.error("Error al cargar configuración", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Evitar negativos
    const num = Math.max(0, parseInt(value) || 0);
    setConfig((prev) => ({ ...prev, [name]: num }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/configuracion", config);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error al guardar configuración", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">
          Configuración Global
        </h1>
        <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
          NexoLaboral • Parámetros del Motor de Reglas
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 card-shadow space-y-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Reglas de Asistencia
            </h2>
            <p className="text-xs text-slate-500">
              Ajusta los umbrales de tiempo para las fichadas y horas extras.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tolerancia de Entrada (minutos)
            </label>
            <p className="text-[10px] text-slate-500 mb-2">
              Tiempo de gracia antes de marcar tardanza.
            </p>
            <input
              type="number"
              min="0"
              name="toleranciaEntradaMinutos"
              value={config.toleranciaEntradaMinutos}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tolerancia de Salida (minutos)
            </label>
            <p className="text-[10px] text-slate-500 mb-2">
              Umbral de salida anticipada permitida.
            </p>
            <input
              type="number"
              min="0"
              name="toleranciaSalidaMinutos"
              value={config.toleranciaSalidaMinutos}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Umbral Horas Extra (minutos)
            </label>
            <p className="text-[10px] text-slate-500 mb-2">
              Mínimo de tiempo extra requerido para generar novedad.
            </p>
            <input
              type="number"
              min="0"
              name="umbralHorasExtraMinutos"
              value={config.umbralHorasExtraMinutos}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tiempo Mínimo de Descanso (minutos)
            </label>
            <p className="text-[10px] text-slate-500 mb-2">
              Duración base obligatoria para el descanso.
            </p>
            <input
              type="number"
              min="0"
              name="tiempoMinimoDescansoMinutos"
              value={config.tiempoMinimoDescansoMinutos}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="h-8 flex items-center">
            {showSuccess && (
              <span className="text-emerald-600 text-sm font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-4 h-4" /> Guardado exitosamente
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
