import React from 'react';
import type { Ticket } from '../../types';
import { X, Award, Film, MapPin, Star, Sparkles } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  tickets,
}) => {
  if (!isOpen) return null;

  // Compute stats
  const totalTickets = tickets.length;
  const avgRating =
    totalTickets > 0
      ? (tickets.reduce((acc, t) => acc + (t.rating || 0), 0) / totalTickets).toFixed(1)
      : '0.0';

  // Format breakdown
  const formatCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    formatCounts[t.format] = (formatCounts[t.format] || 0) + 1;
  });

  // Top Cinemas
  const cinemaCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    if (t.cinema) {
      cinemaCounts[t.cinema] = (cinemaCounts[t.cinema] || 0) + 1;
    }
  });

  const topCinemas = Object.entries(cinemaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Top Rated Movies
  const topRated = [...tickets].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0f111a] border border-amber-500/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141724]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Cinema Vault Statistics</h2>
              <p className="text-[11px] text-slate-400">Your personal cinema journey at a glance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Stubs
              </span>
              <span className="text-3xl font-black text-white mt-1 block">{totalTickets}</span>
              <span className="text-[11px] text-amber-400 font-medium">In Vault</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Avg Rating
              </span>
              <span className="text-3xl font-black text-amber-400 mt-1 block flex items-center justify-center gap-1">
                <span>{avgRating}</span>
                <Star className="w-5 h-5 fill-amber-400 inline" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Out of 5.0</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Top Experience
              </span>
              <span className="text-xl font-bold text-cyan-300 mt-2 block truncate">
                {Object.keys(formatCounts)[0] || '2D'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {formatCounts[Object.keys(formatCounts)[0]] || 0} tickets
              </span>
            </div>
          </div>

          {/* Formats Distribution */}
          <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-amber-400" />
              <span>Format Distribution</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(formatCounts).map(([fmt, count]) => {
                const pct = Math.round((count / totalTickets) * 100) || 0;
                return (
                  <div key={fmt} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{fmt}</span>
                      <span className="text-slate-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Most Visited Cinemas */}
          {topCinemas.length > 0 && (
            <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Favorite Theaters</span>
              </h4>
              <div className="divide-y divide-slate-800/80">
                {topCinemas.map(([cin, count]) => (
                  <div key={cin} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[280px]">{cin}</span>
                    <span className="font-mono text-amber-400 font-semibold">{count} visits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hall of Fame: Top 3 Rated */}
          {topRated.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#161a29] to-[#12141f] border border-amber-500/25 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Hall of Fame (Highest Rated)</span>
              </h4>
              <div className="space-y-2">
                {topRated.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={t.posterUrl} alt="" className="w-6 h-8 object-cover rounded bg-slate-800 shrink-0" />
                      <span className="font-bold text-white truncate">{t.title}</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold ml-2 shrink-0">{t.rating}★</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
