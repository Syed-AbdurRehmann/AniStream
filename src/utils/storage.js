// Local storage helpers for watch history, watchlist, etc.
// When user is authenticated, these also sync to the server.

import { addServerHistory, addServerWatchlist, removeServerWatchlist, removeServerHistory, clearServerHistory, updateServerPreferences } from '../api/auth'

const STORAGE_KEYS = {
  HISTORY: 'cineweb_history',
  WATCHLIST: 'cineweb_watchlist',
  PREFERENCES: 'cineweb_prefs',
};

function isLoggedIn() {
  return !!localStorage.getItem('cineweb_token')
}

// Background sync helper - fire and forget, don't block UI
function syncAsync(fn) {
  fn().catch(err => console.warn('[Sync]', err.error || err.message || err))
}

// ==================== WATCH HISTORY ====================
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
  } catch { return []; }
}

export function addToHistory(item) {
  const history = getHistory();
  const filtered = history.filter(h => !(h.id === item.id && h.type === item.type));
  filtered.unshift({
    id: item.id,
    type: item.type,
    title: item.title,
    poster: item.poster,
    rating: item.rating,
    year: item.year,
    episode: item.episode || null,
    season: item.season || null,
    timestamp: Date.now(),
  });
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered.slice(0, 100)));
  // Sync to server
  if (isLoggedIn()) {
    syncAsync(() => addServerHistory({
      tmdbId: item.id,
      mediaType: item.type,
      title: item.title,
      poster: item.poster,
      season: item.season || null,
      episode: item.episode || null,
    }))
  }
}

export function clearHistory() {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  if (isLoggedIn()) syncAsync(() => clearServerHistory())
}

export function removeFromHistory(id, type) {
  const history = getHistory();
  const filtered = history.filter(h => !(h.id === id && h.type === type));
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
  if (isLoggedIn()) syncAsync(() => removeServerHistory(type, id))
}

// ==================== WATCHLIST ====================
export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHLIST)) || {
      watching: [],
      toWatch: [],
      watched: [],
    };
  } catch {
    return { watching: [], toWatch: [], watched: [] };
  }
}

export function addToWatchlist(category, item) {
  const wl = getWatchlist();
  ['watching', 'toWatch', 'watched'].forEach(cat => {
    wl[cat] = wl[cat].filter(i => !(i.id === item.id && i.type === item.type));
  });
  wl[category].unshift({
    id: item.id,
    type: item.type,
    title: item.title,
    poster: item.poster,
    rating: item.rating,
    year: item.year,
    addedAt: Date.now(),
  });
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(wl));
  if (isLoggedIn()) {
    syncAsync(() => addServerWatchlist({
      tmdbId: item.id,
      mediaType: item.type,
      title: item.title,
      poster: item.poster,
      category,
    }))
  }
}

export function removeFromWatchlist(id, type) {
  const wl = getWatchlist();
  ['watching', 'toWatch', 'watched'].forEach(cat => {
    wl[cat] = wl[cat].filter(i => !(i.id === id && i.type === type));
  });
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(wl));
  if (isLoggedIn()) syncAsync(() => removeServerWatchlist(type, id))
}

export function getWatchlistStatus(id, type) {
  const wl = getWatchlist();
  for (const cat of ['watching', 'toWatch', 'watched']) {
    if (wl[cat].some(i => i.id === id && i.type === type)) return cat;
  }
  return null;
}

// ==================== PREFERENCES ====================
export function getPreferences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES)) || {
      autoPlay: true,
      preferredSource: 'vidsrccc',
      volume: 1,
    };
  } catch {
    return { autoPlay: true, preferredSource: 'vidsrccc', volume: 1 };
  }
}

export function setPreference(key, value) {
  const prefs = getPreferences();
  prefs[key] = value;
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  if (isLoggedIn()) {
    const serverKey = key === 'autoPlay' ? 'auto_play' : key === 'preferredSource' ? 'preferred_source' : key
    syncAsync(() => updateServerPreferences({ [serverKey]: value }))
  }
}
