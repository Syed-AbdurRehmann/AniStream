import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/',
}

/**
 * Attempts to scrape streaming sources and extract direct stream URLs.
 * Falls back to embed URLs when direct extraction isn't possible.
 */
export async function scrapeStreamUrl({ type, id, season, episode, source }) {
  const results = []

  // Define which scrapers to run
  const scrapers = {
    vidsrcto: scrapeVidSrcTo,
    vidsrcicu: scrapeVidSrcIcu,
    autoembed: scrapeAutoEmbed,
    embedsu: scrapeEmbedSu,
    superembed: scrapeSuperEmbed,
  }

  if (source && scrapers[source]) {
    // Scrape a specific source
    const result = await scrapers[source]({ type, id, season, episode })
    results.push(result)
  } else {
    // Scrape all sources in parallel
    const promises = Object.entries(scrapers).map(async ([key, fn]) => {
      try {
        return await fn({ type, id, season, episode })
      } catch (err) {
        return { source: key, error: err.message, streams: [], embed: null }
      }
    })
    results.push(...await Promise.allSettled(promises).then(r => 
      r.map(p => p.status === 'fulfilled' ? p.value : { error: 'Failed' })
    ))
  }

  return {
    type,
    id,
    season,
    episode,
    results: results.filter(Boolean),
    timestamp: new Date().toISOString(),
  }
}

// ============== VidSrc.to Scraper ==============
async function scrapeVidSrcTo({ type, id, season, episode }) {
  const baseUrl = type === 'movie'
    ? `https://vidsrc.to/embed/movie/${id}`
    : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`

  try {
    const html = await fetchPage(baseUrl)
    const $ = cheerio.load(html)

    // Extract available servers from the page
    const servers = []
    $('[data-hash]').each((_, el) => {
      servers.push({
        name: $(el).text().trim(),
        hash: $(el).attr('data-hash'),
      })
    })

    // Try to extract source URLs from script tags
    const streams = extractStreamsFromHtml(html)

    return {
      source: 'vidsrcto',
      name: 'VidSrc.to',
      embed: baseUrl,
      servers,
      streams,
    }
  } catch (err) {
    return { source: 'vidsrcto', name: 'VidSrc.to', embed: baseUrl, streams: [], error: err.message }
  }
}

// ============== VidSrc.icu Scraper ==============
async function scrapeVidSrcIcu({ type, id, season, episode }) {
  const baseUrl = type === 'movie'
    ? `https://vidsrc.icu/embed/movie/${id}`
    : `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`

  try {
    const html = await fetchPage(baseUrl)
    const streams = extractStreamsFromHtml(html)

    return {
      source: 'vidsrcicu',
      name: 'VidSrc.icu',
      embed: baseUrl,
      streams,
    }
  } catch (err) {
    return { source: 'vidsrcicu', name: 'VidSrc.icu', embed: baseUrl, streams: [], error: err.message }
  }
}

// ============== AutoEmbed Scraper ==============
async function scrapeAutoEmbed({ type, id, season, episode }) {
  const baseUrl = type === 'movie'
    ? `https://player.autoembed.cc/embed/movie/${id}`
    : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`

  try {
    const html = await fetchPage(baseUrl)
    const $ = cheerio.load(html)

    // AutoEmbed typically has server buttons
    const servers = []
    $('button[data-server], .server-btn, [data-url]').each((_, el) => {
      servers.push({
        name: $(el).text().trim() || `Server ${servers.length + 1}`,
        url: $(el).attr('data-url') || $(el).attr('data-server'),
      })
    })

    const streams = extractStreamsFromHtml(html)

    return {
      source: 'autoembed',
      name: 'AutoEmbed',
      embed: baseUrl,
      servers,
      streams,
    }
  } catch (err) {
    return { source: 'autoembed', name: 'AutoEmbed', embed: baseUrl, streams: [], error: err.message }
  }
}

// ============== Embed.su Scraper ==============
async function scrapeEmbedSu({ type, id, season, episode }) {
  const baseUrl = type === 'movie'
    ? `https://embed.su/embed/movie/${id}`
    : `https://embed.su/embed/tv/${id}/${season}/${episode}`

  try {
    const html = await fetchPage(baseUrl)
    const streams = extractStreamsFromHtml(html)

    return {
      source: 'embedsu',
      name: 'Embed.su',
      embed: baseUrl,
      streams,
    }
  } catch (err) {
    return { source: 'embedsu', name: 'Embed.su', embed: baseUrl, streams: [], error: err.message }
  }
}

