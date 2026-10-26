import React from 'react';
import type { Ticket } from '../../types';
import { StarRating } from '../StarRating';
import { Calendar, MapPin, Armchair, ChevronRight, Film } from 'lucide-react';

interface ListViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const ListView: React.FC<ListViewProps> = ({ tickets, onSelectTicket }) => {
  if (tickets.length === 0) {
    return (
      <div className="py-20 text-center">
        <Film className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-slate-300">No tickets found</h3>
        <p className="text-sm text-slate-500 mt-1">
          Adjust your search or filter settings to browse your log.
        </p>
      </div>
    );
  }

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'IMAX':
      case 'IMAX 3D':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Dolby Cinema':
      case 'Dolby Atmos':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case '4DX':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case '3D':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="w-full space-y-3 py-4">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => onSelectTicket(ticket)}
          className="group relative cursor-pointer flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-[#11141d] border border-slate-800 hover:border-amber-500/40 hover:bg-[#151924] transition-all duration-200 shadow-md"
        >
          {/* Mini ticket notch effect */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#08090d] border-r border-slate-800" />
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#08090d] border-l border-slate-800" />

          {/* Left: Thumbnail & Main Movie Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Poster Thumbnail */}
            <div className="h-16 w-11 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/80 shadow">
              <img
                src={ticket.posterUrl}
                alt={ticket.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Title, Cinema, & Meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                  {ticket.title}
                </h4>
                <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getFormatBadge(
                    ticket.format
                  )}`}
                >
                  {ticket.format}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{ticket.cinema}</span>
                </div>
                {ticket.seats && (
                  <div className="hidden md:flex items-center gap-1 text-slate-400">
                    <Armchair className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{ticket.seats}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Date, Star Rating & Inspect Indicator */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Date Watched */}
            <div className="hidden sm:flex flex-col items-end text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{ticket.dateWatched}</span>
              </div>
              {ticket.timeWatched && (
                <span className="text-[10px] text-slate-500">{ticket.timeWatched}</span>
              )}
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-end">
              <StarRating rating={ticket.rating} readOnly size="sm" showNumber />
              {ticket.review && (
                <span className="text-[10px] text-slate-400 italic mt-0.5 hidden lg:inline max-w-[180px] truncate">
                  "{ticket.review}"
                </span>
              )}
            </div>

            {/* Arrow chevron */}
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      ))}
    </div>
  );
};
