import { Search, Bell, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Navbar() {
  const { currentUser } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-40 sticky top-0 ml-64">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-slate-800 uppercase tracking-tight">Panel General</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Removed search and bell as requested */}
      </div>
    </header>
  );
}
