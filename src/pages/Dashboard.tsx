import { useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import { format, isToday, parseISO } from 'date-fns';
import { useAppStore, NovedadType, NovedadStatus } from '../store/useAppStore';

const StatCard = ({ title, value, detail, color, trendColor }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white p-5 rounded-xl card-shadow border-l-4 ${color}`}
  >
    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</div>
    <div className="flex items-baseline space-x-2">
      <span className="text-3xl font-bold text-slate-800">{value}</span>
      {detail && <span className={`${trendColor || 'text-slate-400'} text-xs font-medium`}>{detail}</span>}
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { 
    empleados, fetchEmployees, 
    novedades, fetchNovedades, 
    fichadas, fetchFichadas 
  } = useAppStore();

  useEffect(() => {
    fetchEmployees();
    fetchNovedades();
    fetchFichadas();
  }, [fetchEmployees, fetchNovedades, fetchFichadas]);

  const stats = useMemo(() => {
    const empleadosActivos = empleados.filter(e => e.estado === 'ACTIVO').length;
    
    const tardanzasHoy = novedades.filter(n => {
      if (n.tipo !== NovedadType.TARDANZA) return false;
      try { return isToday(parseISO(n.fechaDesde)); } catch (e) { return false; }
    }).length;

    const ausenciasHoy = novedades.filter(n => {
      if (n.tipo !== NovedadType.AUSENCIA) return false;
      try { return isToday(parseISO(n.fechaDesde)); } catch (e) { return false; }
    }).length;

    const horasExtras = novedades.filter(n => 
      [NovedadType.HORA_EXTRA_50, NovedadType.HORA_EXTRA_100].includes(n.tipo)
    ).reduce((sum, n) => sum + (Number(n.cantidad) || 0), 0);

    const pendientes = novedades.filter(n => n.estado === NovedadStatus.PENDIENTE);

    // Some simple chart data based on fichadas per day within the last 7 days
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let chartData = Array.from({length: 7}, (_, i) => ({
      name: days[i],
      fichadas: 0
    }));

    fichadas.forEach(f => {
      try {
        const d = parseISO(f.timestamp);
        chartData[d.getDay()].fichadas++;
      } catch (e) {}
    });

    return {
      empleadosActivos,
      tardanzasHoy,
      ausenciasHoy,
      horasExtras,
      pendientes,
      chartData
    };
  }, [empleados, novedades, fichadas]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Empleados Activos" 
          value={stats.empleadosActivos} 
          detail="Total registrados" 
          trendColor="text-slate-400"
          color="border-indigo-500"
        />
        <StatCard 
          title="Tardanzas Hoy" 
          value={stats.tardanzasHoy} 
          detail="" 
          color="border-amber-500"
        />
        <StatCard 
          title="Ausencias" 
          value={stats.ausenciasHoy} 
          detail="Hoy" 
          trendColor="text-red-500"
          color="border-red-500"
        />
        <StatCard 
          title="Horas Extra (Acum)" 
          value={`${stats.horasExtras}hs`} 
          detail="Total" 
          color="border-emerald-500"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl card-shadow border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-700">Actividad de Fichadas</h3>
          </div>
          <div className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorFichadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="fichadas" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorFichadas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700">Novedades Pendientes</h3>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {stats.pendientes.length}
            </span>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[350px]">
            {stats.pendientes.length > 0 ? stats.pendientes.map((nov) => {
              const emp = empleados.find(e => e.id === nov.empleadoId);
              let fechaFormateada = nov.fechaDesde;
              try {
                fechaFormateada = format(parseISO(nov.fechaDesde), 'dd/MM HH:mm');
              } catch(e) {}

              return (
                <div key={nov.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">
                      {nov.tipo.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">{fechaFormateada}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    {emp ? `${emp.apellido}, ${emp.nombre}` : 'Empleado Desconocido'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-1">
                    {nov.observaciones || 'Sin observaciones'}
                  </div>
                </div>
              );
            }) : (
              <div className="text-sm text-slate-500 text-center mt-4">
                No hay novedades pendientes.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
