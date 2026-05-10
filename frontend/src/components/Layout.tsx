import React from 'react';
import { LayoutDashboard, PlusCircle, Settings, LogOut } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Briefly
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Agency Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg text-emerald-400 transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 rounded-lg transition-colors">
            <PlusCircle size={20} />
            <span className="font-medium">New Intake</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 rounded-lg transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-1">
            <LogOut size={20} />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
