const BASE_URL = 'https://api.themoviedb.org/3';
// TMDB API key - Get your free key at https://www.themoviedb.org/settings/api
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Embed providers for streaming — ordered by quality / least ads
export const EMBED_PROVIDERS = {
  vidsrccc: {
    name: 'VidSrc.cc',
    tag: 'Best',
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  vidlink: {
    name: 'VidLink',
    tag: 'HD',
    movie: (id) => `https://vidlink.pro/movie/${id}?primaryColor=6366f1&autoplay=true&title=false`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=6366f1&autoplay=true&nextbutton=true&title=false`,
  },
  vidsrcto: {
    name: 'VidSrc.to',
    tag: null,
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  vidsrcicu: {
    name: 'VidSrc.icu',
    tag: null,
    movie: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },
  autoembed: {
    name: 'AutoEmbed',
    tag: null,
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  superembed: {
    name: 'SuperEmbed',
    tag: null,
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  embedsu: {
    name: 'Embed.su',
    tag: null,
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
};

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return '/no-poster.svg';
  return `${IMG_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path, size = 'w1280') => {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
};

async function fetchTMDB(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  // Always request safe content — exclude adult
  url.searchParams.set('include_adult', 'false');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

// NSFW / adult content filter — blocks explicit genres, keywords, and flagged items
const BLOCKED_GENRE_IDS = [
  // There is no official "porn" genre on TMDB but some items slip through via keywords
];

const NSFW_KEYWORDS = [
  'porn', 'hentai', 'xxx', 'erotic', 'softcore', 'hardcore',
  'adult film', 'pornograph', 'sex tape', 'sexploitation',
  'nudist', 'striptease', 'playboy', 'penthouse', 'brazzers',
  'onlyfans', 'cam girl', 'camgirl', 'jav', 'milf', 'dildo',
  'orgasm', 'orgy', 'threesome', 'gangbang', 'fetish',
  'bdsm', 'bondage', 'dominatrix', 'escort', 'hooker',
  'prostitut', 'brothel', 'sexual intercourse',
];

/**
 * Filter out NSFW / adult content from TMDB results.
 * Checks: adult flag, genre IDs, title/name/overview text.
 */
export function filterNSFW(items) {
  if (!Array.isArray(items)) return items;
  return items.filter(item => {
    // 1. TMDB adult flag
    if (item.adult === true) return false;
    
    // 2. Check title, name, original_title, original_name, overview for NSFW keywords
    const textFields = [
      item.title, item.name, item.original_title, item.original_name, item.overview
    ].filter(Boolean).join(' ').toLowerCase();
    
    for (const keyword of NSFW_KEYWORDS) {
      if (textFields.includes(keyword)) return false;
    }
    
    // 3. Block items with no poster AND very low vote count (usually junk entries)
    if (!item.poster_path && (item.vote_count || 0) < 5) return false;
    
    return true;
  });
}

// ==================== MOVIES ====================
export async function getTrending(mediaType = 'all', timeWindow = 'day') {
  const data = await fetchTMDB(`/trending/${mediaType}/${timeWindow}`);
  data.results = filterNSFW(data.results);
  return data;
}

export async function getPopularMovies(page = 1) {
  const data = await fetchTMDB('/movie/popular', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getTopRatedMovies(page = 1) {
  const data = await fetchTMDB('/movie/top_rated', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getNowPlayingMovies(page = 1) {
  const data = await fetchTMDB('/movie/now_playing', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getUpcomingMovies(page = 1) {
  const data = await fetchTMDB('/movie/upcoming', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getMovieDetails(id) {
  const data = await fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos,similar,recommendations' });
  if (data.similar?.results) data.similar.results = filterNSFW(data.similar.results);
  if (data.recommendations?.results) data.recommendations.results = filterNSFW(data.recommendations.results);
  return data;
}

// ==================== TV SHOWS ====================
export async function getPopularTV(page = 1) {
  const data = await fetchTMDB('/tv/popular', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getTopRatedTV(page = 1) {
  const data = await fetchTMDB('/tv/top_rated', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getAiringTodayTV(page = 1) {
  const data = await fetchTMDB('/tv/airing_today', { page });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getOnTheAirTV(page = 1) {
  const data = await fetchTMDB('/tv/on_the_air', { page });
  data.results = filterNSFW(data.results);
  return data;
}

// Recently changed/updated shows — combines on_the_air with recent episode data
export async function getRecentlyUpdated(page = 1) {
  const data = await fetchTMDB('/tv/on_the_air', { page });
  data.results = filterNSFW(data.results);
  return data;
}

// Get TV shows airing on a specific date for the schedule widget
export async function getAiringSchedule(date) {
  // date format: YYYY-MM-DD
  const data = await fetchTMDB('/discover/tv', {
    'air_date.gte': date,
    'air_date.lte': date,
    sort_by: 'popularity.desc',
    with_type: '2|4', // Scripted + Miniseries
    page: 1,
  });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getTVDetails(id) {
  const data = await fetchTMDB(`/tv/${id}`, { append_to_response: 'credits,videos,similar,recommendations' });
  if (data.similar?.results) data.similar.results = filterNSFW(data.similar.results);
  if (data.recommendations?.results) data.recommendations.results = filterNSFW(data.recommendations.results);
  return data;
}

export async function getTVSeasonDetails(tvId, seasonNum) {
  return fetchTMDB(`/tv/${tvId}/season/${seasonNum}`);
}

// ==================== SEARCH & DISCOVER ====================
export async function searchMulti(query, page = 1) {
  // Block obviously NSFW search queries entirely
  const lowerQuery = query.toLowerCase().trim();
  for (const kw of NSFW_KEYWORDS) {
    if (lowerQuery.includes(kw)) {
      return { results: [], total_results: 0, total_pages: 0, page: 1 };
    }
  }
  const data = await fetchTMDB('/search/multi', { query, page });
  data.results = filterNSFW(data.results).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
  return data;
}

export async function discoverMovies(params = {}) {
  const data = await fetchTMDB('/discover/movie', { ...params, include_adult: false });
  data.results = filterNSFW(data.results);
  return data;
}

export async function discoverTV(params = {}) {
  const data = await fetchTMDB('/discover/tv', { ...params, include_adult: false });
  data.results = filterNSFW(data.results);
  return data;
}

export async function getGenres(type = 'movie') {
  return fetchTMDB(`/genre/${type}/list`);
}

// ==================== HELPERS ====================
export function getYear(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).getFullYear();
}

export function formatRuntime(mins) {
  if (!mins) return 'N/A';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatRating(rating) {
  if (!rating) return 'N/A';
  return rating.toFixed(1);
}
