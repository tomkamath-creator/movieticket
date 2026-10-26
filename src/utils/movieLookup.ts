import type { MovieSearchResult } from '../types';

/**
 * Searches movie details using free Wikipedia Search & REST API + iTunes Search API.
 * Accurately finds theatrical films, upcoming releases, and anime movies.
 */
export async function lookupMovie(rawTitle: string): Promise<MovieSearchResult[]> {
  const cleanTitle = cleanSearchQuery(rawTitle);
  if (!cleanTitle || cleanTitle.length < 2) {
    return [];
  }

  const results: MovieSearchResult[] = [];
  const seenTitles = new Set<string>();

  // 1. Primary Source: Wikipedia Search + Summary REST API
  // Finds upcoming theatrical releases, international movies, and anime films accurately
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(
      cleanTitle + ' film'
    )}&srlimit=3`;
    const searchRes = await fetch(searchUrl);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const hits = searchData.query?.search || [];

      for (const hit of hits) {
        try {
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
          const summaryRes = await fetch(summaryUrl);
          if (summaryRes.ok) {
            const page = await summaryRes.json();
            if (page.type !== 'disambiguation') {
              const displayTitle = page.title.replace(/\s*\([^)]*film[^)]*\)/gi, '').replace(/\s*\([^)]*\)/g, '').trim();

              if (!seenTitles.has(displayTitle.toLowerCase())) {
                seenTitles.add(displayTitle.toLowerCase());

                const poster =
                  page.originalimage?.source ||
                  page.thumbnail?.source ||
                  '';

                const year = extractYear(page.description || page.extract);
                const director = extractDirector(page.extract);

                results.push({
                  title: displayTitle,
                  year: year || new Date().getFullYear().toString(),
                  releaseDate: '',
                  director: director || '',
                  genres: ['Feature Film'],
                  runtime: '120 min',
                  synopsis: page.extract || '',
                  posterUrl: poster || generateFallbackPosterSvg(displayTitle),
                  backdropUrl: poster || '',
                });
              }
            }
          }
        } catch {
          // ignore single page fetch error
        }
      }
    }
  } catch (err) {
    console.warn('Wikipedia search warning:', err);
  }

  // 2. Secondary Source: iTunes Search API
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&media=movie&entity=movie&limit=3`;
    const itunesRes = await fetch(itunesUrl);
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (itunesData.results && itunesData.results.length > 0) {
        for (const item of itunesData.results) {
          const itemTitle = item.trackName;
          if (itemTitle && !seenTitles.has(itemTitle.toLowerCase())) {
            seenTitles.add(itemTitle.toLowerCase());

            const highResPoster = item.artworkUrl100
              ? item.artworkUrl100.replace('100x100bb', '1200x1200bb')
              : '';

            let runtimeStr = '';
            if (item.trackTimeMillis) {
              const minutes = Math.round(item.trackTimeMillis / 60000);
              const hours = Math.floor(minutes / 60);
              const remainingMins = minutes % 60;
              runtimeStr = hours > 0 ? `${hours}h ${remainingMins}m` : `${minutes} min`;
            }

            const releaseDate = item.releaseDate ? item.releaseDate.split('T')[0] : '';
            const year = releaseDate ? releaseDate.split('-')[0] : '';

            results.push({
              title: itemTitle,
              year,
              releaseDate,
              director: item.artistName || '',
              genres: item.primaryGenreName ? [item.primaryGenreName] : ['Feature Film'],
              runtime: runtimeStr,
              synopsis: item.longDescription || item.shortDescription || '',
              posterUrl: highResPoster,
              backdropUrl: highResPoster,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('iTunes API search warning:', err);
  }

  // If no results, return clean synthesized card
  if (results.length === 0) {
    results.push({
      title: cleanTitle,
      year: new Date().getFullYear().toString(),
      releaseDate: '',
      director: '',
      genres: ['Cinema'],
      runtime: '120 min',
      synopsis: '',
      posterUrl: generateFallbackPosterSvg(cleanTitle),
      backdropUrl: '',
    });
  }

  return results;
}

function cleanSearchQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s*\([^)]*\)/g, ' ')
    .replace(/[^\w\s:’'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYear(text?: string): string {
  if (!text) return '';
  const match = text.match(/\b(202\d|201\d|19\d{2})\b/);
  return match ? match[1] : '';
}

function extractDirector(text?: string): string {
  if (!text) return '';
  const match = text.match(/(?:directed by|director)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i);
  return match ? match[1] : '';
}

export function generateFallbackPosterSvg(title: string): string {
  const safeTitle = (title || 'CINEMA').slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#121520"/>
        <stop offset="50%" stop-color="#181c2b"/>
        <stop offset="100%" stop-color="#0a0c12"/>
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#g)"/>
    <rect x="25" y="25" width="550" height="850" rx="16" fill="none" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5"/>
    <circle cx="300" cy="380" r="100" fill="#1e2336" stroke="#f59e0b" stroke-width="1.5"/>
    <polygon points="280,340 340,380 280,420" fill="#f59e0b"/>
    <text x="300" y="550" text-anchor="middle" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="32" font-weight="800" letter-spacing="1">${safeTitle.toUpperCase()}</text>
    <text x="300" y="590" text-anchor="middle" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="4">THEATRICAL PRESENTATION</text>
    <rect x="230" y="640" width="140" height="32" rx="16" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1"/>
    <text x="300" y="661" text-anchor="middle" fill="#f59e0b" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="2">BUCKETPASS</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
