import React from 'react';
import { AppLayout } from '../components/Layout';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const DashboardView: React.FC = () => {
  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Recent Intakes</h2>
          <p className="text-slate-400 mt-2">Manage your client briefs and track processing status.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-emerald-400 mb-2">
              <CheckCircle2 size={24} />
              <h3 className="font-semibold text-slate-200">Completed</h3>
            </div>
            <p className="text-3xl font-bold">12</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-cyan-400 mb-2">
              <Clock size={24} />
              <h3 className="font-semibold text-slate-200">Processing</h3>
            </div>
            <p className="text-3xl font-bold">3</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-rose-400 mb-2">
              <AlertCircle size={24} />
              <h3 className="font-semibold text-slate-200">Needs Attention</h3>
            </div>
            <p className="text-3xl font-bold">1</p>
          </div>
        </div>

        {/* Table placeholder */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="p-4 text-sm font-semibold text-slate-400">Client / Project</th>
                <th className="p-4 text-sm font-semibold text-slate-400">Type</th>
                <th className="p-4 text-sm font-semibold text-slate-400">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-400">Date</th>
                <th className="p-4 text-sm font-semibold text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <p className="font-medium">Red Sea Logistics App</p>
                  <p className="text-sm text-slate-500">Ali Hassan</p>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Voice + Image
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Completed
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-400">2 mins ago</td>
                <td className="p-4 text-right">
                  <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300">View Brief</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};
