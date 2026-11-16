import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { 
  ShieldCheck, 
  Users, 
  Hourglass, 
  UserX, 
  Plus, 
  Download, 
  Search, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Settings,
  Globe,
  ExternalLink,
  Radio,
  Inbox,
  Send
} from 'lucide-react';

const FOUNDER_ACCESS_KEY = 'AUJU26';

export default function OrganizerDashboard() {
  const { workshops, activities, emails, refreshWorkshops, refreshActivities, refreshEmails, addToast } = useSocket();
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(workshops[0]?.id || 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' | 'waitlist' | 'cancelled'
  const [founderSection, setFounderSection] = useState('registries'); // 'registries' | 'emails' | 'smtp'
  
  // Security Authentication State
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('founder_authenticated') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Email Inspector state
  const [selectedEmail, setSelectedEmail] = useState(emails[0] || null);
  const currentEmail = selectedEmail || emails[0] || null;

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [isEthereal, setIsEthereal] = useState(true);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [smtpStatusMsg, setSmtpStatusMsg] = useState(null);
  const [smtpErrorMsg, setSmtpErrorMsg] = useState(null);

  // Create Workshop Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newInstructorRole, setNewInstructorRole] = useState('');
  const [newCategory, setNewCategory] = useState('Technology');
  const [newDate, setNewDate] = useState('Nov 15, 2026');
  const [newTime, setNewTime] = useState('10:00 AM - 1:00 PM EST');
  const [newLocation, setNewLocation] = useState('Main Auditorium & Zoom');
  const [newMaxSeats, setNewMaxSeats] = useState(25);
  const [newTags, setNewTags] = useState('Engineering, Hands-on');
  const [createLoading, setCreateLoading] = useState(false);

  // Sync selectedWorkshopId when workshops change
  useEffect(() => {
    if (!selectedWorkshopId && workshops.length > 0) {
      setSelectedWorkshopId(workshops[0].id);
    }
  }, [workshops, selectedWorkshopId]);

  // Fetch registrations for selected workshop
  const fetchRegistrations = async (id) => {
    if (!id || !isUnlocked) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workshops/${id}/registrations`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching organizer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch('/api/settings/smtp');
      const d = await res.json();
      if (d.success) {
        setIsEthereal(d.isEthereal);
        if (d.settings) {
          setSmtpHost(d.settings.host || '');
          setSmtpPort(d.settings.port || 587);
          setSmtpUser(d.settings.user || '');
          setSmtpPass(d.settings.pass || '');
          setSmtpFrom(d.settings.from || '');
          setSmtpSecure(Boolean(d.settings.secure));
        }
      }
    } catch (err) {
      console.error('Failed to fetch SMTP settings:', err);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      if (selectedWorkshopId) fetchRegistrations(selectedWorkshopId);
      fetchSmtpSettings();
    }
  }, [selectedWorkshopId, isUnlocked, workshops]);

  const handleUnlock = (e) => {
    e.preventDefault();
    setAuthError('');
    if (passwordInput.trim() === FOUNDER_ACCESS_KEY) {
      setUnlocking(true);
      setTimeout(() => {
        setIsUnlocked(true);
        sessionStorage.setItem('founder_authenticated', 'true');
        setUnlocking(false);
        addToast({
          type: 'success',
          title: 'Access Granted',
          message: 'Founder authentication verified. Welcome back.'
        });
      }, 350);
    } else {
      setAuthError('Access Denied: Incorrect Founder Passcode.');
    }
  };

  const handleLockPortal = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('founder_authenticated');
    setPasswordInput('');
    addToast({
      type: 'info',
      title: 'Portal Locked',
      message: 'Founder security session closed.'
    });
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpStatusMsg(null);
    setSmtpErrorMsg(null);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
          secure: smtpSecure
        })
      });
      const d = await res.json();
      if (d.success) {
        setIsEthereal(d.isEthereal);
        setSmtpStatusMsg(d.message || 'SMTP settings verified and active!');
        addToast({
          type: 'success',
          title: 'Mail Server Configured',
          message: 'Real emails will be delivered to recipient inboxes.'
        });
      } else {
        setSmtpErrorMsg(d.error || 'Failed to connect to SMTP server.');
      }
    } catch (err) {
      setSmtpErrorMsg('Network error while connecting to SMTP server.');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleResetToEthereal = async () => {
    setSmtpLoading(true);
    setSmtpStatusMsg(null);
    setSmtpErrorMsg(null);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: '', user: '', pass: '' })
      });
      const d = await res.json();
      if (d.success) {
        setIsEthereal(true);
        setSmtpHost('');
        setSmtpUser('');
        setSmtpPass('');
        setSmtpStatusMsg('Switched to Ethereal SMTP with instant web preview URLs.');
      }
    } catch (err) {
      setSmtpErrorMsg('Failed to reset SMTP.');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      setSmtpErrorMsg('Please enter a valid recipient email address.');
      return;
    }
    setTestLoading(true);
    setSmtpStatusMsg(null);
    setSmtpErrorMsg(null);
    try {
      const res = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim(), name: 'Founder Test' })
      });
      const d = await res.json();
      if (d.success) {
        setSmtpStatusMsg(`✅ Test email dispatched to ${testEmail}! Check your inbox or web preview.`);
        addToast({
          type: 'success',
          title: 'Test Email Sent',
          message: `Dispatched to ${testEmail}`
        });
        refreshEmails();
      } else {
        setSmtpErrorMsg(d.error || 'Failed to dispatch test email.');
      }
    } catch (err) {
      setSmtpErrorMsg('Failed to contact test email service.');
    } finally {
      setTestLoading(false);
    }
  };

  // Admin remove / cancel attendee
  const handleRemoveAttendee = async (regId, name) => {
    if (confirm(`Are you sure you want to cancel the registration for ${name}? If students are on the waitlist, the next in line will be auto-promoted.`)) {
      try {
        const res = await fetch(`/api/registrations/${regId}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          addToast({
            type: 'warning',
            title: 'Attendee Cancelled',
            message: json.promotedStudent 
              ? `Cancelled ${name}. Auto-promoted ${json.promotedStudent.name} from waitlist!`
              : `Cancelled ${name}. Seat is now free.`
          });
          fetchRegistrations(selectedWorkshopId);
          refreshWorkshops();
          refreshEmails();
        }
      } catch (err) {
        console.error('Remove attendee error:', err);
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data || !data.all) return;
    const headers = ['ID', 'Name', 'Email', 'Status', 'Registered At', 'Notes'];
    const rows = data.all.map(r => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      r.status,
      `"${r.registered_at}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees_workshop_${selectedWorkshopId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Workshop Submit
  const handleCreateWorkshop = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          instructor: newInstructor,
          instructor_role: newInstructorRole,
          category: newCategory,
          date: newDate,
          time: newTime,
          location: newLocation,
          max_seats: Number(newMaxSeats),
          tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      const json = await res.json();
      if (json.success) {
        addToast({
          type: 'success',
          title: 'Workshop Created',
          message: `Created "${newTitle}" with ${newMaxSeats} seats.`
        });
        setIsCreateOpen(false);
        await refreshWorkshops();
        setSelectedWorkshopId(json.workshop.id);
      }
    } catch (err) {
      console.error('Create workshop error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  // If locked, render the professional high-security Founder lock screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-14 p-8 rounded-3xl glass-card border border-indigo-500/40 shadow-2xl animate-scale-in text-center relative overflow-hidden">
        
        {/* Ambient glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 mb-5 shadow-lg shadow-indigo-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
          Founder Security Authentication
        </span>

        <h2 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
          Founder's Command Portal
        </h2>
        
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Restricted access. Please enter your authorized founder passcode to access the attendee registries, waitlist queue, capacity controls, and email dispatcher.
        </p>

        {authError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-center gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <div className="relative text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Founder Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Enter Founder Security Passcode..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={unlocking}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2"
          >
            {unlocking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Authorize & Unlock</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  const selectedWorkshop = workshops.find(w => w.id === Number(selectedWorkshopId));
  const filteredList = data ? (
    activeTab === 'registered' 
      ? data.registered 
      : activeTab === 'waitlist' 
      ? data.waitlist 
      : data.cancelled
  ).filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-card border border-indigo-500/30 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Founder Access Granted
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Founder's Command & Email Dispatch Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage attendee registries, inspect dispatched confirmation emails, configure SMTP mail delivery, and publish workshops.
          </p>
        </div>

        {/* Section Tabs & Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setFounderSection('registries')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                founderSection === 'registries'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registries</span>
            </button>

            <button
              onClick={() => setFounderSection('emails')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                founderSection === 'emails'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Dispatched Emails ({emails.length})</span>
            </button>

            <button
              onClick={() => setFounderSection('smtp')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                founderSection === 'smtp'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SMTP Config</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workshop</span>
          </button>

          <button
            onClick={handleLockPortal}
            className="px-3.5 py-2 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-colors flex items-center gap-1.5"
            title="Lock Founder's Portal"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: ATTENDEE REGISTRIES */}
      {founderSection === 'registries' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Workshop Selector Cards Row */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Select Workshop to Inspect
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workshops.map(w => {
                const isSelected = w.id === Number(selectedWorkshopId);
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkshopId(w.id)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                      isSelected 
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-400">{w.category}</span>
                      {w.is_full ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          FULL ({w.max_seats}/{w.max_seats})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {w.seats_left} seats left
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white line-clamp-1">{w.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{w.instructor} • {w.date}</p>
                    
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{w.registered_count} Confirmed</span>
                      {w.waitlist_count > 0 && (
                        <span className="text-amber-400 font-medium">{w.waitlist_count} on Waitlist</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Workshop Overview Stats */}
          {selectedWorkshop && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                <p className="text-xs text-slate-400">Total Seat Capacity</p>
                <p className="text-2xl font-bold text-white mt-1">{selectedWorkshop.max_seats}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                <p className="text-xs text-slate-400">Confirmed Students</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {data ? data.counts.registered : selectedWorkshop.registered_count}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                <p className="text-xs text-slate-400">Seats Available</p>
                <p className="text-2xl font-bold text-indigo-400 mt-1">
                  {selectedWorkshop.seats_left}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                <p className="text-xs text-slate-400">Waitlist Queue (FIFO)</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {data ? data.counts.waitlist : selectedWorkshop.waitlist_count}
                </p>
              </div>
            </div>
          )}

          {/* Attendee Tables & Filter Toolbar */}
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start">
                <button
                  onClick={() => setActiveTab('registered')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'registered'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Confirmed ({data?.counts.registered || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('waitlist')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'waitlist'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>Waitlist Queue ({data?.counts.waitlist || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('cancelled')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'cancelled'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Cancelled ({data?.counts.cancelled || 0})</span>
                </button>
              </div>

              {/* Search & Export */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search attendee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52 sm:w-60"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                  title="Export attendees to CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs">Loading attendee registry...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 rounded-xl border border-dashed border-slate-800">
                <p className="text-sm font-semibold text-slate-300">No records found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery ? 'No attendees match your search query.' : `No students currently in ${activeTab} status.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">
                        {activeTab === 'waitlist' ? 'Waitlist Priority' : 'Status'}
                      </th>
                      <th className="py-3 px-4">Registered Date & Time</th>
                      {activeTab !== 'cancelled' && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredList.map((attendee, idx) => (
                      <tr key={attendee.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] font-bold text-indigo-300 flex items-center justify-center">
                            {attendee.name.charAt(0)}
                          </div>
                          <span>{attendee.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {attendee.email}
                        </td>
                        <td className="py-3 px-4">
                          {attendee.status === 'REGISTERED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed Seat
                            </span>
                          )}
                          {attendee.status === 'WAITLIST' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Hourglass className="w-3 h-3" /> Queue Pos #{idx + 1}
                            </span>
                          )}
                          {attendee.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <UserX className="w-3 h-3" /> Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(attendee.registered_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        {activeTab !== 'cancelled' && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveAttendee(attendee.id, attendee.name)}
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition-colors font-semibold text-[11px] inline-flex items-center gap-1"
                              title="Cancel seat (triggers waitlist auto-promotion)"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: DISPATCHED EMAIL INSPECTOR */}
      {founderSection === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* Email List Column */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-5 flex flex-col gap-2.5 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dispatched Transactional Emails
              </h3>
              <span className="text-[11px] font-mono text-indigo-400">
                {emails.length} Emails Logged
              </span>
            </div>

            {emails.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No emails generated yet. Complete a registration or cancellation to see records.</p>
              </div>
            ) : (
              emails.map((em) => {
                const isSelected = currentEmail?.id === em.id;
                const isPromo = em.type === 'WAITLIST_PROMOTED';
                const isWait = em.type === 'WAITLIST_CONFIRMATION';
                const isCancel = em.type === 'CANCELLATION_CONFIRMATION';
                const isRealInbox = em.delivery_status === 'DELIVERED_TO_INBOX';

                return (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmail(em)}
                    className={`p-3.5 rounded-2xl cursor-pointer border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${
                        isPromo 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isWait
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : isCancel
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {isPromo ? '🌟 Auto-Promoted' : isWait ? '⏳ Waitlist' : isCancel ? '❌ Cancelled' : '🎉 Confirmed'}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(em.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1 mt-1.5">
                      {em.subject}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      To: <strong className="text-slate-300">{em.to_name}</strong> ({em.to_email})
                    </p>
                    
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px]">
                      <span className={isRealInbox ? 'text-emerald-400 font-semibold' : 'text-purple-300'}>
                        {isRealInbox ? '🟢 Delivered via SMTP' : '🌐 Web Mail Preview'}
                      </span>
                      {em.preview_url && (
                        <span className="text-indigo-400 font-bold hover:underline flex items-center gap-0.5">
                          <span>Web Preview</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Email Preview Column */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8">
            {currentEmail ? (
              <div>
                <div className="pb-4 border-b border-slate-800 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Email Message Inspector
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentEmail.delivery_status === 'DELIVERED_TO_INBOX'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        {currentEmail.delivery_status === 'DELIVERED_TO_INBOX' ? 'Custom SMTP Inbox Delivery' : 'Ethereal SMTP Dispatch'}
                      </span>
                    </div>

                    {currentEmail.preview_url && (
                      <a
                        href={currentEmail.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Open in Real Web Mailbox</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{currentEmail.subject}</h3>
                  <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-4">
                    <span><strong>To:</strong> {currentEmail.to_name} &lt;{currentEmail.to_email}&gt;</span>
                    <span><strong>Dispatched:</strong> {new Date(currentEmail.sent_at).toLocaleString()}</span>
                  </div>
                </div>

                <div 
                  className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-700 shadow-inner overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: currentEmail.content_html }}
                />
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an email to view its template and dispatch status.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 3: SMTP MAIL SERVER CONFIGURATION */}
      {founderSection === 'smtp' && (
        <div className="max-w-2xl mx-auto glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 animate-fade-in">
          
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Mail Server Settings
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">SMTP Email Gateway Configuration</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure your organization's SMTP server (Gmail, Brevo, SendGrid, Amazon SES) for direct recipient inbox delivery, or use Ethereal Web Mailbox.
            </p>
          </div>

          {smtpStatusMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{smtpStatusMsg}</span>
            </div>
          )}

          {smtpErrorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{smtpErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSmtp} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com or smtp.brevo.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Username / Sender Email</label>
                <input
                  type="text"
                  placeholder="your.email@example.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password / App Password</label>
                <input
                  type="password"
                  placeholder="App Password..."
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">From Display Name</label>
              <input
                type="text"
                placeholder='"SeatPulse Masterclasses" <workshops@yourdomain.com>'
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="smtpSecure" className="text-slate-300 text-xs cursor-pointer">
                Enable SSL/TLS (Required for port 465)
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetToEthereal}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                Reset to Ethereal Web Mail
              </button>

              <button
                type="submit"
                disabled={smtpLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                {smtpLoading ? 'Testing & Saving...' : 'Save SMTP Settings'}
              </button>
            </div>
          </form>

          {/* Test Email Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>Send Test Email to Verify Inbox Delivery</span>
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your personal email..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shrink-0"
              >
                {testLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Test</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Create Workshop Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 animate-scale-in text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Add New Workshop</h3>
            
            <form onSubmit={handleCreateWorkshop} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced System Design & Distributed Caching"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of topics, skills, and labs covered..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Instructor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Maya Lin"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Seat Limit *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newMaxSeats}
                    onChange={(e) => setNewMaxSeats(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nov 15, 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM - 1:00 PM EST"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 101 or Virtual Zoom"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, Backend, Cloud"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  {createLoading ? 'Creating...' : 'Publish Workshop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
