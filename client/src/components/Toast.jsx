import React from 'react';
import { useSocket } from '../context/SocketContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-fade-in ${
              isSuccess 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {isInfo && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
              <p className="text-xs mt-1 text-slate-300 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
