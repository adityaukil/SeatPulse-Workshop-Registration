import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Server, 
  Lock, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function SmtpSettingsModal({ isOpen, onClose }) {
  const { addToast } = useSocket();
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState('');
  const [secure, setSecure] = useState(false);
  
  const [isEthereal, setIsEthereal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/smtp');
      const data = await res.json();
      if (data.success) {
        setIsEthereal(data.isEthereal);
        if (data.settings) {
          setHost(data.settings.host || '');
          setPort(data.settings.port || 587);
          setUser(data.settings.user || '');
          setPass(data.settings.pass || '');
          setFrom(data.settings.from || '');
          setSecure(Boolean(data.settings.secure));
        }
      }
    } catch (err) {
      console.error('Failed to fetch SMTP settings:', err);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          user,
          pass,
          from,
          secure
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsEthereal(data.isEthereal);
        setStatusMsg(data.message || 'SMTP settings saved and verified successfully!');
        addToast({
          type: 'success',
          title: 'Mail Server Configured',
          message: 'Real emails will now be dispatched to recipient inboxes.'
        });
      } else {
        setErrorMsg(data.error || 'Failed to connect to SMTP server.');
      }
    } catch (err) {
      setErrorMsg('Network error while saving SMTP settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToEthereal = async () => {
    setLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: '', user: '', pass: '' })
      });
      const data = await res.json();
      if (data.success) {
        setIsEthereal(true);
        setHost('');
        setUser('');
        setPass('');
        setStatusMsg('Switched to Ethereal SMTP with instant web preview URLs.');
      }
    } catch (err) {
      setErrorMsg('Failed to reset SMTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      setErrorMsg('Please enter a valid email address to receive the test email.');
      return;
    }

    setTestLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim(), name: 'Workshop Enthusiast' })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ Test email dispatched to ${testEmail}! Check your inbox or web preview.`);
        addToast({
          type: 'success',
          title: 'Test Email Sent',
          message: `Dispatched to ${testEmail}`
        });
      } else {
        setErrorMsg(data.error || 'Failed to dispatch test email.');
      }
    } catch (err) {
      setErrorMsg('Failed to contact test email service.');
    } finally {
      setTestLoading(false);
    }
  };

  const setGmailPreset = () => {
    setHost('smtp.gmail.com');
    setPort(587);
    setSecure(false);
    setFrom('"SeatPulse Workshops" <your-email@gmail.com>');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 animate-scale-in text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              Email Dispatch Engine
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">Mail Server (SMTP) Configuration</h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure custom SMTP (Gmail, Brevo, Outlook, Resend) to deliver real emails to actual recipient inboxes, or use Ethereal test mail.
          </p>
        </div>

        {/* Current status banner */}
        <div className={`p-3 rounded-xl border text-xs mb-4 flex items-center justify-between ${
          isEthereal 
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-200' 
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isEthereal ? 'bg-purple-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>Mode: <strong>{isEthereal ? 'Ethereal Web Preview Mailbox' : 'Real Custom SMTP Inbox Delivery'}</strong></span>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SMTP Form */}
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Quick Provider Preset:</span>
            <button
              type="button"
              onClick={setGmailPreset}
              className="text-[11px] font-bold px-2 py-1 rounded bg-slate-800 text-indigo-300 hover:text-white border border-slate-700"
            >
              Fill Gmail SMTP Preset
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.gmail.com or smtp.brevo.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Username / Email</label>
              <input
                type="text"
                placeholder="your.email@gmail.com"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Password / App Password</label>
              <input
                type="password"
                placeholder="Gmail App Password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Sender "From" Name & Email</label>
            <input
              type="text"
              placeholder='"SeatPulse Workshops" <workshops@yourdomain.com>'
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="secure"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="secure" className="text-slate-300 text-xs cursor-pointer">
              Use SSL/TLS (Check for Port 465, Uncheck for Port 587/STARTTLS)
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3">
            <button
              type="button"
              onClick={handleResetToEthereal}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Reset to Default (Ethereal)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30"
            >
              {loading ? 'Verifying SMTP...' : 'Save & Activate SMTP'}
            </button>
          </div>
        </form>

        {/* Test Email Section */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Send Test Email to Your Actual Email Address</span>
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your personal email..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testLoading}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shrink-0"
            >
              {testLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Test</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
