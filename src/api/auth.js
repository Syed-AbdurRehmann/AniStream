// Auth API - communicates with CineWeb backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('cineweb_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

// ==================== AUTH ====================
export async function register(username, email, password) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
  localStorage.setItem('cineweb_token', data.token)
  return data
}

export async function login(username, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: username, password }),
  })
  localStorage.setItem('cineweb_token', data.token)
  return data
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } catch (e) { /* ignore */ }
  localStorage.removeItem('cineweb_token')
}

export async function getMe() {
  return apiRequest('/auth/me')
}

export async function updateProfile(data) {
  return apiRequest('/auth/me', { method: 'PUT', body: JSON.stringify(data) })
}

export async function changePassword(currentPassword, newPassword) {
  return apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function deleteAccount() {
  await apiRequest('/auth/me', { method: 'DELETE' })
  localStorage.removeItem('cineweb_token')
}

export async function googleAuth(credential) {
  const data = await apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
  localStorage.setItem('cineweb_token', data.token)
  return data
}

// ==================== WATCHLIST ====================
export async function getServerWatchlist() {
  return apiRequest('/user/watchlist')
}

export async function addServerWatchlist(item) {
  return apiRequest('/user/watchlist', { method: 'POST', body: JSON.stringify(item) })
}

export async function removeServerWatchlist(mediaType, tmdbId) {
  return apiRequest(`/user/watchlist/${mediaType}/${tmdbId}`, { method: 'DELETE' })
}

export async function getServerWatchlistStatus(mediaType, tmdbId) {
  return apiRequest(`/user/watchlist/status/${mediaType}/${tmdbId}`)
}

// ==================== HISTORY ====================
export async function getServerHistory(limit = 50, offset = 0) {
  return apiRequest(`/user/history?limit=${limit}&offset=${offset}`)
}

export async function addServerHistory(item) {
  return apiRequest('/user/history', { method: 'POST', body: JSON.stringify(item) })
}

export async function removeServerHistory(mediaType, tmdbId) {
  return apiRequest(`/user/history/${mediaType}/${tmdbId}`, { method: 'DELETE' })
}

export async function clearServerHistory() {
  return apiRequest('/user/history', { method: 'DELETE' })
}

// ==================== PREFERENCES ====================
export async function getServerPreferences() {
  return apiRequest('/user/preferences')
}

export async function updateServerPreferences(prefs) {
  return apiRequest('/user/preferences', { method: 'PUT', body: JSON.stringify(prefs) })
}

export { apiRequest }
