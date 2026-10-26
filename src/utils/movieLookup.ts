import type { MovieSearchResult } from '../types';

/**
 * Searches movie details using free public APIs (iTunes Search API + Wikipedia Summary API).
 * Requires ZERO paid API keys, runs directly in the client browser.
 */
export async function lookupMovie(rawTitle: string): Promise<MovieSearchResult[]> {
  const cleanTitle = cleanMovieTitle(rawTitle);
  if (!cleanTitle || cleanTitle.length < 2) {
    return [];
  }

  const results: MovieSearchResult[] = [];

  // 1. Primary Source: iTunes Search API (100% Free, No API key, CORS supported)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&media=movie&entity=movie&limit=5`;
    const itunesRes = await fetch(itunesUrl);
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (itunesData.results && itunesData.results.length > 0) {
        for (const item of itunesData.results) {
          // Convert 100x100 thumbnail to ultra-high-res 1200x1200bb poster
          const highResPoster = item.artworkUrl100
            ? item.artworkUrl100.replace('100x100bb', '1200x1200bb')
            : '';

          // Format runtime
          let runtimeStr = '';
          if (item.trackTimeMillis) {
            const minutes = Math.round(item.trackTimeMillis / 60000);
            const hours = Math.floor(minutes / 60);
            const remainingMins = minutes % 60;
            runtimeStr = hours > 0 ? `${hours}h ${remainingMins}m` : `${minutes} min`;
          }

          // Format release year
          const releaseDate = item.releaseDate ? item.releaseDate.split('T')[0] : '';
          const year = releaseDate ? releaseDate.split('-')[0] : '';

          // Genres
          const genres: string[] = [];
          if (item.primaryGenreName) {
            genres.push(item.primaryGenreName);
          }

          results.push({
            title: item.trackName || cleanTitle,
            year,
            releaseDate,
            director: item.artistName || '',
            genres,
            runtime: runtimeStr,
            synopsis: item.longDescription || item.shortDescription || '',
            posterUrl: highResPoster,
            backdropUrl: highResPoster, // fallback backdrop
          });
        }
      }
    }
  } catch (err) {
    console.warn('iTunes API search warning:', err);
  }

  // 2. Secondary Source: Wikipedia REST API for background banner and rich extract
  try {
    const wikiQueries = [
      `${cleanTitle} (film)`,
      `${cleanTitle} (${new Date().getFullYear()} film)`,
      cleanTitle,
    ];

    for (const q of wikiQueries) {
      try {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.type !== 'disambiguation' && wikiData.extract) {
            // If we have iTunes results, enrich the top result with Wikipedia backdrop and synopsis
            if (results.length > 0) {
              if (wikiData.originalimage?.source) {
                results[0].backdropUrl = wikiData.originalimage.source;
              }
              if (!results[0].synopsis && wikiData.extract) {
                results[0].synopsis = wikiData.extract;
              }
            } else {
              // Add Wikipedia as a result if iTunes didn't return anything
              results.push({
                title: wikiData.title.replace(' (film)', ''),
                year: extractYearFromText(wikiData.description || wikiData.extract),
                releaseDate: '',
                director: extractDirectorFromText(wikiData.extract),
                genres: ['Feature Film'],
                synopsis: wikiData.extract,
                posterUrl: wikiData.thumbnail?.source || wikiData.originalimage?.source || generateFallbackPosterSvg(cleanTitle),
                backdropUrl: wikiData.originalimage?.source || wikiData.thumbnail?.source || '',
              });
            }
            break;
          }
        }
      } catch {
        // Continue to next wiki query
      }
    }
  } catch (err) {
    console.warn('Wikipedia API lookup warning:', err);
  }

  // If still empty, return a synthesized fallback card so the user is never left without data
  if (results.length === 0) {
    results.push({
      title: cleanTitle,
      year: new Date().getFullYear().toString(),
      releaseDate: new Date().toISOString().split('T')[0],
      director: '',
      genres: ['Cinema'],
      runtime: '120 min',
      synopsis: `An exciting cinematic presentation of "${cleanTitle}".`,
      posterUrl: generateFallbackPosterSvg(cleanTitle),
      backdropUrl: '',
    });
  }

  return results;
}

// Cleans messy OCR strings to extract the core movie title
export function cleanMovieTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\b(BOOKING CONFIRMED|M-TICKET|TAX INVOICE|E-TICKET|ORDER DETAILS|SEATS?|AUDI|SCREEN)\b/gi, '')
    .replace(/[^\w\s:’'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYearFromText(text?: string): string {
  if (!text) return '';
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : '';
}

function extractDirectorFromText(text?: string): string {
  if (!text) return '';
  const match = text.match(/directed by ([A-Z][a-z]+ [A-Z][a-z]+)/i);
  return match ? match[1] : '';
}

// Generate dynamic stylish SVG poster if offline or unavailable
export function generateFallbackPosterSvg(title: string): string {
  const safeTitle = (title || 'CINEMA').slice(0, 30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f111a"/>
        <stop offset="50%" stop-color="#1b2030"/>
        <stop offset="100%" stop-color="#090a0f"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="900" fill="url(#bg)"/>
    <circle cx="300" cy="350" r="280" fill="url(#glow)"/>
    <rect x="30" y="30" width="540" height="840" rx="12" fill="none" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="2"/>
    <text x="300" y="120" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="16" letter-spacing="6" font-weight="bold">OFFICIAL ARCHIVE</text>
    <circle cx="300" cy="320" r="110" fill="#181c28" stroke="#f59e0b" stroke-width="2"/>
    <path d="M 270 270 L 350 320 L 270 370 Z" fill="#f59e0b"/>
    <text x="300" y="520" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="bold">${safeTitle.toUpperCase()}</text>
    <text x="300" y="570" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="18">ORIGINAL THEATRICAL PRESENTATION</text>
    <rect x="220" y="620" width="160" height="38" rx="8" fill="#f59e0b"/>
    <text x="300" y="645" text-anchor="middle" fill="#000000" font-family="sans-serif" font-size="16" font-weight="bold">BUCKETPASS</text>
    <line x1="100" y1="740" x2="500" y2="740" stroke="#334155" stroke-width="1" stroke-dasharray="8"/>
    <text x="300" y="780" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="14">AUTHENTIC CINEMA STUB</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
