import React, { useState, useRef, useEffect } from 'react';
import type { Ticket, MovieFormat, MovieSearchResult } from '../../types';
import { scanTicketScreenshot } from '../../utils/ocr';
import { lookupMovie, generateFallbackPosterSvg } from '../../utils/movieLookup';
import { StarRating } from '../StarRating';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Sparkles,
  Calendar,
  MapPin,
  Armchair,
  Film,
  Search,
  CheckCircle2,
  Clock,
  Coins,
  Ticket as TicketIcon,
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

    // Convert file to Base64 Data URL for persistent storage in IndexedDB
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
    setScanProgress(0.1);
    setScanStatus('Reading ticket screenshot in browser...');

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
      setScanStatus(`Searching official movie details for "${candidateTitle}"...`);
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
      setScanStatus('Complete! Review your ticket stub.');
      setTimeout(() => {
        setStep('verify');
      }, 500);
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
      year: year || new Date(dateWatched).getFullYear().toString(),
      releaseDate: '',
      director: director.trim(),
      genres: genres.length > 0 ? genres : ['Cinema'],
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

    // Trigger celebratory golden confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'],
      });
    } catch {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0f111a] border border-amber-500/35 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141724]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {step === 'upload' && 'Add Movie Ticket to Vault'}
                {step === 'scanning' && 'Scanning Ticket Screenshot...'}
                {step === 'verify' && 'Verify & Save Collectible Stub'}
              </h2>
              <p className="text-[11px] text-slate-400">
                100% Free · 100% In-Browser · Saved Permanently On Device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: UPLOAD SCREENSHOT */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-10 text-center cursor-pointer bg-[#121520]/80 hover:bg-[#161a29]/90 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Drop your ticket screenshot here
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md">
                  Works with booking screenshots from <strong className="text-slate-300">BookMyShow, AMC, Fandango, PVR, Regal, Cinepolis</strong>, or any e-ticket image.
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <span className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all">
                    Choose Image File
                  </span>
                </div>
              </div>

              {/* Supported details highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                <div className="p-3 rounded-xl bg-[#121520] border border-slate-800 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 block">Browser-Side AI Scanner</strong>
                    Free WebAssembly OCR extracts title, seats, time &amp; theater.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#121520] border border-slate-800 flex items-start gap-2.5">
                  <Film className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 block">Theatrical Metadata</strong>
                    Auto-fetches official poster, director, runtime &amp; synopsis.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#121520] border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 block">100% Private &amp; Offline</strong>
                    Zero cloud API costs. Everything stays on your computer.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING SCREENSHOT (WITH LASER SWEEP ANIMATION) */}
          {step === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              {/* Preview image with laser scanning line */}
              <div className="relative w-72 h-96 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] bg-slate-900">
                {screenshotDataUrl && (
                  <img
                    src={screenshotDataUrl}
                    alt="Scanning"
                    className="w-full h-full object-cover filter brightness-90"
                  />
                )}
                <div className="laser-line" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-black/75 px-3 py-1 rounded-full border border-amber-500/40">
                    Scanning Stub
                  </span>
                </div>
              </div>

              {/* Status and Progress Bar */}
              <div className="w-full max-w-md space-y-2 text-center">
                <p className="text-sm font-semibold text-white animate-pulse">
                  {scanStatus || 'Analyzing ticket details...'}
                </p>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 shadow-[0_0_10px_#f59e0b]"
                    style={{ width: `${Math.round(scanProgress * 100)}%` }}
                  />
                </div>

                <span className="text-xs font-mono text-slate-500">
                  {Math.round(scanProgress * 100)}% Complete
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFY & EDIT DETAILS */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Ticket details scanned! Check the information below and tweak anything before saving to your vault.
                </span>
              </div>

              {/* Movie Header / Poster Search Card */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-slate-800 flex flex-col sm:flex-row gap-5 items-start">
                {/* Poster Display */}
                <div className="relative w-28 h-40 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl">
                  <img
                    src={posterUrl || generateFallbackPosterSvg(title)}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-[9px] font-bold uppercase bg-black/80 text-amber-300 px-1 py-0.5 rounded backdrop-blur-sm">
                    {format}
                  </span>
                </div>

                {/* Movie Title & Auto-Lookup Input */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Movie Title</span>
                      <span className="text-[10px] text-amber-400 font-normal">
                        Type to search official posters &amp; info
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleSearchMovieTitle(e.target.value)}
                        placeholder="e.g. Oppenheimer, Dune: Part Two"
                        className="w-full px-3 py-2 bg-black/50 border border-slate-700 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                                {m.year} {m.director ? `· ${m.director}` : ''}{' '}
                                {m.genres?.length > 0 ? `· ${m.genres.join(', ')}` : ''}
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
                        placeholder="2023"
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Director</label>
                      <input
                        type="text"
                        value={director}
                        onChange={(e) => setDirector(e.target.value)}
                        placeholder="Christopher Nolan"
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white truncate"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Runtime</label>
                      <input
                        type="text"
                        value={runtime}
                        onChange={(e) => setRuntime(e.target.value)}
                        placeholder="180 min"
                        className="w-full px-2.5 py-1.5 bg-black/40 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cinema & Screening Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    placeholder="e.g. AMC Empire 25, PVR INOX"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Format Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Experience Format</span>
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as MovieFormat)}
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="IMAX">IMAX</option>
                    <option value="IMAX 3D">IMAX 3D</option>
                    <option value="Dolby Cinema">Dolby Cinema</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="4DX">4DX</option>
                    <option value="3D">3D / RealD 3D</option>
                    <option value="ScreenX">ScreenX</option>
                    <option value="2D">Standard 2D</option>
                  </select>
                </div>

                {/* Date Watched */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Date Watched</span>
                  </label>
                  <input
                    type="date"
                    value={dateWatched}
                    onChange={(e) => setDateWatched(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auditorium / Screen</span>
                  </label>
                  <input
                    type="text"
                    value={hallOrScreen}
                    onChange={(e) => setHallOrScreen(e.target.value)}
                    placeholder="Audi 4, IMAX 1"
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
                    placeholder="E12, E13 or Row F"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Booking ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Booking ID / Order #
                  </label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. BMS-89310"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ticket Price Paid</span>
                  </label>
                  <input
                    type="text"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="$19.50 or ₹450"
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
                    placeholder="e.g. Alex, Sam"
                    className="w-full px-3 py-2 bg-[#141724] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Diary & Rating Section */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-amber-500/25 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Initial Diary Rating &amp; Review
                  </span>
                  <StarRating rating={rating} onChange={(r) => setRating(r)} size="md" showNumber />
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What did you think of the film? Any standout theater experiences or audience reactions?"
                  rows={3}
                  className="w-full p-3 bg-black/40 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              Upload Different Image
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save to Permanent Vault</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
