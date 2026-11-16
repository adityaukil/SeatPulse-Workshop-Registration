import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { 
  Radio, 
  Mail, 
  Sparkles, 
  Hourglass, 
  UserCheck, 
  UserX, 
  Clock, 
  ExternalLink, 
  ChevronRight, 
  Inbox, 
  CheckCircle2, 
  Calendar, 
  AlertCircle,
  Settings,
  Globe
} from 'lucide-react';

export default function LiveActivityFeed({ onOpenCancelModal, onOpenSmtpSettings }) {
  const { activities, emails } = useSocket();
  const [activeTab, setActiveTab] = useState('emails'); // 'emails' | 'activity'
  const [selectedEmail, setSelectedEmail] = useState(emails[0] || null);

  // Sync selected email if none selected yet
  const currentEmail = selectedEmail || emails[0] || null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              Live Audit & Real Email Pulse
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Real-Time System Ticker & Transactional Emails
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Observe WebSocket live events, inspect delivered emails, and configure custom SMTP for real inbox delivery.
          </p>
        </div>

        {/* Action Buttons & Tab Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SMTP Config Button */}
          <button
            onClick={onOpenSmtpSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors shadow-sm"
            title="Configure SMTP mail server for real inbox delivery"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Email (SMTP) Settings</span>
          </button>

          {/* Tab switch */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'emails'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Emails ({emails.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'activity'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Activity Stream ({activities.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'emails' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Email List Column */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-2 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dispatched Email Inbox
              </h3>
              <span className="text-[11px] font-mono text-indigo-400">
                {emails.length} Messages
              </span>
            </div>

            {emails.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No emails generated yet. Register or cancel a workshop to see emails here!</p>
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
                    className={`p-3.5 rounded-xl cursor-pointer border text-left transition-all ${
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
                        {new Date(em.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1 mt-1.5">
                      {em.subject}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      To: <strong className="text-slate-300">{em.to_name}</strong> ({em.to_email})
                    </p>
                    
                    {/* Delivery pill */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px]">
                      <span className={isRealInbox ? 'text-emerald-400 font-semibold' : 'text-purple-300'}>
                        {isRealInbox ? '🟢 Delivered to Real Inbox' : '🌐 Real Web Mailbox'}
                      </span>
                      {em.preview_url && (
                        <span className="text-indigo-400 font-bold hover:underline flex items-center gap-0.5">
                          <span>View Live</span>
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
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 sm:p-8">
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
                        {currentEmail.delivery_status === 'DELIVERED_TO_INBOX' ? 'Delivered via Custom SMTP' : 'Delivered via Ethereal SMTP'}
                      </span>
                    </div>

                    {/* Open in Web Mail link */}
                    {currentEmail.preview_url && (
                      <a
                        href={currentEmail.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all self-start"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Open in Real Web Mailbox</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{currentEmail.subject}</h3>
                  <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-4">
                    <span><strong>From:</strong> workshops@seatpulse.io</span>
                    <span><strong>To:</strong> {currentEmail.to_name} &lt;{currentEmail.to_email}&gt;</span>
                    <span><strong>Time:</strong> {new Date(currentEmail.sent_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Rendered HTML email body */}
                <div 
                  className="bg-white text-slate-900 p-6 rounded-xl border border-slate-700 shadow-inner overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: currentEmail.content_html }}
                />
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an email on the left to inspect its HTML template.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Activity Stream View */
        <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Live System Activity Stream
            </h3>
            <span className="text-xs font-mono text-slate-500">{activities.length} Recorded Events</span>
          </div>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-500">No activity logged yet.</p>
            ) : (
              activities.map((act) => {
                const isRegistered = act.action_type === 'REGISTERED';
                const isWaitlist = act.action_type === 'WAITLIST_JOINED';
                const isPromoted = act.action_type === 'WAITLIST_PROMOTED';
                const isCancelled = act.action_type === 'CANCELLED';

                return (
                  <div 
                    key={act.id} 
                    className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isPromoted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isRegistered
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : isWaitlist
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {isPromoted && <Sparkles className="w-4 h-4" />}
                      {isRegistered && <UserCheck className="w-4 h-4" />}
                      {isWaitlist && <Hourglass className="w-4 h-4" />}
                      {isCancelled && <UserX className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white leading-snug">{act.message}</p>
                      {act.workshop_title && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{act.workshop_title}</p>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
