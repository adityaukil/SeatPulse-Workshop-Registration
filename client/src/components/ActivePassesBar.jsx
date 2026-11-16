import React, { useState } from 'react';
import { 
  Ticket, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Hourglass,
  X
} from 'lucide-react';

export default function ActivePassesBar({ recentPasses, onRemovePass, onCancelPass, onOpenCancelModalWithToken }) {
  const [copiedId, setCopiedId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!recentPasses || recentPasses.length === 0) return null;

  const handleCopy = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="w-full mb-8 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-purple-950/90 border border-indigo-500/40 shadow-xl backdrop-blur-xl p-4 sm:p-5">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  My Active Registration Passes & Cancellation IDs
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {recentPasses.length} Saved {recentPasses.length === 1 ? 'Pass' : 'Passes'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Instant access to your cancellation tokens and 1-click seat management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <span>{isExpanded ? 'Collapse Bar' : 'View Tokens'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Passes List */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recentPasses.map((pass) => {
              const isRegistered = pass.status === 'REGISTERED';
              const isCopied = copiedId === pass.cancelToken;

              return (
                <div 
                  key={pass.cancelToken}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between gap-3 text-xs relative group hover:border-indigo-500/40 transition-all"
                >
                  <div>
                    {/* Status Badge & Dismiss Button */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isRegistered 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isRegistered ? <ShieldCheck className="w-3 h-3" /> : <Hourglass className="w-3 h-3" />}
                        <span>{isRegistered ? 'Seat Confirmed' : `Waitlist #${pass.position || 1}`}</span>
                      </span>

                      <button
                        onClick={() => onRemovePass(pass.cancelToken)}
                        className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                        title="Dismiss from quick bar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Workshop Title */}
                    <h4 className="font-bold text-white line-clamp-1 text-xs">
                      {pass.workshopTitle || 'Workshop Registration'}
                    </h4>
                    
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Attendee: <strong className="text-slate-300">{pass.name}</strong> ({pass.email})
                    </p>

                    {/* Token Box with Copy Button */}
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Cancellation ID</p>
                        <p className="font-mono text-[11px] text-indigo-300 truncate select-all">
                          {pass.cancelToken}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopy(pass.cancelToken)}
                        className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                          isCopied 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                        }`}
                        title="Copy cancellation ID to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onCancelPass(pass.cancelToken, pass.workshopTitle)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cancel This Seat</span>
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
