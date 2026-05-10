import React, { useState } from 'react';
import { AppLayout } from '../components/Layout';
import { UploadCloud, Mic, Send } from 'lucide-react';
import { useIntakeStore } from '../store/useIntakeStore';

export const IntakeView: React.FC = () => {
  const { rawText, setRawText, status, submitIntake } = useIntakeStore();
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitIntake();
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">New Project Intake</h2>
          <p className="text-slate-400 mt-2">Dump all client notes, voice messages, and screenshots here. We'll structure it.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text Area */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-1 backdrop-blur-sm focus-within:border-cyan-500/50 transition-colors">
            <textarea
              className="w-full h-48 bg-transparent text-slate-100 p-4 resize-none outline-none placeholder:text-slate-600"
              placeholder="Paste raw notes from WhatsApp, email, or meeting transcripts..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          {/* Media Dropzone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-900/20 group">
              <div className="p-3 bg-slate-800 group-hover:bg-emerald-500/10 rounded-full mb-4 transition-colors">
                <UploadCloud size={24} className="text-slate-400 group-hover:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-200">Upload Screenshots</h3>
              <p className="text-sm text-slate-500 mt-1">Drag & drop or click to browse</p>
            </div>

            <div 
              className={`border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isRecording ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'bg-slate-900/20 hover:border-cyan-500/50 hover:bg-slate-800/30'}`}
              onClick={() => setIsRecording(!isRecording)}
            >
              <div className={`p-4 rounded-full mb-4 transition-colors ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-cyan-400'}`}>
                <Mic size={32} />
              </div>
              <h3 className="font-semibold text-slate-200">{isRecording ? 'Recording...' : 'Record Voice Note'}</h3>
              <p className="text-sm text-slate-500 mt-1">{isRecording ? 'Click to stop' : 'Record client meeting or voice memo'}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={(!rawText && !isRecording) || status !== 'IDLE'}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-lg hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Send size={18} />
              {status === 'IDLE' && 'Generate Brief'}
              {status === 'UPLOADING' && 'Uploading...'}
              {status === 'PROCESSING' && 'AI is Analyzing...'}
              {status === 'COMPLETED' && 'Brief Ready!'}
              {status === 'ERROR' && 'Try Again'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};
