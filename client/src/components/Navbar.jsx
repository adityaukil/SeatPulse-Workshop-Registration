import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { 
  Sparkles, 
  Layers, 
  UserCheck, 
  ShieldAlert, 
  Radio, 
  RotateCcw, 
  Ticket, 
  Mail, 
  CheckCircle2, 
  ExternalLink, 
  Settings,
  Lock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCancelModal, onOpenSmtpSettings, activePassesCount = 0 }) {
  const { isConnected, refreshWorkshops, refreshActivities, refreshEmails, addToast } = useSocket();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSeed = async () => {
    if (confirm('Reset database to initial demo state with 3 sample workshops and mock registrations?')) {
      setIsResetting(true);
      try {
        const res = await fetch('/api/admin/reset-seed', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          addToast({
            type: 'info',
            title: 'Database Reset',
            message: 'Sample workshops and waitlists have been restored.'
          });
          await Promise.all([refreshWorkshops(), refreshActivities(), refreshEmails()]);
        }
      } catch (err) {
        console.error('Reset error:', err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const navItems = [
    { id: 'workshops', label: 'Workshops', icon: Layers },
    { id: 'my-registrations', label: 'My Registrations', icon: UserCheck },
    { id: 'organizer', label: "Founder's Portal", icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('workshops')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SeatPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Real-Time Workshop Registration & Waitlist Engine</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2">
            
            {/* Live Socket indicator */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
              title={isConnected ? 'Connected to real-time WebSockets' : 'Connecting to live synchronization...'}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="hidden lg:inline">{isConnected ? 'Live Sync' : 'Offline'}</span>
            </div>

            {/* Cancel Seat Button */}
            <button
              onClick={onOpenCancelModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Cancel an existing registration"
            >
              <Ticket className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Cancel Seat</span>
              {activePassesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                  {activePassesCount}
                </span>
              )}
            </button>

            {/* Reset Demo Data */}
            <button
              onClick={handleResetSeed}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Reset sample workshops and seats"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden 2xl:inline">Reset Demo</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
