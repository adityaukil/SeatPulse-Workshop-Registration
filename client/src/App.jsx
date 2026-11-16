import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import WorkshopCard from './components/WorkshopCard';
import RegistrationModal from './components/RegistrationModal';
import CancelModal from './components/CancelModal';
import OrganizerDashboard from './components/OrganizerDashboard';
import LiveActivityFeed from './components/LiveActivityFeed';
import MyRegistrations from './components/MyRegistrations';
import SmtpSettingsModal from './components/SmtpSettingsModal';
import ToastContainer from './components/Toast';
import { NeuralNoise } from './components/ui/neural-noise';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Radio, 
  ArrowRight, 
  Layers, 
  Users, 
  Hourglass, 
  Flame, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';

function WorkshopApp() {
  const { workshops, loading, refreshWorkshops, refreshActivities, refreshEmails, addToast } = useSocket();
  const [activeTab, setActiveTab] = useState('workshops');
  
  // Registration Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelToken, setCancelToken] = useState('');
  const [cancelWorkshopId, setCancelWorkshopId] = useState(null);

  // SMTP Settings Modal
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);

  // Active saved passes in localStorage
  const [recentPasses, setRecentPasses] = useState(() => {
    try {
      const saved = localStorage.getItem('seatpulse_saved_passes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save passes to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('seatpulse_saved_passes', JSON.stringify(recentPasses));
    } catch (e) {
      console.error('Failed to save passes to localStorage', e);
    }
  }, [recentPasses]);

  // Handle URL query parameters on initial page load (e.g. /?action=cancel&token=... or /cancel?token=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const workshopId = searchParams.get('workshop');
    const action = searchParams.get('action');

    if (token || action === 'cancel' || window.location.pathname.includes('cancel')) {
      setCancelToken(token || '');
      setCancelWorkshopId(workshopId ? Number(workshopId) : null);
      setCancelModalOpen(true);
    }
  }, []);

  // Quick filter for categories
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', ...new Set(workshops.map(w => w.category))];
  const filteredWorkshops = selectedCategory === 'All' 
    ? workshops 
    : workshops.filter(w => w.category === selectedCategory);

  const handleOpenRegister = (workshop, waitlistOnly = false) => {
    setSelectedWorkshop(workshop);
    setIsWaitlistMode(waitlistOnly);
    setRegisterModalOpen(true);
  };

  const handleOpenCancelModal = (token = '', workshopId = null) => {
    setCancelToken(token);
    setCancelWorkshopId(workshopId);
    setCancelModalOpen(true);
  };

  const handlePassRegistered = (newPass) => {
    setRecentPasses(prev => {
      const filtered = prev.filter(p => p.cancelToken !== newPass.cancelToken);
      return [newPass, ...filtered];
    });
  };

  const handleRemovePass = (token) => {
    setRecentPasses(prev => prev.filter(p => p.cancelToken !== token));
  };

  const handleCancelPass = async (token, workshopTitle) => {
    if (confirm(`Are you sure you want to cancel your registration for "${workshopTitle || 'Workshop'}"? Your seat will be released immediately.`)) {
      try {
        const res = await fetch('/api/registrations/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.success) {
          addToast({
            type: 'warning',
            title: 'Registration Cancelled',
            message: data.message
          });
          // Remove from local saved passes
          handleRemovePass(token);
          refreshWorkshops();
          refreshActivities();
          refreshEmails();
        } else {
          addToast({
            type: 'warning',
            title: 'Cancellation Notice',
            message: data.error || 'Could not cancel pass.'
          });
        }
      } catch (err) {
        console.error('Cancel pass error:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Mystical Energy Neural Noise WebGL Background Shader */}
      <NeuralNoise 
        color={[0.65, 0.18, 0.98]} 
        opacity={0.80} 
        speed={0.0014} 
      />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Top Navbar */}
      <div className="relative z-30">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenCancelModal={() => handleOpenCancelModal()}
          onOpenSmtpSettings={() => setSmtpModalOpen(true)}
          activePassesCount={recentPasses.length}
        />
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        
        {activeTab === 'workshops' && (
          <div className="space-y-8 animate-fade-in pb-16">
            
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden glass-card p-8 sm:p-12 border border-slate-700/60 shadow-2xl">
              
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-Time Seat Limiting Engine Active</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  High-Impact Tech Workshops With <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Live Seat Limits</span>
                </h1>

                <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  Explore masterclasses led by industry pioneers. Seat counts are strictly managed and atomically enforced by the backend database with instant priority waitlist auto-promotions.
                </p>

                {/* Feature Highlights Pills */}
                <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Backend-Enforced Limits</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span>Live WebSocket Sync</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <Hourglass className="w-4 h-4 text-amber-400" />
                    <span>Auto-Promoting Waitlist</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Category Filter & Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Available Workshops</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Seats update in real-time. Duplicate emails and overflow attempts are rejected by the server.
                </p>
              </div>

              {/* Category buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Workshop Cards Grid */}
            {loading ? (
              <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-sm">Fetching live workshop status...</p>
              </div>
            ) : filteredWorkshops.length === 0 ? (
              <div className="py-20 text-center glass-card rounded-2xl text-slate-400">
                <p className="text-base font-semibold text-white">No workshops found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkshops.map((workshop) => (
                  <WorkshopCard 
                    key={workshop.id} 
                    workshop={workshop} 
                    onRegisterClick={handleOpenRegister}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* Consolidated My Registrations & Passes Tab */}
        {activeTab === 'my-registrations' && (
          <MyRegistrations 
            savedPasses={recentPasses}
            onRemovePass={handleRemovePass}
            onCancelPass={handleCancelPass}
            onOpenCancelModalWithToken={(token) => handleOpenCancelModal(token)} 
            setActiveTab={setActiveTab}
          />
        )}

        {/* Founder's Portal Tab (Locked by AUJU26 passcode) */}
        {activeTab === 'organizer' && (
          <OrganizerDashboard />
        )}

      </main>

      {/* Registration Modal */}
      <RegistrationModal 
        workshop={selectedWorkshop}
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        isWaitlistMode={isWaitlistMode}
        onOpenCancelModal={handleOpenCancelModal}
        onPassRegistered={handlePassRegistered}
      />

      {/* Cancellation Modal */}
      <CancelModal 
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        initialToken={cancelToken}
        initialWorkshopId={cancelWorkshopId}
      />

      {/* SMTP Mail Configuration Modal */}
      <SmtpSettingsModal
        isOpen={smtpModalOpen}
        onClose={() => setSmtpModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur text-slate-500 text-xs py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">SeatPulse Full-Stack Workshop Platform</span>
          </div>
          <p className="text-slate-400 text-center sm:text-right">
            Enforces Seat Limits • Real Nodemailer Dispatch • Live WebSockets • Auto-Promoting Waitlist
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <WorkshopApp />
    </SocketProvider>
  );
}
