import { createWorker } from 'tesseract.js';
import type { ExtractedTicketData, MovieFormat } from '../types';

export type OcrProgressCallback = (status: string, progress: number) => void;

/**
 * Runs client-side OCR using Tesseract.js directly inside the browser.
 */
export async function scanTicketScreenshot(
  imageSource: string | File | Blob,
  onProgress?: OcrProgressCallback
): Promise<ExtractedTicketData> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    onProgress?.('Reading ticket image...', 0.15);

    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const progress = 0.2 + (m.progress || 0) * 0.7;
          onProgress?.(`Scanning: ${Math.round((m.progress || 0) * 100)}%`, progress);
        }
      },
    });

    onProgress?.('Analyzing cinema details...', 0.3);
    const result = await worker.recognize(imageSource);
    const rawText = result.data.text || '';

    onProgress?.('Extracting information...', 0.95);
    const extracted = parseTicketText(rawText);
    extracted.rawOcrText = rawText;

    onProgress?.('Done', 1.0);
    return extracted;
  } catch (err) {
    console.error('OCR processing error:', err);
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
 * Cleans raw movie titles extracted from booking tickets (BookMyShow, PVR INOX, AMC, etc.)
 * Strips certifications (UA13+, A, U, PG-13), language/subtitles, and OCR noise.
 */
export function cleanMovieTitle(raw: string): string {
  if (!raw) return '';

  let cleaned = raw
    // Join wrapped words like "Mov\nie:" -> "Movie:"
    .replace(/Mov\s*ie/gi, 'Movie')
    // Remove certification suffixes like (UA13+), (UA16+), (UA), (A), (U), (PG-13), (R)
    .replace(/\s*\((?:UA\s*\d*\+?|UA|A|U|PG-?13|R|PG|NC-?17)\)/gi, '')
    // Remove multi-line or single-line language / subtitle parentheticals
    .replace(/\s*\([^)]*(?:ENGLISH|HINDI|JAPANESE|TAMIL|TELUGU|SUBTITLE|UA|PG|NC|\+)[^)]*\)/gi, '')
    .replace(/\s*\([^)]*$/g, '') // remove unclosed parenthetical at end of line like "(ENGLISH WITH"
    .replace(/\s*\([^)]*\)/g, '') // remove any remaining parentheticals
    // Remove language / format keywords if leftover
    .replace(/\b(?:ENGLISH|HINDI|JAPANESE|TAMIL|TELUGU|2D|3D|IMAX|4DX)\b/gi, '')
    // Remove common OCR junk prefixes like TT, SOM, py, LC" JM, [Em], etc.
    .replace(/^(?:TT|SOM|py|LC[”"]?\s*JM|\[[^\]]+\]|\W)+\s*/i, '')
    // Remove common booking phrases that might be caught
    .replace(/\b(?:Watch\s*Trailer|Trailer|Booking\s*Details|Enjoy\s*your\s*show)\b/gi, '')
    // Strip trailing/leading punctuation
    .replace(/^[•\s\-_:*|/]+/, '')
    .replace(/[•\s\-_:*|/]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize nicely if all uppercase
  if (cleaned.length > 3 && cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return cleaned;
}

/**
 * Intelligent parser specifically tuned for real booking tickets:
 * BookMyShow, PVR INOX, WhatsApp E-Tickets, AMC, Fandango, Regal.
 */
export function parseTicketText(text: string): ExtractedTicketData {
  const data: ExtractedTicketData = {};

  // 1. Detect Format
  data.format = detectFormat(text);

  // 2. Detect Cinema Name
  data.cinema = detectCinema(text);

  // 3. Detect Auditorium / Screen
  data.hallOrScreen = detectScreen(text);

  // 4. Detect Seats
  data.seats = detectSeats(text);

  // 5. Detect Booking / Order ID
  data.bookingId = detectBookingId(text);

  // 6. Detect Date
  data.dateWatched = detectDate(text);

  // 7. Detect Showtime
  data.timeWatched = detectTime(text);

  // 8. Detect Ticket Price
  data.ticketPrice = detectPrice(text);

  // 9. Detect Movie Title
  data.title = detectMovieTitle(text);

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
  if (upper.includes('3D')) return '3D';
  return '2D';
}

function detectCinema(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Scan lines for cinema brands
  for (const line of lines) {
    if (
      /(?:PVR|INOX|C&B\s*Square|Infiniti|Andheri|AMC|Regal|Cinemark|Cinepolis|Sangam|Forum|Phoenix|Cineplex)/i.test(line) &&
      !/(?:choosing|enjoy|support|wallet|trailer|booking details|booked|successful|welcome|dear|total|amount)/i.test(line)
    ) {
      return line
        .replace(/^[^\w]*(?:PVR|INOX)/i, (m) => m.trim())
        .replace(/[•|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // Generic fallback match
  const match = text.match(/([A-Z0-9&'\s]+(?:Cinemas?|Theatres?|Multiplex|PVR|INOX)[A-Z0-9&'\s,-]*)/i);
  if (match) {
    return match[1].slice(0, 50).trim();
  }

  return 'Cinema';
}

function detectScreen(text: string): string {
  const match = text.match(/(?:SCREEN|AUDI(?:TORIUM)?|HALL)\s*([0-9]+)/i);
  if (match) {
    return `Screen ${match[1]}`;
  }
  return 'Screen 1';
}

function detectSeats(text: string): string {
  // 1. BookMyShow format like "QR-K8" or "PR-J9"
  const bmsSeat = text.match(/\b(?:QR|PR|CL|EX|GL|DI)[-–\s]?([A-Z]\s*\d{1,2})\b/i);
  if (bmsSeat) {
    return bmsSeat[1].replace(/\s+/g, '').toUpperCase();
  }

  // 2. Multiple seat tags like "N10 N9 N8 N7" or "A1, A2"
  const multiSeatMatch = text.match(/\b([A-Z]\d{1,2}(?:\s+[A-Z]\d{1,2})+)\b/);
  if (multiSeatMatch) {
    return multiSeatMatch[1].split(/\s+/).join(', ');
  }

  // 3. Line under "SEATS INFO"
  const seatsInfoMatch = text.match(/SEATS?\s*(?:INFO)?[\s\n:]+([A-Z]\d{1,2}(?:[\s,]+[A-Z]?\d{1,2})*)/i);
  if (seatsInfoMatch) {
    return seatsInfoMatch[1].trim();
  }

  // 4. Standalone Seat e.g. "L8" or "R6"
  const lines = text.split('\n').map((l) => l.trim());
  for (const l of lines) {
    if (/^[A-Z]\d{1,2}$/i.test(l)) {
      return l.toUpperCase();
    }
  }

  const singleSeatMatch = text.match(/\b(?:Row\s*[A-Z]\s*Seat\s*\d+|[A-Z]\d{1,2})\b/i);
  if (singleSeatMatch) {
    return singleSeatMatch[0].toUpperCase();
  }

  return 'General Admission';
}

function detectBookingId(text: string): string {
  // Matches "BOOKING ID: TPAFADW", "Order ID 1538145", "Booking ID: TQAMD87"
  const match = text.match(/(?:BOOKING\s*ID|Order\s*ID|Ref\s*No|Ticket\s*ID)[\s:0#-]*([A-Z0-9]{5,20})/i);
  if (match) {
    return match[1];
  }

  // Standalone uppercase booking code like "TPAFADW", "TAANCRV", "TCAQEQ6"
  const standaloneCode = text.match(/\b([A-Z]{4,8}[0-9]{0,4})\b/);
  if (standaloneCode && !['SCREEN', 'PVR', 'INOX', 'TICKET', 'TOTAL', 'ACTION', 'PRICE', 'AMOUNT'].includes(standaloneCode[1])) {
    return standaloneCode[1];
  }

  return '';
}

function detectDate(text: string): string {
  const currentYear = new Date().getFullYear().toString();
  const monthNames = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December';

  // Format 1: "Tue, 30 Sep" or "Fri, 17 Jul"
  const verbalDate = text.match(new RegExp(`(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,\\s]*(\\d{1,2})[-/\\s]+(${monthNames})(?:[-/\\s]*(20\\d{2}))?`, 'i'));
  if (verbalDate) {
    const day = verbalDate[1];
    const month = verbalDate[2];
    const yr = verbalDate[3] || currentYear;
    return `${day} ${month} ${yr}`;
  }

  // Format 2: "03-Apr-2026"
  const dayMonthYear = text.match(new RegExp(`(\\d{1,2})[-/\\s]+(${monthNames})[-/\\s]+(\\d{4})`, 'i'));
  if (dayMonthYear) {
    return `${dayMonthYear[1]} ${dayMonthYear[2]} ${dayMonthYear[3]}`;
  }

  // Format 3: ISO date "2026-07-17"
  const isoMatch = text.match(/\b(202\d[-/]\d{1,2}[-/]\d{1,2})\b/);
  if (isoMatch) return isoMatch[1].replace(/\//g, '-');

  return new Date().toISOString().split('T')[0];
}

function detectTime(text: string): string {
  // Format: "03:45 PM" or "9:45 AM" or "11:05 AM"
  const match = text.match(/\b(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)\b/i);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const mins = match[2];
    const ampm = match[3].toUpperCase();
    return `${hours}:${mins} ${ampm}`;
  }
  return '07:00 PM';
}

function detectPrice(text: string): string {
  const match = text.match(/(?:Total(?:\s*Ticket\s*Price|\s*Amount)?|Price|Paid)\s*[:#-]?\s*[₹$€£]?\s*([0-9]+(?:[.,][0-9]{2})?)/i);
  if (match) {
    return `₹${match[1]}`;
  }
  return '';
}

function detectMovieTitle(text: string): string {
  // Strip multi-line subtitles before line splitting
  const normalizedText = text
    .replace(/\n\s*ENGLISH SUBTITLE[^\n]*/gi, '')
    .replace(/\n\s*WITH ENGLISH SUBTITLE[^\n]*/gi, '');

  const lines = normalizedText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let rawTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains certification like (UA13+), (A), (U) or language
    if (/\((?:UA\d*\+?|A|U|PG-?\d*)\)/i.test(line) || /\(ENGLISH|\(HINDI|\(JAPANESE/i.test(line)) {
      if (i > 0 && lines[i - 1].length > 3 && !/Ticket|Enjoy|PVR|INOX|Booking|Thank|choosing/i.test(lines[i - 1])) {
        rawTitle = `${lines[i - 1]} ${line}`;
      } else {
        rawTitle = line;
      }
      break;
    }

    // Check if next line is format/language (e.g. "Japanese, 2D" or "Action • English")
    if (i < lines.length - 1 && /(?:Japanese|English|Hindi|Tamil|Telugu|Action|Thriller|Drama|Romance)\s*[,•]/i.test(lines[i + 1])) {
      if (line.length > 2 && !/Ticket|Enjoy|PVR|INOX|Booking|Thank|choosing/i.test(line)) {
        if (i > 0 && lines[i - 1].length > 3 && !/Ticket|Enjoy|PVR|INOX|Booking|Thank|choosing/i.test(lines[i - 1])) {
          rawTitle = `${lines[i - 1]} ${line}`;
        } else {
          rawTitle = line;
        }
        break;
      }
    }
  }

  // Fallback: line right after "Enjoy your show"
  if (!rawTitle) {
    for (let i = 0; i < lines.length; i++) {
      if (/Enjoy your show/i.test(lines[i]) && i < lines.length - 1) {
        rawTitle = lines[i + 1];
        if (i + 2 < lines.length && /\(ENGLISH|\(A\)/i.test(lines[i + 2])) {
          rawTitle += ' ' + lines[i + 2];
        }
        break;
      }
    }
  }

  return cleanMovieTitle(rawTitle);
}
