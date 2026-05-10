import React from 'react';
import { CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';

export const PublicBriefView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-200">
      {/* Top Bar */}
      <div className="bg-slate-950 text-slate-50 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Briefly</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 text-sm font-semibold hover:text-cyan-400 transition-colors">Request Changes</button>
          <button className="px-6 py-2 text-sm font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <CheckCircle size={16} />
            Approve & Sign Off
          </button>
        </div>
      </div>

      {/* Main Document */}
      <main className="max-w-3xl mx-auto py-12 px-6">
        <header className="mb-12 border-b border-slate-200 pb-8">
          <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-2">Project Specification</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-950 mb-4">Red Sea Logistics Platform</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            A comprehensive tracking and risk management platform for Egyptian importers, focusing on real-time port congestion and demurrage cost calculations.
          </p>
        </header>

        <section className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm">1</span>
            Core Goals
          </h3>
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-2">Real-time AIS Tracking</h4>
              <p className="text-slate-600">Integrate with maritime APIs to track vessel locations approaching Alexandria and Damietta ports.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-2">Demurrage Calculator</h4>
              <p className="text-slate-600">Automated financial risk calculation based on port delays and container dwell times.</p>
            </div>
          </div>
        </section>

        {/* Ambiguity Highlights (The "Wow" Factor) */}
        <section className="mb-12 bg-rose-50 border border-rose-100 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertTriangle size={120} className="text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-rose-900 mb-2 relative z-10">Action Required</h3>
          <p className="text-rose-700 mb-6 relative z-10">We found a few missing details needed to finalize the timeline.</p>
          
          <div className="space-y-4 relative z-10">
            <div className="bg-white/80 backdrop-blur border border-rose-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <MessageSquare className="text-rose-500 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-slate-900">Missing API Key Provisioning</h4>
                  <p className="text-slate-600 text-sm mt-1 mb-4">You mentioned integrating MarineTraffic, but didn't specify if your agency has an enterprise license yet.</p>
                  
                  {/* Generated WhatsApp draft */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested Reply</p>
                    <p className="text-slate-800 text-sm font-medium">"Hey Ali, regarding the MarineTraffic API — do you already have an enterprise license, or should we include the subscription cost in our quote?"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