// ============== SuperEmbed / MultiEmbed Scraper ==============
async function scrapeSuperEmbed({ type, id, season, episode }) {
  const baseUrl = type === 'movie'
    ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
    : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`

  try {
    const html = await fetchPage(baseUrl)
    const $ = cheerio.load(html)

    // MultiEmbed has multiple source buttons
    const servers = []
    $('a[data-id], .dropdown-item, [data-embed]').each((_, el) => {
      const url = $(el).attr('data-embed') || $(el).attr('href') || ''
      if (url.startsWith('http')) {
        servers.push({
          name: $(el).text().trim() || `Server ${servers.length + 1}`,
          url,
        })
      }
    })

    const streams = extractStreamsFromHtml(html)

    return {
      source: 'superembed',
      name: 'SuperEmbed',
      embed: baseUrl,
      servers,
      streams,
    }
  } catch (err) {
    return { source: 'superembed', name: 'SuperEmbed', embed: baseUrl, streams: [], error: err.message }
  }
}

// ============== Helper Functions ==============

async function fetchPage(url, customHeaders = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000) // 15s timeout

  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, ...customHeaders },
      signal: controller.signal,
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extract stream URLs (m3u8, mp4, etc.) from HTML/JS content
 */
function extractStreamsFromHtml(html) {
  const streams = []

  // Look for m3u8 URLs
  const m3u8Pattern = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi
  const m3u8Matches = html.match(m3u8Pattern) || []
  m3u8Matches.forEach(url => {
    if (!streams.some(s => s.url === url)) {
      streams.push({ url, type: 'hls', quality: guessQuality(url) })
    }
  })

  // Look for mp4 URLs
  const mp4Pattern = /https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi
  const mp4Matches = html.match(mp4Pattern) || []
  mp4Matches.forEach(url => {
    if (!streams.some(s => s.url === url) && !url.includes('poster') && !url.includes('thumb')) {
      streams.push({ url, type: 'mp4', quality: guessQuality(url) })
    }
  })

  // Look for sources in JSON config objects
  const jsonPattern = /(?:sources|file|src)\s*[:=]\s*["'](https?:\/\/[^"']+)/gi
  let match
  while ((match = jsonPattern.exec(html)) !== null) {
    const url = match[1]
    if (url.includes('.m3u8') || url.includes('.mp4')) {
      if (!streams.some(s => s.url === url)) {
        streams.push({ url, type: url.includes('.m3u8') ? 'hls' : 'mp4', quality: guessQuality(url) })
      }
    }
  }

  // Look for encoded/base64 sources
  const b64Pattern = /atob\(["']([A-Za-z0-9+/=]+)["']\)/gi
  while ((match = b64Pattern.exec(html)) !== null) {
    try {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
      if (decoded.startsWith('http') && (decoded.includes('.m3u8') || decoded.includes('.mp4'))) {
        streams.push({ url: decoded, type: decoded.includes('.m3u8') ? 'hls' : 'mp4', quality: guessQuality(decoded) })
      }
    } catch {}
  }

  return streams
}

function guessQuality(url) {
  if (/2160|4k|uhd/i.test(url)) return '4K'
  if (/1080/i.test(url)) return '1080p'
  if (/720/i.test(url)) return '720p'
  if (/480/i.test(url)) return '480p'
  if (/360/i.test(url)) return '360p'
  return 'Auto'
}
