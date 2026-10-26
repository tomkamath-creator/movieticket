import React from 'react';
import type { Ticket } from '../types';
import { StarRating } from './StarRating';
import { Calendar, MapPin, Armchair, Sparkles } from 'lucide-react';

interface TicketStubCardProps {
  ticket: Ticket;
  onClick?: () => void;
  className?: string;
}

export const TicketStubCard: React.FC<TicketStubCardProps> = ({
  ticket,
  onClick,
  className = '',
}) => {
  // Format badge styling
  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'IMAX':
      case 'IMAX 3D':
        return 'bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 text-white shadow-blue-500/20';
      case 'Dolby Cinema':
      case 'Dolby Atmos':
        return 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white shadow-cyan-500/20';
      case '4DX':
        return 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-purple-500/20';
      case '3D':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20';
      default:
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 shadow-amber-500/20';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer select-none rounded-2xl bg-[#11141d] border border-slate-800/90 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col ${className}`}
    >
      {/* Semicircular Ticket Notches on left & right */}
      <div className="ticket-notch-left -translate-y-1/2 !bg-[#08090d] border-r border-slate-800" />
      <div className="ticket-notch-right -translate-y-1/2 !bg-[#08090d] border-l border-slate-800" />

      {/* Top Poster & Banner Area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={ticket.backdropUrl || ticket.posterUrl}
          alt={ticket.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            // fallback if remote poster fails
            (e.target as HTMLImageElement).src = ticket.posterUrl;
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#11141d] via-[#11141d]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />

        {/* Format Badge (Foil / Metallic) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-lg ${getFormatBadge(
              ticket.format
            )}`}
          >
            {ticket.format}
          </span>
          {ticket.hallOrScreen && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
              {ticket.hallOrScreen}
            </span>
          )}
        </div>

        {/* Star Rating Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-500/30">
          <StarRating rating={ticket.rating} readOnly size="sm" showNumber />
        </div>

        {/* Mini Poster Peek on lower left */}
        <div className="absolute -bottom-2 left-4 z-10 h-18 w-12 rounded-lg border-2 border-[#11141d] shadow-xl overflow-hidden bg-slate-800">
          <img
            src={ticket.posterUrl}
            alt={ticket.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Release year & runtime */}
        <div className="absolute bottom-2 right-4 z-10 text-right">
          <span className="text-xs text-slate-300 font-medium">
            {ticket.year} {ticket.runtime ? `· ${ticket.runtime}` : ''}
          </span>
        </div>
      </div>

      {/* Main Stub Content Area */}
      <div className="flex-1 p-5 pt-4 flex flex-col justify-between">
        <div>
          {/* Movie Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 tracking-tight">
            {ticket.title}
          </h3>

          {/* Director & Genres */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            {ticket.director && (
              <span className="line-clamp-1">Dir. {ticket.director}</span>
            )}
            {ticket.genres && ticket.genres.length > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-amber-500/90 font-medium">{ticket.genres[0]}</span>
              </>
            )}
          </div>

          {/* Cinema Location */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{ticket.cinema}</span>
          </div>

          {/* Showtime & Seat info */}
          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{ticket.dateWatched}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Armchair className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate text-amber-300/90 font-semibold">{ticket.seats || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Perforated Stub Divider */}
        <div className="relative my-4">
          <div className="h-[1px] w-full border-t border-dashed border-slate-700/80" />
        </div>

        {/* Bottom Tear-Off Stub section */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {/* Barcode graphic simulation */}
            <div className="flex items-center gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="w-[1px] h-6 bg-slate-400" />
              <div className="w-[3px] h-6 bg-slate-400" />
              <div className="w-[1px] h-6 bg-slate-400" />
              <div className="w-[2px] h-6 bg-slate-400" />
              <div className="w-[1px] h-6 bg-slate-400" />
              <div className="w-[4px] h-6 bg-slate-400" />
              <div className="w-[1px] h-6 bg-slate-400" />
              <div className="w-[2px] h-6 bg-slate-400" />
            </div>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
              {ticket.bookingId ? ticket.bookingId.slice(0, 12) : 'COLLECTIBLE'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/90 group-hover:text-amber-300">
            <span>Inspect</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
