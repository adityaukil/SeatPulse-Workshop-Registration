import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ticket, 
  Mail, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  UserX
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function CancelModal({ isOpen, onClose, initialToken = '', initialWorkshopId = null }) {
  const { workshops, refreshWorkshops, refreshActivities, refreshEmails, addToast } = useSocket();
  const [mode, setMode] = useState('token'); // 'token' | 'email'
  const [token, setToken] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResult(null);
      if (initialToken) {
        setToken(initialToken);
        setMode('token');
      }
      if (initialWorkshopId) {
        setSelectedWorkshop(String(initialWorkshopId));
      } else if (workshops.length > 0) {
        setSelectedWorkshop(String(workshops[0].id));
      }
    }
  }, [isOpen, initialToken, initialWorkshopId, workshops]);

  if (!isOpen) return null;

  const handleCancel = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = mode === 'token' 
        ? { token: token.trim() }
        : { workshopId: Number(selectedWorkshop), email: email.trim() };

      const res = await fetch('/api/registrations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Cancellation failed. Please check your details.');
        return;
      }

      setResult(data);
      addToast({
        type: 'warning',
        title: 'Registration Cancelled',
        message: data.message
      });

      refreshWorkshops();
      refreshActivities();
      refreshEmails();

    } catch (err) {
      console.error('Cancellation error:', err);
      setError('Network error. Could not contact cancellation service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 z-10 animate-scale-in text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {result ? (
          <div className="text-center py-2 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/30 flex items-center justify-center mb-4">
              <UserX className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              Registration Cancelled
            </h3>

            <p className="text-sm text-slate-300 max-w-sm mx-auto mb-6">
              Your registration for <strong className="text-white">"{result.details.workshopTitle}"</strong> has been successfully released.
            </p>

            {/* Waitlist Auto-Promotion Highlight */}
            {result.details.promotedStudent ? (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-left mb-6 animate-scale-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Automatic Waitlist Promotion Triggered!</span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Your cancelled seat was instantly awarded to the next student in queue:
                </p>
                <div className="mt-2 p-2.5 rounded bg-slate-950/80 border border-emerald-900 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{result.details.promotedStudent.name}</span>
                  <span className="text-emerald-400 font-mono">{result.details.promotedStudent.email}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  📧 An automated confirmation email was dispatched to {result.details.promotedStudent.name}.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left mb-6">
                <p className="text-xs text-slate-300">
                  ✅ 1 seat is now open and available for new attendees in this workshop.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  Self-Service Cancellation
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Cancel Workshop Seat</h3>
              <p className="text-xs text-slate-400 mt-1">
                Release your seat so students on the waitlist can participate.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('token'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'token'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Use Cancellation Token
              </button>
              <button
                type="button"
                onClick={() => { setMode('email'); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'email'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                By Workshop & Email
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-2.5 text-xs animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCancel} className="space-y-4">
              {mode === 'token' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cancellation Token <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Ticket className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Paste token from confirmation email"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in your registration confirmation email or registration receipt.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Workshop <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={selectedWorkshop}
                        onChange={(e) => setSelectedWorkshop(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
                      >
                        {workshops.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.title} ({w.date})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Registered Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. alex@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Confirm & Release My Seat</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
