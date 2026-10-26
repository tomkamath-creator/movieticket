import React, { useState, useRef, useEffect } from 'react';
import type { Ticket, MovieFormat, MovieSearchResult } from '../../types';
import { scanTicketScreenshot } from '../../utils/ocr';
import { lookupMovie, generateFallbackPosterSvg } from '../../utils/movieLookup';
import { StarRating } from '../StarRating';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Calendar,
  MapPin,
  Armchair,
  Search,
  Clock,
  Coins,
  Ticket as TicketIcon,
  Image as ImageIcon,
} from 'lucide-react';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTicket: (ticket: Ticket) => Promise<void>;
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({
  isOpen,
  onClose,
  onSaveTicket,
}) => {
  const [step, setStep] = useState<'upload' | 'scanning' | 'verify'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Form fields for Step 2
  const [title, setTitle] = useState('');
  const [cinema, setCinema] = useState('');
  const [dateWatched, setDateWatched] = useState(new Date().toISOString().split('T')[0]);
  const [timeWatched, setTimeWatched] = useState('07:00 PM');
  const [format, setFormat] = useState<MovieFormat>('2D');
  const [hallOrScreen, setHallOrScreen] = useState('Screen 1');
  const [seats, setSeats] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [rating, setRating] = useState(5.0);
  const [review, setReview] = useState('');
  const [companions, setCompanions] = useState('');

  // Movie lookup results
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [year, setYear] = useState('');
  const [director, setDirector] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [runtime, setRuntime] = useState('');
  const [synopsis, setSynopsis] = useState('');

  // Movie search dropdown
  const [movieSearchResults, setMovieSearchResults] = useState<MovieSearchResult[]>([]);
  const [isSearchingMovie, setIsSearchingMovie] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal when reopened
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setSelectedFile(null);
      setScreenshotDataUrl('');
      setScanStatus('');
      setScanProgress(0);
      setTitle('');
      setCinema('');
      setDateWatched(new Date().toISOString().split('T')[0]);
      setTimeWatched('07:00 PM');
      setFormat('2D');
      setHallOrScreen('Screen 1');
      setSeats('');
      setBookingId('');
      setTicketPrice('');
      setRating(5.0);
      setReview('');
      setCompanions('');
      setPosterUrl('');
      setBackdropUrl('');
      setYear('');
      setDirector('');
      setGenres([]);
      setRuntime('');
      setSynopsis('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process uploaded screenshot file
  const handleFile = async (file: File) => {
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setScreenshotDataUrl(dataUrl);
      startOcrScan(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Run in-browser OCR + Movie Lookup
  const startOcrScan = async (dataUrl: string, fileName: string) => {
    setStep('scanning');
    setScanProgress(0.15);
    setScanStatus('Scanning ticket stub...');

    try {
      // 1. In-browser OCR
      const extracted = await scanTicketScreenshot(dataUrl, (status, prog) => {
        setScanStatus(status);
        setScanProgress(prog);
      });

      // Populate extracted fields
      const candidateTitle = extracted.title || fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(candidateTitle);
      if (extracted.cinema) setCinema(extracted.cinema);
      if (extracted.dateWatched) setDateWatched(extracted.dateWatched);
      if (extracted.timeWatched) setTimeWatched(extracted.timeWatched);
      if (extracted.format) setFormat(extracted.format);
      if (extracted.seats) setSeats(extracted.seats);
      if (extracted.hallOrScreen) setHallOrScreen(extracted.hallOrScreen);
      if (extracted.bookingId) setBookingId(extracted.bookingId);
      if (extracted.ticketPrice) setTicketPrice(extracted.ticketPrice);

      // 2. Movie Details Lookup
      setScanStatus('Matching official movie artwork...');
      setScanProgress(0.85);

      if (candidateTitle) {
        const matches = await lookupMovie(candidateTitle);
        if (matches && matches.length > 0) {
          const best = matches[0];
          applyMovieMatch(best);
          setMovieSearchResults(matches);
        } else {
          setPosterUrl(generateFallbackPosterSvg(candidateTitle));
        }
      }

      setScanProgress(1.0);
      setScanStatus('Done');
      setTimeout(() => {
        setStep('verify');
      }, 400);
    } catch (err) {
      console.error('Scan error:', err);
      setStep('verify');
    }
  };

  const applyMovieMatch = (movie: MovieSearchResult) => {
    setTitle(movie.title);
    setPosterUrl(movie.posterUrl);
    setBackdropUrl(movie.backdropUrl || movie.posterUrl);
    if (movie.year) setYear(movie.year);
    if (movie.director) setDirector(movie.director);
    if (movie.genres) setGenres(movie.genres);
    if (movie.runtime) setRuntime(movie.runtime);
    if (movie.synopsis) setSynopsis(movie.synopsis);
    setShowSearchResults(false);
  };

  // Manual Movie Title Search in Verify step
  const handleSearchMovieTitle = async (query: string) => {
    setTitle(query);
    if (query.trim().length >= 2) {
      setIsSearchingMovie(true);
      setShowSearchResults(true);
      try {
        const matches = await lookupMovie(query);
        setMovieSearchResults(matches);
      } catch (err) {
        console.warn('Search lookup error:', err);
      } finally {
        setIsSearchingMovie(false);
      }
    } else {
      setMovieSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Save Ticket to Vault
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a movie title.');
      return;
    }

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: title.trim(),
      year: year || new Date().getFullYear().toString(),
      releaseDate: '',
      director: director.trim(),
      genres: genres.length > 0 ? genres : ['Feature Film'],
      runtime: runtime || '120 min',
      synopsis: synopsis.trim(),
      posterUrl: posterUrl || generateFallbackPosterSvg(title),
      backdropUrl: backdropUrl || posterUrl || generateFallbackPosterSvg(title),
      cinema: cinema.trim() || 'Cinema',
      dateWatched: dateWatched || new Date().toISOString().split('T')[0],
      timeWatched: timeWatched || '07:00 PM',
      format,
      hallOrScreen: hallOrScreen || 'Screen 1',
      seats: seats.trim() || 'General Admission',
      bookingId: bookingId.trim(),
      ticketPrice: ticketPrice.trim(),
      rating,
      review: review.trim(),
      companions: companions.trim(),
      screenshotDataUrl: screenshotDataUrl,
      screenshotFileName: selectedFile?.name || 'ticket_screenshot.png',
    };

    await onSaveTicket(newTicket);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fef08a'],
      });
    } catch {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0f111a] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141724]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                {step === 'upload' && 'Add Movie Ticket'}
                {step === 'scanning' && 'Scanning Ticket Stub...'}
                {step === 'verify' && 'Review & Save Stub'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: UPLOAD SCREENSHOT */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-2xl p-12 text-center cursor-pointer bg-[#121520] hover:bg-[#151926] transition-all flex flex-col items-center justify-center min-h-[320px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-all mb-4">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Upload or drop your ticket screenshot
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                  Compatible with BookMyShow, PVR INOX, AMC, Fandango, WhatsApp passes, and digital stubs.
                </p>

                <div className="mt-5">
                  <span className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all">
                    Select Screenshot
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING SCREENSHOT */}
          {step === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="relative w-64 h-80 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-slate-900">
                {screenshotDataUrl && (
                  <img
                    src={screenshotDataUrl}
                    alt="Scanning"
                    className="w-full h-full object-cover filter brightness-90"
                  />
                )}
                <div className="laser-line" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              </div>

              <div className="w-full max-w-sm space-y-2 text-center">
                <p className="text-xs font-semibold text-slate-200">
                  {scanStatus || 'Reading ticket details...'}
                </p>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.round(scanProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFY & EDIT DETAILS */}
          {step === 'verify' && (
            <div className="space-y-5">
              {/* Movie Header / Poster Search Card */}
              <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 flex flex-col sm:flex-row gap-5 items-start">
                {/* Poster Display & Switcher */}
                <div className="relative w-28 h-40 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-lg">
                  <img
                    src={posterUrl || generateFallbackPosterSvg(title)}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {screenshotDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPosterUrl(screenshotDataUrl)}
                      className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-[9px] font-bold uppercase bg-black/80 hover:bg-amber-500 hover:text-slate-950 text-slate-300 px-1 py-1 rounded backdrop-blur-sm transition-colors flex items-center justify-center gap-1"
                      title="Use screenshot crop as poster"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Use Stub Art</span>
                    </button>
                  )}
                </div>

                {/* Movie Title & Auto-Lookup Input */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Movie Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleSearchMovieTitle(e.target.value)}
                        placeholder="Movie Title"
                        className="w-full px-3 py-2 bg-black/40 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                      {isSearchingMovie && (
                        <Search className="w-4 h-4 text-amber-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Movie Lookup Suggestions Dropdown */}
                    {showSearchResults && movieSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#161a29] border border-amber-500/40 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                        {movieSearchResults.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => applyMovieMatch(m)}
                            className="p-2.5 flex items-center gap-3 hover:bg-amber-500/15 cursor-pointer transition-colors"
                          >
                            <img
                              src={m.posterUrl}
                              alt=""
                              className="w-8 h-12 object-cover rounded bg-slate-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">{m.title}</h5>
                              <p className="text-[11px] text-slate-400 truncate">
                                {m.year} {m.director ? `· ${m.director}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Director, Year, Runtime row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Year</label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="2026"
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Director</label>
                      <input
                        type="text"
                        value={director}
                        onChange={(e) => setDirector(e.target.value)}
                        placeholder="Director"
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white truncate"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Runtime</label>
                      <input
                        type="text"
                        value={runtime}
                        onChange={(e) => setRuntime(e.target.value)}
                        placeholder="120 min"
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cinema & Screening Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Cinema Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cinema / Theater</span>
                  </label>
                  <input
                    type="text"
                    value={cinema}
                    onChange={(e) => setCinema(e.target.value)}
                    placeholder="Cinema Name"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Format Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as MovieFormat)}
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="2D">2D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="IMAX 3D">IMAX 3D</option>
                    <option value="Dolby Cinema">Dolby Cinema</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="4DX">4DX</option>
                    <option value="3D">3D</option>
                    <option value="ScreenX">ScreenX</option>
                  </select>
                </div>

                {/* Date Watched */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Date Watched</span>
                  </label>
                  <input
                    type="text"
                    value={dateWatched}
                    onChange={(e) => setDateWatched(e.target.value)}
                    placeholder="30 Sep 2026"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Showtime */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Showtime</span>
                  </label>
                  <input
                    type="text"
                    value={timeWatched}
                    onChange={(e) => setTimeWatched(e.target.value)}
                    placeholder="07:00 PM"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Hall / Screen */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Screen / Auditorium
                  </label>
                  <input
                    type="text"
                    value={hallOrScreen}
                    onChange={(e) => setHallOrScreen(e.target.value)}
                    placeholder="Screen 1"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Seats */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Armchair className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seat Numbers</span>
                  </label>
                  <input
                    type="text"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    placeholder="K8, L8, or N10, N9"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Booking ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Booking ID / Order Ref
                  </label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. TPAFADW"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Price Paid</span>
                  </label>
                  <input
                    type="text"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="₹166.58"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Companions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Watched With
                  </label>
                  <input
                    type="text"
                    value={companions}
                    onChange={(e) => setCompanions(e.target.value)}
                    placeholder="Solo, Friends, Family"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Diary & Rating Section */}
              <div className="p-4 rounded-xl bg-[#141724] border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Diary Rating
                  </span>
                  <StarRating rating={rating} onChange={(r) => setRating(r)} size="md" showNumber />
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Your personal review or memories (optional)..."
                  rows={2}
                  className="w-full p-2.5 bg-black/40 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#141724] flex items-center justify-between">
          {step === 'verify' ? (
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Different Screenshot
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>

            {step === 'verify' && (
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
              >
                Save to Vault
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
