import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  UserCheck, 
  Hourglass, 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  Ticket, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  X,
  RotateCcw
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function MyRegistrations({ 
  savedPasses = [], 
  onRemovePass, 
  onCancelPass, 
  onOpenCancelModalWithToken,
  setActiveTab
}) {
  const { workshops, refreshWorkshops, refreshActivities, refreshEmails, addToast } = useSocket();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [serverRegistrations, setServerRegistrations] = useState([]);
  const [copiedToken, setCopiedToken] = useState(null);

  // Default to saved email if exists
  useEffect(() => {
    const validSaved = savedPasses.filter(p => p && p.email && p.status !== 'CANCELLED');
    if (validSaved.length > 0 && !email) {
      setEmail(validSaved[0].email);
    }
  }, [savedPasses, email]);

  const handleLookup = async (lookupEmail = email) => {
    const cleanEmail = (lookupEmail || '').trim();
    if (!cleanEmail) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/registrations/my?email=${encodeURIComponent(cleanEmail)}`);
      const json = await res.json();
      if (json.success) {
        // Filter out any cancelled or invalid items
        const activeOnly = (json.registrations || []).filter(r => r && r.status !== 'CANCELLED' && r.name);
        setServerRegistrations(activeOnly);
      } else {
        setServerRegistrations([]);
      }
    } catch (err) {
      console.error('My registrations lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (token) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2200);
  };

  const handleCancelRegistration = async (token, workshopTitle) => {
    if (!token) return;
    if (confirm(`Are you sure you want to cancel your seat for "${workshopTitle || 'Workshop'}"? Your spot will be reallocated to the next student in queue.`)) {
      try {
        const res = await fetch('/api/registrations/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        // Always remove from local list upon cancellation
        if (onRemovePass) {
          onRemovePass(token);
        }
        setServerRegistrations(prev => prev.filter(r => r.cancel_token !== token));

        if (data.success) {
          addToast({
            type: 'warning',
            title: 'Registration Cancelled',
            message: data.message
          });
        } else {
          addToast({
            type: 'info',
            title: 'Notice',
            message: data.error || 'Pass removed.'
          });
        }

        // Refresh global state
        refreshWorkshops();
        refreshActivities();
        refreshEmails();
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
  };

  const handleDismissCard = (token) => {
    if (onRemovePass && token) {
      onRemovePass(token);
    }
    setServerRegistrations(prev => prev.filter(r => r.cancel_token !== token));
    addToast({
      type: 'info',
      title: 'Pass Dismissed',
      message: 'Card removed from your saved passes view.'
    });
  };

  const handleClearAllSaved = () => {
    if (confirm('Clear all locally saved passes from your device? (Your confirmed seats on the server will remain intact).')) {
      try {
        localStorage.removeItem('seatpulse_saved_passes');
        savedPasses.forEach(p => {
          if (p.cancelToken && onRemovePass) onRemovePass(p.cancelToken);
        });
        setServerRegistrations([]);
        setSearched(false);
        addToast({
          type: 'info',
          title: 'Saved Passes Cleared',
          message: 'Local pass cache has been reset.'
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Combine and strictly sanitize active passes
  const validSavedPasses = savedPasses.filter(p => p && p.cancelToken && p.status !== 'CANCELLED' && (p.name || p.workshopTitle));
  const allDisplayPasses = [...validSavedPasses];

  serverRegistrations.forEach(sr => {
    if (sr && sr.cancel_token && sr.status !== 'CANCELLED') {
      const exists = allDisplayPasses.some(p => p.cancelToken === sr.cancel_token || (p.workshopId === sr.workshop_id && p.email?.toLowerCase() === sr.email?.toLowerCase()));
      if (!exists) {
        allDisplayPasses.push({
          cancelToken: sr.cancel_token,
          workshopId: sr.workshop_id,
          workshopTitle: sr.workshop_title || 'Workshop Registration',
          name: sr.name || 'Student',
          email: sr.email,
          date: sr.date,
          time: sr.time,
          location: sr.location,
          status: sr.status,
          registeredAt: sr.registered_at
        });
      }
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20 shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    My Workshop Passes & Cancellation Portal
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {allDisplayPasses.length} Active {allDisplayPasses.length === 1 ? 'Pass' : 'Passes'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage your confirmed seats, copy cancellation IDs, or release passes so students in the queue can participate.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {allDisplayPasses.length > 0 && (
                <button
                  onClick={handleClearAllSaved}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  title="Clear locally saved passes"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  <span>Clear Cache</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('workshops')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse Workshops</span>
              </button>
            </div>
          </div>

          {/* Email Search Lookup Form */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleLookup(); }} 
              className="flex flex-col sm:flex-row gap-2 max-w-xl"
            >
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Lookup all registrations by email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Lookup Passes</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Test Chips */}
            <div className="mt-3 flex items-center flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="text-slate-500">Quick Demo Search:</span>
              <button 
                type="button" 
                onClick={() => { setEmail('bruce.wayne@example.com'); handleLookup('bruce.wayne@example.com'); }}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              >
                bruce.wayne@example.com
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail('oliver.queen@example.com'); handleLookup('oliver.queen@example.com'); }}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              >
                oliver.queen@example.com (Waitlist)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Passes List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Active Registrations & Priority Waitlist Passes</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {allDisplayPasses.length} {allDisplayPasses.length === 1 ? 'Record' : 'Records'} Found
          </span>
        </div>

        {allDisplayPasses.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 border border-slate-800/80">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40 text-amber-400" />
            <h4 className="text-base font-bold text-white">No Active Registrations Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searched 
                ? `No active passes or waitlist spots were found for ${email}.`
                : 'You have no active workshop passes saved. Explore our workshops to claim a seat!'}
            </p>
            <button
              onClick={() => setActiveTab('workshops')}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
            >
              <span>Explore Available Workshops</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDisplayPasses.map((pass) => {
              const isConfirmed = pass.status === 'REGISTERED';
              const isCopied = copiedToken === pass.cancelToken;

              return (
                <div 
                  key={pass.cancelToken}
                  className="glass-card-interactive rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 relative overflow-hidden border border-slate-700/60 shadow-lg group"
                >
                  <div>
                    {/* Header: Status badge & Dismiss Button */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Confirmed Seat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          <Hourglass className="w-3.5 h-3.5 animate-spin-slow" />
                          <span>Waitlist #{pass.position || 1}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {pass.registeredAt ? new Date(pass.registeredAt).toLocaleDateString() : 'Active Pass'}
                        </span>
                        
                        {/* Dismiss card button */}
                        <button
                          onClick={() => handleDismissCard(pass.cancelToken)}
                          className="text-slate-500 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Dismiss this pass from view"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Workshop Title */}
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-2">
                      {pass.workshopTitle || 'Workshop Registration'}
                    </h4>

                    {/* Attendee details */}
                    <p className="text-xs text-slate-300 mt-1">
                      Registered Attendee: <strong className="text-white">{pass.name}</strong> {pass.email ? `(${pass.email})` : ''}
                    </p>

                    {/* Date & Location */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap gap-3 text-xs text-slate-400">
                      {pass.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {pass.date}
                        </span>
                      )}
                      {pass.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {pass.time}
                        </span>
                      )}
                      {pass.location && (
                        <span className="flex items-center gap-1.5 w-full text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{pass.location}</span>
                        </span>
                      )}
                    </div>

                    {/* Cancellation ID Box with One-Click Copy */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Cancellation ID / Pass Token
                        </p>
                        <p className="font-mono text-xs text-indigo-300 truncate select-all mt-0.5">
                          {pass.cancelToken}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopy(pass.cancelToken)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                          isCopied 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40'
                        }`}
                        title="Copy cancellation ID to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy ID'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Seat Cancellation Action */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleCancelRegistration(pass.cancelToken, pass.workshopTitle)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Cancel This Registration</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
