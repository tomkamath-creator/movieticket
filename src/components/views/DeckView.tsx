import React, { useState, useEffect, useRef } from 'react';
import type { Ticket } from '../../types';
import { StarRating } from '../StarRating';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar,
  Armchair,
  Film,
  ZoomIn,
} from 'lucide-react';

interface DeckViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const DeckView: React.FC<DeckViewProps> = ({ tickets, onSelectTicket }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Clamp current index when tickets list changes
  useEffect(() => {
    if (currentIndex >= tickets.length) {
      setCurrentIndex(Math.max(0, tickets.length - 1));
    }
  }, [tickets.length, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (tickets[currentIndex]) {
          onSelectTicket(tickets[currentIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, tickets]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0));
  };

  // Touch / Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchCurrentXRef.current !== null) {
      const diff = touchCurrentXRef.current - touchStartXRef.current;
      if (diff > 50) {
        goToPrev();
      } else if (diff < -50) {
        goToNext();
      }
    }
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  };

  if (tickets.length === 0) {
    return (
      <div className="py-20 text-center">
        <Film className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-slate-300">No tickets found</h3>
        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or add your first ticket!</p>
      </div>
    );
  }

  const activeTicket = tickets[currentIndex];

  return (
    <div className="w-full flex flex-col items-center py-6 select-none">
      {/* Deck Counter & Controls Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-400 font-mono">
            Stub {currentIndex + 1} of {tickets.length}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">• Use ← / → keys or swipe</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrev}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
            title="Previous Stub (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
            title="Next Stub (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D Stack Deck Stage */}
      <div
        className="relative w-full max-w-md h-[540px] flex items-center justify-center cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Stack Cards (visual depth) */}
        {[-2, -1, 1, 2].map((offset) => {
          const targetIndex = (currentIndex + offset + tickets.length) % tickets.length;
          if (tickets.length <= 1) return null;
          if (tickets.length === 2 && Math.abs(offset) > 1) return null;

          const isLeft = offset < 0;
          const absOffset = Math.abs(offset);
          const translateX = offset * 28;
          const translateY = absOffset * 10;
          const rotateZ = offset * 4;
          const scale = 1 - absOffset * 0.08;
          const opacity = 1 - absOffset * 0.45;

          const t = tickets[targetIndex];

          return (
            <div
              key={`${targetIndex}-${offset}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isLeft) goToPrev();
                else goToNext();
              }}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotateZ}deg) scale(${scale})`,
                opacity: Math.max(0.2, opacity),
                zIndex: 10 - absOffset,
              }}
              className="absolute w-[340px] sm:w-[380px] h-[500px] rounded-2xl bg-[#0f1118] border border-slate-800/80 shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 pointer-events-auto"
            >
              <img
                src={t.backdropUrl || t.posterUrl}
                alt=""
                className="w-full h-40 object-cover opacity-50"
              />
              <div className="p-4">
                <div className="h-4 w-3/4 bg-slate-800 rounded mb-2" />
                <div className="h-3 w-1/2 bg-slate-900 rounded" />
              </div>
            </div>
          );
        })}

        {/* Foreground Active Collectible Stub */}
        {activeTicket && (
          <div
            onClick={() => onSelectTicket(activeTicket)}
            className="group relative z-20 w-[350px] sm:w-[400px] h-[520px] rounded-2xl bg-[#12141d] border-2 border-amber-500/40 hover:border-amber-400 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Notch cutouts */}
            <div className="ticket-notch-left !bg-[#08090d] border-r border-slate-800" />
            <div className="ticket-notch-right !bg-[#08090d] border-l border-slate-800" />

            {/* Top Poster Art */}
            <div className="relative h-60 w-full overflow-hidden bg-slate-900">
              <img
                src={activeTicket.backdropUrl || activeTicket.posterUrl}
                alt={activeTicket.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12141d] via-black/40 to-transparent" />

              {/* Format Foil Badge */}
              <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg">
                  {activeTicket.format}
                </span>
                {activeTicket.hallOrScreen && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/70 backdrop-blur-md text-slate-300 border border-white/10">
                    {activeTicket.hallOrScreen}
                  </span>
                )}
              </div>

              {/* Star Rating Badge */}
              <div className="absolute top-3.5 right-4 z-10 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/30">
                <StarRating rating={activeTicket.rating} readOnly size="sm" showNumber />
              </div>

              {/* Theatrical Poster thumbnail on corner */}
              <div className="absolute bottom-3 left-4 z-10 h-22 w-16 rounded-xl border-2 border-[#12141d] shadow-2xl overflow-hidden bg-slate-800">
                <img
                  src={activeTicket.posterUrl}
                  alt={activeTicket.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute bottom-3 right-4 z-10 text-right">
                <span className="text-xs font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded-md border border-white/5">
                  {activeTicket.year} {activeTicket.runtime ? `· ${activeTicket.runtime}` : ''}
                </span>
              </div>
            </div>

            {/* Stub Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tight line-clamp-1">
                  {activeTicket.title}
                </h3>

                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {activeTicket.director ? `Directed by ${activeTicket.director}` : ''}
                  {activeTicket.genres?.length > 0 && ` • ${activeTicket.genres.join(', ')}`}
                </p>

                {/* Cinema & Showtime */}
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate font-medium">{activeTicket.cinema}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeTicket.dateWatched}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Armchair className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-amber-300 font-bold truncate">{activeTicket.seats || 'General'}</span>
                    </div>
                  </div>
                </div>

                {/* Review Snippet */}
                {activeTicket.review && (
                  <p className="mt-3 text-xs text-slate-400 italic line-clamp-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                    "{activeTicket.review}"
                  </p>
                )}
              </div>

              {/* Perforated dashed divider */}
              <div className="my-3 border-t border-dashed border-slate-700/80" />

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-[2px] opacity-75">
                    <div className="w-[1px] h-6 bg-slate-400" />
                    <div className="w-[3px] h-6 bg-slate-400" />
                    <div className="w-[1px] h-6 bg-slate-400" />
                    <div className="w-[2px] h-6 bg-slate-400" />
                    <div className="w-[4px] h-6 bg-slate-400" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {activeTicket.bookingId || 'OFFICIAL PASS'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Inspect Diary</span>
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Carousel dots indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-6 max-w-sm overflow-x-auto py-1">
        {tickets.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'w-2 bg-slate-700 hover:bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
