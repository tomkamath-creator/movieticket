export type MovieFormat =
  | 'IMAX'
  | 'IMAX 3D'
  | 'Dolby Cinema'
  | 'Dolby Atmos'
  | '4DX'
  | '3D'
  | 'ScreenX'
  | '2D'
  | 'Standard';

export interface Ticket {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Movie Information
  title: string;
  year?: string;
  releaseDate?: string;
  director?: string;
  genres: string[];
  runtime?: string;
  synopsis?: string;
  posterUrl: string;
  backdropUrl?: string;

  // Cinema & Showtime Information
  cinema: string;
  dateWatched: string;
  timeWatched?: string;
  format: MovieFormat;
  hallOrScreen?: string;
  seats: string;
  bookingId?: string;
  ticketPrice?: string;

  // Cinema Diary & Review
  rating: number; // 0 to 5 (steps of 0.5)
  review: string;
  companions?: string;
  favoriteQuote?: string;

  // Screenshot Artifact
  screenshotDataUrl: string;
  screenshotFileName?: string;
}

export type ViewMode = 'deck' | 'grid' | 'list';

export interface FilterOptions {
  searchQuery: string;
  format: string; // 'all' or specific format
  minRating: number; // 0 for all
  year: string; // 'all' or year
  sortBy: 'date-desc' | 'date-asc' | 'rating-desc' | 'title-asc';
}

export interface ExtractedTicketData {
  title?: string;
  cinema?: string;
  dateWatched?: string;
  timeWatched?: string;
  format?: MovieFormat;
  seats?: string;
  hallOrScreen?: string;
  bookingId?: string;
  ticketPrice?: string;
  rawOcrText?: string;
}

export interface MovieSearchResult {
  title: string;
  year?: string;
  releaseDate?: string;
  director?: string;
  genres: string[];
  runtime?: string;
  synopsis?: string;
  posterUrl: string;
  backdropUrl?: string;
}
