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

const data = [
  { name: 'Lun', fichadas: 45, tardanzas: 2 },
  { name: 'Mar', fichadas: 52, tardanzas: 1 },
  { name: 'Mie', fichadas: 48, tardanzas: 4 },
  { name: 'Jue', fichadas: 61, tardanzas: 3 },
  { name: 'Vie', fichadas: 55, tardanzas: 5 },
  { name: 'Sab', fichadas: 12, tardanzas: 0 },
  { name: 'Dom', fichadas: 0, tardanzas: 0 },
];

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
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Empleados Activos" 
          value="48" 
          detail="+2 este mes" 
          trendColor="text-green-500"
          color="border-indigo-500"
        />
        <StatCard 
          title="Tardanzas Hoy" 
          value="12" 
          detail="8.4% del total" 
          color="border-amber-500"
        />
        <StatCard 
          title="Ausencias" 
          value="4" 
          detail="Alerta Crítica" 
          trendColor="text-red-500"
          color="border-red-500"
        />
        <StatCard 
          title="Horas Extra (Acum)" 
          value="156hs" 
          detail="vs 140hs ayer" 
          color="border-emerald-500"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl card-shadow border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-700">Actividad de Fichadas e Interpretación</h3>
            <button className="text-xs text-indigo-600 font-semibold hover:underline">Ver histórico completo</button>
          </div>
          <div className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">4</span>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">
                    {['LICENCIA MÉDICA', 'VACACIONES', 'TARDANZA', 'HORA EXTRA'][i-1]}
                  </span>
                  <span className="text-[10px] text-slate-400">Hoy, 09:{15 + i*5}</span>
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {['Sosa, Ricardo', 'Méndez, Julia', 'García, Pedro', 'Martínez, Ana'][i-1]}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-1">
                  {['Presentó certificado por 48hs.', 'Solicitud cargada por RRHH.', 'Ingreso demorado tráfico.', 'Autorización pendiente jefe planta.'][i-1]}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <button className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
              Gestionar Novedades
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
