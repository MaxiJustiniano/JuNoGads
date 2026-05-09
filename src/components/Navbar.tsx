import { Search, Bell, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Navbar() {
  const { currentUser } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-40 sticky top-0 ml-64">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-slate-800 uppercase tracking-tight">Panel General</h1>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Período: Mayo 2026</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar empleado..." 
            className="bg-slate-100 border-none rounded-md px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
