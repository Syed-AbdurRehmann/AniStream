const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:3001'

/**
 * Fetch all available streaming sources for a given media item
 */
export async function getStreamSources(type, id, season = null, episode = null) {
  try {
    const params = new URLSearchParams()
    if (season) params.set('s', season)
    if (episode) params.set('e', episode)

    const url = `${SCRAPER_BASE}/api/sources/${type}/${id}?${params}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.sources || []
  } catch (err) {
    console.warn('[Scraper] Sources API unavailable:', err.message)
    return []
  }
}

/**
 * Attempt to scrape direct stream URLs from a specific source
 */
export async function scrapeStream(type, id, source, season = null, episode = null) {
  try {
    const params = new URLSearchParams({ source })
    if (season) params.set('s', season)
    if (episode) params.set('e', episode)

    const url = `${SCRAPER_BASE}/api/scrape/${type}/${id}?${params}`
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('[Scraper] Scrape API unavailable:', err.message)
    return null
  }
}

/**
 * Check if the scraper server is running
 */
export async function checkScraperHealth() {
  try {
    const res = await fetch(`${SCRAPER_BASE}/api/health`, { signal: AbortSignal.timeout(3_000) })
    if (!res.ok) return false
    const data = await res.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
