import React, { useState, useRef, useEffect } from 'react';
import type { Ticket } from '../../types';
import { StarRating } from '../StarRating';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Users,
  Coins,
  Ticket as TicketIcon,
} from 'lucide-react';

interface TicketInspectorModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
  onOpenEditModal: (ticket: Ticket) => void;
}

export const TicketInspectorModal: React.FC<TicketInspectorModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdateTicket,
  onDeleteTicket,
  onOpenEditModal,
}) => {
  // Diary state
  const [rating, setRating] = useState(ticket.rating);
  const [review, setReview] = useState(ticket.review || '');
  const [companions, setCompanions] = useState(ticket.companions || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Screenshot Zoom & Pan state
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sync state if ticket prop updates
  useEffect(() => {
    setRating(ticket.rating);
    setReview(ticket.review || '');
    setCompanions(ticket.companions || '');
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setShowDeleteConfirm(false);
  }, [ticket]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDeleteConfirm, onClose]);

  // Debounced auto-save for rating, review, companions
  useEffect(() => {
    if (
      rating === ticket.rating &&
      review === (ticket.review || '') &&
      companions === (ticket.companions || '')
    ) {
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      await onUpdateTicket(ticket.id, {
        rating,
        review,
        companions,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);

    return () => clearTimeout(timer);
  }, [rating, review, companions, ticket.id, ticket.rating, ticket.review, ticket.companions, onUpdateTicket]);

  if (!isOpen) return null;

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.35, 0.6));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download original screenshot image
  const handleDownloadScreenshot = () => {
    const link = document.createElement('a');
    link.href = ticket.screenshotDataUrl;
    link.download = ticket.screenshotFileName || `${ticket.title.toLowerCase().replace(/\s+/g, '_')}_ticket.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Pop-Open Split-Window Card Container */}
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-[#0d0f17] border border-amber-500/30 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.12)] overflow-hidden flex flex-col">
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#111420]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{ticket.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {ticket.format}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {ticket.cinema} · {ticket.dateWatched}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save indicator */}
            {saveStatus === 'saving' && (
              <span className="text-xs text-amber-400 animate-pulse hidden sm:inline">
                Saving changes...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 hidden sm:inline">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved locally
              </span>
            )}

            {/* Edit details button */}
            <button
              onClick={() => onOpenEditModal(ticket)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Edit Ticket Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-900 transition-colors"
              title="Delete Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split-Window Body (Left: Screenshot Inspector, Right: Diary & Metadata) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden min-h-0">
          {/* ================= LEFT SIDE: Original Screenshot Inspector ================= */}
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#08090f] flex flex-col h-[400px] lg:h-full relative select-none">
            {/* Inspector Controls Ribbon */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between px-3 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <span>Original Stub Screenshot</span>
                {ticket.bookingId && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">
                    {ticket.bookingId}
                  </span>
                )}
              </span>

              {/* Zoom Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px]"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownloadScreenshot}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Download Original Screenshot"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Image Canvas Area */}
            <div
              ref={imageContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`flex-1 w-full h-full flex items-center justify-center p-6 overflow-hidden ${
                zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
            >
              {ticket.screenshotDataUrl ? (
                <img
                  src={ticket.screenshotDataUrl}
                  alt="Original Ticket Stub Screenshot"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  }}
                  className="max-h-[85%] max-w-[85%] object-contain rounded-xl shadow-2xl border border-slate-800 pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="text-center text-slate-500">
                  <TicketIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No screenshot available</p>
                </div>
              )}
            </div>

            {/* Bottom info helper */}
            <div className="p-2.5 bg-black/60 border-t border-slate-900 text-center text-[11px] text-slate-500 font-mono">
              {zoomScale > 1
                ? `Zoom: ${Math.round(zoomScale * 100)}% · Click and drag to pan`
                : 'Double-click or use (+) to inspect QR codes & booking details'}
            </div>
          </div>

          {/* ================= RIGHT SIDE: Movie Metadata & Cinema Diary ================= */}
          <div className="lg:col-span-6 flex flex-col h-full bg-[#10121a] overflow-y-auto">
            {/* Cinematic Backdrop Banner */}
            <div className="relative w-full h-44 sm:h-52 bg-slate-900 overflow-hidden shrink-0">
              <img
                src={ticket.backdropUrl || ticket.posterUrl}
                alt={ticket.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10121a] via-[#10121a]/60 to-black/30" />

              {/* Poster thumbnail & metadata peek */}
              <div className="absolute bottom-4 left-5 right-5 flex items-end gap-4 z-10">
                <div className="h-28 w-20 rounded-xl overflow-hidden border-2 border-[#10121a] shadow-2xl bg-slate-800 shrink-0">
                  <img
                    src={ticket.posterUrl}
                    alt={ticket.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 pb-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow">
                    {ticket.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {ticket.year} {ticket.runtime ? `· ${ticket.runtime}` : ''}{' '}
                    {ticket.director ? `· Dir. ${ticket.director}` : ''}
                  </p>
                  {ticket.genres && ticket.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ticket.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details & Diary Form Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1">
              {/* Cinema & Screening Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#141724] border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Cinema</span>
                  <span className="text-slate-200 font-semibold truncate block mt-0.5" title={ticket.cinema}>
                    {ticket.cinema}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Date &amp; Time</span>
                  <span className="text-slate-200 block mt-0.5">
                    {ticket.dateWatched}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Auditorium</span>
                  <span className="text-slate-200 block mt-0.5 truncate">
                    {ticket.hallOrScreen || 'Screen 1'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Seats</span>
                  <span className="text-amber-300 font-bold block mt-0.5 truncate">
                    {ticket.seats || 'General'}
                  </span>
                </div>
              </div>

              {/* Plot Synopsis */}
              {ticket.synopsis && (
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                    Story Overview
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#141724]/60 p-3 rounded-xl border border-slate-800/80">
                    {ticket.synopsis}
                  </p>
                </div>
              )}

              {/* ================= CINEMA DIARY SECTION ================= */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#161a29] to-[#12141f] border border-amber-500/25 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span>Personal Cinema Diary</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Auto-saved to device
                  </span>
                </div>

                {/* 5-Star Interactive Rating (Half Stars supported) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-black/40 border border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Your Rating</span>
                    <span className="text-[10px] text-slate-400">Hover and click left/right half for half-stars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={rating}
                      onChange={(newRating) => setRating(newRating)}
                      size="lg"
                      showNumber
                    />
                  </div>
                </div>

                {/* Personal Review & Memories */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Memories &amp; Review
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your review, the crowd's reaction, sound quality, favorite moments, or personal memories..."
                    rows={4}
                    className="w-full p-3 bg-black/40 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 transition-all resize-y"
                  />
                </div>

                {/* Companions & Extra details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Watched With</span>
                    </label>
                    <input
                      type="text"
                      value={companions}
                      onChange={(e) => setCompanions(e.target.value)}
                      placeholder="e.g. Alex, Sam, Solo"
                      className="w-full px-3 py-2 bg-black/40 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ticket Price Paid</span>
                    </label>
                    <input
                      type="text"
                      value={ticket.ticketPrice || ''}
                      onChange={(e) => onUpdateTicket(ticket.id, { ticketPrice: e.target.value })}
                      placeholder="e.g. $19.50 or ₹450"
                      className="w-full px-3 py-2 bg-black/40 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#141724] border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Permanently Delete Ticket?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove <strong className="text-white">"{ticket.title}"</strong> and its screenshot from your vault? This cannot be undone unless you have a backup.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeleteTicket(ticket.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-colors"
                >
                  Yes, Delete Stub
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
