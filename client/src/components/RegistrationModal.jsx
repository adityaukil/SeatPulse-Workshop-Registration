import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  User, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  Copy, 
  Check, 
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Ticket
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function RegistrationModal({ workshop, isOpen, onClose, isWaitlistMode = false, onOpenCancelModal, onPassRegistered }) {
  const { refreshWorkshops, refreshActivities, refreshEmails } = useSocket();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessData(null);
      setName('');
      setEmail('');
      setNotes('');
      setCopied(false);
    }
  }, [isOpen, workshop]);

  if (!isOpen || !workshop) return null;

  const isFull = workshop.is_full || workshop.seats_left <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side quick check
    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full name (minimum 2 characters).');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/workshops/${workshop.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          notes: notes.trim(),
          allowWaitlist: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Backend rejection (duplicate email, full workshop, etc.)
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Success!
      setSuccessData(data);
      if (data.status === 'REGISTERED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Save pass locally so user can always access their cancellation ID from the top bar!
      const newPass = {
        cancelToken: data.cancelToken,
        workshopId: workshop.id,
        workshopTitle: workshop.title,
        name: name.trim(),
        email: email.trim(),
        date: workshop.date,
        time: workshop.time,
        location: workshop.location,
        status: data.status,
        position: data.position || null,
        registeredAt: new Date().toISOString()
      };

      if (onPassRegistered) {
        onPassRegistered(newPass);
      }

      // Refresh data
      refreshWorkshops();
      refreshActivities();
      refreshEmails();

    } catch (err) {
      console.error('Registration fetch error:', err);
      setError('Network connection error. Could not reach registration server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (successData?.cancelToken) {
      navigator.clipboard.writeText(successData.cancelToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 z-10 animate-scale-in text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success View */}
        {successData ? (
          <div className="text-center py-2 animate-fade-in">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              successData.status === 'REGISTERED' 
                ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/30'
            }`}>
              {successData.status === 'REGISTERED' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <Hourglass className="w-10 h-10 animate-bounce" />
              )}
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {successData.status === 'REGISTERED' ? 'Seat Confirmed!' : 'Added to Waitlist!'}
            </h3>

            <p className="text-sm text-slate-300 max-w-sm mx-auto mb-5">
              {successData.message}
            </p>

            {/* Prominent Cancellation ID Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 text-left mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-indigo-400" />
                  <span>Your Cancellation ID / Token:</span>
                </span>
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <p className="font-mono text-xs text-white bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all font-semibold">
                {successData.cancelToken}
              </p>
              
              <div className="mt-2.5 p-2 rounded bg-indigo-900/30 border border-indigo-700/30 flex items-center gap-2 text-[11px] text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span>
                  Saved to your top <strong>Active Passes & Cancellation Bar</strong> so you never lose it!
                </span>
              </div>
            </div>

            {/* Workshop Summary Card */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left mb-6">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Workshop</p>
              <h4 className="font-semibold text-white text-base mt-0.5">{workshop.title}</h4>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {workshop.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {workshop.time}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30"
            >
              Done & View Passes
            </button>
          </div>
        ) : (
          /* Registration Form View */
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  {isFull ? 'Waitlist Registration' : 'Workshop Registration'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{workshop.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Instructor: <strong className="text-slate-300">{workshop.instructor}</strong> • {workshop.date}
              </p>
            </div>

            {/* Status Notice Banner */}
            {isFull ? (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 text-xs">
                <Hourglass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-100">Workshop is Currently at Full Capacity</p>
                  <p className="mt-0.5 text-amber-300/80">
                    Registering now puts you at <strong>Position #{workshop.waitlist_count + 1}</strong> on the priority waitlist. If an attendee cancels, you will be auto-promoted instantly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>{workshop.seats_left} seats</strong> remaining out of {workshop.max_seats}</span>
                </span>
                <span className="text-slate-400 font-mono">Real-Time Sync</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-2.5 text-xs animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-100">Registration Rejected by Backend</p>
                  <p className="mt-0.5 text-rose-300">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Confirmation pass & cancellation link will be delivered to this email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Questions or Topic Interests
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    placeholder="What are you hoping to learn in this workshop?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                    loading 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : isFull
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                      <span>Validating with Backend...</span>
                    </div>
                  ) : isFull ? (
                    <div className="flex items-center gap-2">
                      <Hourglass className="w-4 h-4" />
                      <span>Join Priority Waitlist (Pos #{workshop.waitlist_count + 1})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Confirm Workshop Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
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
