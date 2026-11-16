import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  UserCheck, 
  Hourglass, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Flame,
  AlertCircle
} from 'lucide-react';

export default function WorkshopCard({ workshop, onRegisterClick }) {
  const {
    id,
    title,
    description,
    instructor,
    instructor_role,
    instructor_avatar,
    category,
    date,
    time,
    location,
    max_seats,
    registered_count = 0,
    waitlist_count = 0,
    seats_left = 0,
    is_full = false,
    tags = []
  } = workshop;

  const percentage = Math.min(100, Math.round((registered_count / max_seats) * 100));
  const isAlmostFull = seats_left > 0 && seats_left <= 4;

  return (
    <div className="glass-card-interactive rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Background ambient glow based on status */}
      <div 
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          is_full 
            ? 'bg-rose-500/10 group-hover:bg-rose-500/20' 
            : isAlmostFull
            ? 'bg-amber-500/10 group-hover:bg-amber-500/20'
            : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
        }`} 
      />

      {/* Header Badges */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-indigo-300 border border-slate-700/80">
            {category}
          </span>

          {/* Seat Status Badge */}
          {is_full ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>Workshop Full</span>
            </div>
          ) : isAlmostFull ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Only {seats_left} seat{seats_left > 1 ? 's' : ''} left!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{seats_left} seats available</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors tracking-tight leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-300 text-sm mt-3 leading-relaxed line-clamp-3">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Schedule & Location Details */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2 text-slate-400">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <img 
            src={instructor_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
            alt={instructor} 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{instructor}</p>
            <p className="text-[11px] text-slate-400 truncate">{instructor_role || 'Expert Instructor'}</p>
          </div>
        </div>
      </div>

      {/* Footer Seat Progress and Registration Trigger */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        
        {/* Progress Bar & Seat Counter */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-200">
                {registered_count} / {max_seats} Seats Confirmed
              </span>
            </div>
            <span className="font-mono font-bold text-slate-400">
              {percentage}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                is_full 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                  : isAlmostFull
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {waitlist_count > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-300/90 font-medium">
              <Hourglass className="w-3 h-3 text-amber-400 animate-spin-slow" />
              <span>{waitlist_count} student{waitlist_count > 1 ? 's' : ''} in queue on the waitlist</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {is_full ? (
            <>
              {/* Disabled button explicitly showing full */}
              <button
                disabled
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40 flex items-center justify-center gap-2"
                title="Seats are filled"
              >
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>Full (0 Seats Left)</span>
              </button>

              {/* Priority Waitlist button */}
              <button
                onClick={() => onRegisterClick(workshop, true)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-lg hover:shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Hourglass className="w-4 h-4" />
                <span>Join Waitlist #{waitlist_count + 1}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onRegisterClick(workshop, false)}
              className="w-full py-3.5 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Reserve My Seat ({seats_left} Left)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
