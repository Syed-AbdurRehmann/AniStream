import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimitPkg from 'express-rate-limit'
import db from './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import { scrapeStreamUrl } from './scrapers/index.js'

const rateLimit = rateLimitPkg
const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// ==================== SECURITY ====================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: isProduction ? (process.env.FRONTEND_URL || 'https://cineweb.app') : '*',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } })
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 50, message: { error: 'Too many auth attempts. Try again in 15 minutes.' } })
app.use('/api', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

// Health check
app.get('/api/health', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  res.json({
    status: 'ok',
    version: '2.0.0',
    database: 'connected',
    users: userCount.count,
    uptime: Math.floor(process.uptime()),
    sources: ['vidsrccc', 'vidlink', 'vidsrcto', 'vidsrcicu', 'autoembed', 'superembed', 'embedsu'],
  })
})

// Stats (public)
app.get('/api/stats', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get()
  const watchlistItems = db.prepare('SELECT COUNT(*) as count FROM watchlist').get()
  const historyItems = db.prepare('SELECT COUNT(*) as count FROM watch_history').get()
  res.json({ users: users.count, watchlistItems: watchlistItems.count, historyEntries: historyItems.count })
})

// ==================== SCRAPER ENDPOINTS ====================
const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000
function getCached(key) { const e = cache.get(key); if (!e) return null; if (Date.now() - e.ts > CACHE_TTL) { cache.delete(key); return null; } return e.data; }
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); if (cache.size > 1000) { const o = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]; cache.delete(o[0]); } }

app.get('/api/scrape/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
    const { source, s, e } = req.query
    if (!['movie', 'tv'].includes(type)) return res.status(400).json({ error: 'Type must be "movie" or "tv"' })

    const cacheKey = `${source || 'all'}-${type}-${id}-${s || 0}-${e || 0}`
    const cached = getCached(cacheKey)
    if (cached) return res.json({ ...cached, cached: true })

    const result = await scrapeStreamUrl({ type, id, season: s ? Number(s) : null, episode: e ? Number(e) : null, source: source || null })
    setCache(cacheKey, result)
    res.json(result)
  } catch (err) {
    console.error('[Scraper Error]', err.message)
    res.status(500).json({ error: 'Failed to scrape source', message: err.message })
  }
})

app.get('/api/sources/:type/:id', (req, res) => {
  const { type, id } = req.params
  const { s, e } = req.query
  const sources = getEmbedSources(type, id, s ? Number(s) : null, e ? Number(e) : null)
  res.json({ sources })
})

function getEmbedSources(type, id, season, episode) {
  const providers = {
    vidsrccc: { name: 'VidSrc.cc', quality: 'Best', movie: `https://vidsrc.cc/v2/embed/movie/${id}`, tv: `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
    vidlink: { name: 'VidLink', quality: 'HD', movie: `https://vidlink.pro/movie/${id}`, tv: `https://vidlink.pro/tv/${id}/${season}/${episode}` },
    vidsrcto: { name: 'VidSrc.to', quality: 'HD', movie: `https://vidsrc.to/embed/movie/${id}`, tv: `https://vidsrc.to/embed/tv/${id}/${season}/${episode}` },
    vidsrcicu: { name: 'VidSrc.icu', quality: 'HD', movie: `https://vidsrc.icu/embed/movie/${id}`, tv: `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}` },
    autoembed: { name: 'AutoEmbed', quality: 'HD', movie: `https://player.autoembed.cc/embed/movie/${id}`, tv: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
    superembed: { name: 'SuperEmbed', quality: 'HD', movie: `https://multiembed.mov/?video_id=${id}&tmdb=1`, tv: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    embedsu: { name: 'Embed.su', quality: 'HD', movie: `https://embed.su/embed/movie/${id}`, tv: `https://embed.su/embed/tv/${id}/${season}/${episode}` },
  }
  return Object.entries(providers).map(([key, val]) => ({ key, name: val.name, quality: val.quality, url: type === 'movie' ? val.movie : val.tv }))
}

// ==================== CLEANUP ====================
setInterval(() => {
  const deleted = db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run()
  if (deleted.changes > 0) console.log(`[Cleanup] Removed ${deleted.changes} expired sessions`)
}, 60 * 60 * 1000)

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🎬 CineWeb API Server v2.0.0`)
  console.log(`   Port: ${PORT}`)
  console.log(`   Database: ${process.env.DB_PATH || './data/cineweb.db'}`)
  console.log(`   Environment: ${isProduction ? 'production' : 'development'}`)
  console.log(`   Ready!\n`)
})
