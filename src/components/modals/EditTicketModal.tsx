import React, { useState, useEffect } from 'react';
import type { Ticket, MovieFormat } from '../../types';
import { X, Save, Film, Calendar, MapPin, Armchair, Clock, Coins } from 'lucide-react';

interface EditTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Ticket>) => Promise<void>;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [cinema, setCinema] = useState('');
  const [dateWatched, setDateWatched] = useState('');
  const [timeWatched, setTimeWatched] = useState('');
  const [format, setFormat] = useState<MovieFormat>('2D');
  const [hallOrScreen, setHallOrScreen] = useState('');
  const [seats, setSeats] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [director, setDirector] = useState('');
  const [year, setYear] = useState('');
  const [runtime, setRuntime] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [synopsis, setSynopsis] = useState('');

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setCinema(ticket.cinema);
      setDateWatched(ticket.dateWatched);
      setTimeWatched(ticket.timeWatched || '');
      setFormat(ticket.format);
      setHallOrScreen(ticket.hallOrScreen || '');
      setSeats(ticket.seats || '');
      setBookingId(ticket.bookingId || '');
      setTicketPrice(ticket.ticketPrice || '');
      setDirector(ticket.director || '');
      setYear(ticket.year || '');
      setRuntime(ticket.runtime || '');
      setPosterUrl(ticket.posterUrl);
      setBackdropUrl(ticket.backdropUrl || '');
      setSynopsis(ticket.synopsis || '');
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(ticket.id, {
      title,
      cinema,
      dateWatched,
      timeWatched,
      format,
      hallOrScreen,
      seats,
      bookingId,
      ticketPrice,
      director,
      year,
      runtime,
      posterUrl,
      backdropUrl,
      synopsis,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0f111a] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141724]">
          <h2 className="text-base font-bold text-white">Edit Ticket Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Movie Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Cinema / Theater</span>
              </label>
              <input
                type="text"
                value={cinema}
                onChange={(e) => setCinema(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>Format</span>
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as MovieFormat)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white cursor-pointer"
              >
                <option value="IMAX">IMAX</option>
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="Dolby Cinema">Dolby Cinema</option>
                <option value="Dolby Atmos">Dolby Atmos</option>
                <option value="4DX">4DX</option>
                <option value="3D">3D</option>
                <option value="ScreenX">ScreenX</option>
                <option value="2D">2D</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Date Watched</span>
              </label>
              <input
                type="date"
                value={dateWatched}
                onChange={(e) => setDateWatched(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Showtime</span>
              </label>
              <input
                type="text"
                value={timeWatched}
                onChange={(e) => setTimeWatched(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Armchair className="w-3.5 h-3.5 text-amber-400" />
                <span>Seat Numbers</span>
              </label>
              <input
                type="text"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-amber-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Auditorium / Hall</label>
              <input
                type="text"
                value={hallOrScreen}
                onChange={(e) => setHallOrScreen(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Booking ID</label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Price Paid</span>
              </label>
              <input
                type="text"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Director</label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Story Synopsis</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={2}
              className="w-full p-2.5 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
