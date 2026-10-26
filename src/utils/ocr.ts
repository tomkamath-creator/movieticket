import { createWorker } from 'tesseract.js';
import type { ExtractedTicketData, MovieFormat } from '../types';

export type OcrProgressCallback = (status: string, progress: number) => void;

/**
 * Runs client-side OCR using Tesseract.js directly inside the browser.
 * Free, offline-capable, and preserves complete user privacy.
 */
export async function scanTicketScreenshot(
  imageSource: string | File | Blob,
  onProgress?: OcrProgressCallback
): Promise<ExtractedTicketData> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    onProgress?.('Initializing scanner...', 0.1);

    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const progress = 0.2 + (m.progress || 0) * 0.7;
          onProgress?.(`Reading ticket text: ${Math.round((m.progress || 0) * 100)}%`, progress);
        } else if (m.status) {
          onProgress?.(m.status, 0.2);
        }
      },
    });

    onProgress?.('Scanning ticket details...', 0.3);
    const result = await worker.recognize(imageSource);
    const rawText = result.data.text || '';

    onProgress?.('Extracting cinema metadata...', 0.95);
    const extracted = parseTicketText(rawText);
    extracted.rawOcrText = rawText;

    onProgress?.('Complete!', 1.0);
    return extracted;
  } catch (err) {
    console.error('OCR processing error:', err);
    // Return empty extracted object rather than crashing
    return {
      title: '',
      cinema: '',
      dateWatched: new Date().toISOString().split('T')[0],
      format: '2D',
      seats: '',
      rawOcrText: '',
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Parses raw text extracted from a booking app screenshot (BookMyShow, AMC, Fandango, PVR, etc.)
 */
export function parseTicketText(text: string): ExtractedTicketData {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const data: ExtractedTicketData = {};

  // 1. Detect Format
  data.format = detectFormat(text);

  // 2. Detect Cinema Name
  data.cinema = detectCinema(lines, text);

  // 3. Detect Date
  data.dateWatched = detectDate(text);

  // 4. Detect Showtime
  data.timeWatched = detectTime(text);

  // 5. Detect Seats
  data.seats = detectSeats(text);

  // 6. Detect Screen / Hall / Auditorium
  data.hallOrScreen = detectHall(text);

  // 7. Detect Booking Reference ID
  data.bookingId = detectBookingId(text);

  // 8. Detect Price
  data.ticketPrice = detectPrice(text);

  // 9. Detect Movie Title
  data.title = detectMovieTitle(lines, text, data.cinema);

  return data;
}

function detectFormat(text: string): MovieFormat {
  const upper = text.toUpperCase();
  if (upper.includes('IMAX 3D') || upper.includes('IMAX-3D')) return 'IMAX 3D';
  if (upper.includes('IMAX')) return 'IMAX';
  if (upper.includes('DOLBY CINEMA')) return 'Dolby Cinema';
  if (upper.includes('DOLBY ATMOS')) return 'Dolby Atmos';
  if (upper.includes('4DX')) return '4DX';
  if (upper.includes('SCREENX') || upper.includes('SCREEN X')) return 'ScreenX';
  if (upper.includes('REALD 3D') || upper.includes('3D')) return '3D';
  return '2D';
}

function detectCinema(lines: string[], text: string): string {
  // Known cinema chains
  const chains = [
    'AMC Theatres',
    'AMC',
    'Regal Cinemas',
    'Regal',
    'Cinemark',
    'PVR INOX',
    'PVR',
    'INOX',
    'BookMyShow',
    'Fandango',
    'Cinepolis',
    'Alamo Drafthouse',
    'Marcus Theatres',
    'Harkins',
    'Landmark Cinemas',
    'Odeon',
    'Cineworld',
    'Vue',
    'TCL Chinese Theatre',
  ];

  for (const line of lines) {
    for (const chain of chains) {
      if (line.toLowerCase().includes(chain.toLowerCase())) {
        return line.replace(/[|•]/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  // Regex for "Cinema", "Theatre", "Multiplex"
  const match = text.match(/([A-Z0-9&'\s]+(?:Cinemas?|Theatres?|Multiplex|Hall|PVR|AMC)[A-Z0-9&'\s,-]*)/i);
  if (match) {
    return match[1].slice(0, 50).trim();
  }

  return 'Local Cinema';
}

function detectDate(text: string): string {
  const today = new Date().toISOString().split('T')[0];

  // Try standard date formats
  // Format: "Sat, Jul 22, 2023" or "July 22, 2023"
  const monthNames = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December';
  const verbalDateMatch = text.match(new RegExp(`(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,\\s]*(${monthNames})\\s*(\\d{1,2})(?:st|nd|rd|th)?[,\\s]*(\\d{4})?`, 'i'));
  if (verbalDateMatch) {
    try {
      const year = verbalDateMatch[3] || new Date().getFullYear().toString();
      const monthStr = verbalDateMatch[1];
      const day = verbalDateMatch[2].padStart(2, '0');
      const parsed = new Date(`${monthStr} ${day}, ${year}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {
      // ignore
    }
  }

  // Format: "22 Jul 2023"
  const dayMonthMatch = text.match(new RegExp(`(\\d{1,2})\\s*(${monthNames})\\s*(\\d{4})?`, 'i'));
  if (dayMonthMatch) {
    try {
      const day = dayMonthMatch[1].padStart(2, '0');
      const monthStr = dayMonthMatch[2];
      const year = dayMonthMatch[3] || new Date().getFullYear().toString();
      const parsed = new Date(`${monthStr} ${day}, ${year}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {
      // ignore
    }
  }

  // Format: "2023-07-22" or "22/07/2023" or "07/22/2023"
  const isoMatch = text.match(/\b(202\d[-/]\d{1,2}[-/]\d{1,2})\b/);
  if (isoMatch) return isoMatch[1].replace(/\//g, '-');

  const slashMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](202\d|\d{2})\b/);
  if (slashMatch) {
    let year = slashMatch[3];
    if (year.length === 2) year = `20${year}`;
    const part1 = slashMatch[1].padStart(2, '0');
    const part2 = slashMatch[2].padStart(2, '0');
    return `${year}-${part1}-${part2}`;
  }

  return today;
}

function detectTime(text: string): string {
  // Format: "07:30 PM" or "7:30pm" or "19:30"
  const time12Match = text.match(/\b(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM|am|pm)\b/);
  if (time12Match) {
    const hours = time12Match[1].padStart(2, '0');
    const mins = time12Match[2];
    const ampm = time12Match[3].toUpperCase();
    return `${hours}:${mins} ${ampm}`;
  }

  const time24Match = text.match(/\b(1[0-9]|2[0-3]):([0-5][0-9])\b/);
  if (time24Match) {
    const h = parseInt(time24Match[1], 10);
    const m = time24Match[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
  }

  return '07:00 PM';
}

function detectSeats(text: string): string {
  // Patterns like "Seats: E12, E13" or "Seat E12" or "Row F · Seat 18, 19"
  const seatPrefixMatch = text.match(/(?:Seats?|Seat No|Seat Numbers?)\s*[:#-]?\s*([A-Za-z0-9,\s\-–]+)/i);
  if (seatPrefixMatch) {
    const candidate = seatPrefixMatch[1].split('\n')[0].trim();
    if (candidate.length > 0 && candidate.length < 35) {
      return candidate;
    }
  }

  const rowSeatMatch = text.match(/Row\s*([A-Z])\s*[,·-]?\s*Seat\s*([0-9\s,&-]+)/i);
  if (rowSeatMatch) {
    return `Row ${rowSeatMatch[1]} · Seat ${rowSeatMatch[2].trim()}`;
  }

  // Format: "E12, E13" or "F14"
  const letterNumberMatch = text.match(/\b([A-Z]\s*[-–]?\s*\d{1,2}(?:\s*,\s*[A-Z]?\s*[-–]?\s*\d{1,2})*)\b/);
  if (letterNumberMatch) {
    return letterNumberMatch[1];
  }

  return 'General Admission';
}

function detectHall(text: string): string {
  const match = text.match(/(Audi(?:torium)?\s*\d+|Screen\s*\d+|Hall\s*\d+|Theater\s*\d+|IMAX\s*Screen)/i);
  return match ? match[1] : 'Screen 1';
}

function detectBookingId(text: string): string {
  const match = text.match(/(?:Booking ID|Order ID|Confirmation|Ref No|Ticket ID)\s*[:#-]?\s*([A-Za-z0-9-]+)/i);
  return match ? match[1] : '';
}

function detectPrice(text: string): string {
  const match = text.match(/(?:Total|Amount|Paid|Price|Cost)\s*[:#-]?\s*([$₹€£]\s*[0-9]+(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?\s*[$₹€£])/i);
  return match ? match[1] : '';
}

function detectMovieTitle(lines: string[], _fullText: string, cinemaName: string): string {
  const ignorePatterns = [
    /bookmyshow/i,
    /fandango/i,
    /amc/i,
    /regal/i,
    /cinemark/i,
    /pvr/i,
    /inox/i,
    /booking/i,
    /ticket/i,
    /confirmed/i,
    /order/i,
    /m-ticket/i,
    /tax invoice/i,
    /screen/i,
    /audi/i,
    /seat/i,
    /row/i,
    /date/i,
    /time/i,
    /total/i,
    /paid/i,
    /qr code/i,
    /scan/i,
    /cinema/i,
    /theatre/i,
    /hall/i,
    /admit/i,
    /bar/i,
  ];

  for (const line of lines) {
    // If line matches cinema name or is too short or too long
    if (line.length < 3 || line.length > 50) continue;
    if (cinemaName && line.toLowerCase().includes(cinemaName.toLowerCase())) continue;

    const matchesIgnore = ignorePatterns.some((pattern) => pattern.test(line));
    if (!matchesIgnore) {
      // Looks like a valid movie title line!
      return line
        .replace(/^[•\s\-_:*]+/, '')
        .replace(/[•\s\-_:*]+$/, '')
        .trim();
    }
  }

  return '';
}
