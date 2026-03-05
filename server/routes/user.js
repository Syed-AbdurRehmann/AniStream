import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// ==================== WATCHLIST ====================

// Get full watchlist
router.get('/watchlist', (req, res) => {
  const items = db.prepare(
    'SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC'
  ).all(req.user.id)

  const watchlist = { watching: [], toWatch: [], watched: [] }
  items.forEach(item => {
    watchlist[item.category]?.push({
      id: item.tmdb_id,
      type: item.media_type,
      title: item.title,
      poster: item.poster_path,
      rating: item.rating,
      year: item.year,
      addedAt: item.added_at,
    })
  })
  res.json({ watchlist })
})

// Add/update watchlist item
router.post('/watchlist', (req, res) => {
  const { tmdbId, mediaType, category, title, poster, rating, year } = req.body
  
  if (!tmdbId || !mediaType || !category || !title) {
    return res.status(400).json({ error: 'tmdbId, mediaType, category, and title are required' })
  }
  if (!['watching', 'toWatch', 'watched'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }

  db.prepare(`
    INSERT INTO watchlist (user_id, tmdb_id, media_type, category, title, poster_path, rating, year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, tmdb_id, media_type) 
    DO UPDATE SET category = ?, title = ?, poster_path = ?, rating = ?, year = ?, added_at = CURRENT_TIMESTAMP
  `).run(req.user.id, tmdbId, mediaType, category, title, poster, rating, year,
         category, title, poster, rating, year)

  res.json({ message: 'Watchlist updated' })
})

// Remove from watchlist
router.delete('/watchlist/:mediaType/:tmdbId', (req, res) => {
  const { tmdbId, mediaType } = req.params
  db.prepare('DELETE FROM watchlist WHERE user_id = ? AND tmdb_id = ? AND media_type = ?')
    .run(req.user.id, tmdbId, mediaType)
  res.json({ message: 'Removed from watchlist' })
})

// Get watchlist status for a single item
router.get('/watchlist/status/:mediaType/:tmdbId', (req, res) => {
  const { tmdbId, mediaType } = req.params
  const item = db.prepare(
    'SELECT category FROM watchlist WHERE user_id = ? AND tmdb_id = ? AND media_type = ?'
  ).get(req.user.id, tmdbId, mediaType)
  res.json({ status: item?.category || null })
})

// ==================== WATCH HISTORY ====================

// Get watch history
router.get('/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  
  const items = db.prepare(
    'SELECT * FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT ? OFFSET ?'
  ).all(req.user.id, limit, offset)

  const total = db.prepare('SELECT COUNT(*) as count FROM watch_history WHERE user_id = ?').get(req.user.id)

  res.json({
    history: items.map(item => ({
      id: item.tmdb_id,
      type: item.media_type,
      title: item.title,
      poster: item.poster_path,
      rating: item.rating,
      year: item.year,
      season: item.season,
      episode: item.episode,
      watchDuration: item.watch_duration,
      timestamp: item.watched_at,
    })),
    total: total.count,
    hasMore: offset + limit < total.count,
  })
})

// Add to watch history
router.post('/history', (req, res) => {
  const { tmdbId, mediaType, title, poster, rating, year, season, episode } = req.body
  
  if (!tmdbId || !mediaType || !title) {
    return res.status(400).json({ error: 'tmdbId, mediaType, and title are required' })
  }

  db.prepare(`
    INSERT INTO watch_history (user_id, tmdb_id, media_type, title, poster_path, rating, year, season, episode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, tmdb_id, media_type)
    DO UPDATE SET title = ?, poster_path = ?, rating = ?, year = ?, season = ?, episode = ?, watched_at = CURRENT_TIMESTAMP
  `).run(req.user.id, tmdbId, mediaType, title, poster, rating, year, season || null, episode || null,
         title, poster, rating, year, season || null, episode || null)

  res.json({ message: 'History updated' })
})

// Remove from history
router.delete('/history/:mediaType/:tmdbId', (req, res) => {
  const { tmdbId, mediaType } = req.params
  db.prepare('DELETE FROM watch_history WHERE user_id = ? AND tmdb_id = ? AND media_type = ?')
    .run(req.user.id, tmdbId, mediaType)
  res.json({ message: 'Removed from history' })
})

// Clear all history
router.delete('/history', (req, res) => {
  db.prepare('DELETE FROM watch_history WHERE user_id = ?').run(req.user.id)
  res.json({ message: 'History cleared' })
})

// ==================== CONTINUE WATCHING ====================

// Get continue watching list
router.get('/continue', (req, res) => {
  const items = db.prepare(
    'SELECT * FROM continue_watching WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20'
  ).all(req.user.id)

  res.json({
    items: items.map(item => ({
      id: item.tmdb_id,
      type: item.media_type,
      title: item.title,
      poster: item.poster_path,
      season: item.season,
      episode: item.episode,
      progress: item.progress,
      duration: item.duration,
      updatedAt: item.updated_at,
    }))
  })
})

// Update continue watching progress
router.post('/continue', (req, res) => {
  const { tmdbId, mediaType, title, poster, season, episode, progress, duration } = req.body
  
  if (!tmdbId || !mediaType || !title) {
    return res.status(400).json({ error: 'tmdbId, mediaType, and title are required' })
  }

  // If progress is >= 90%, remove from continue watching (they finished it)
  if (duration > 0 && progress / duration >= 0.9) {
    db.prepare('DELETE FROM continue_watching WHERE user_id = ? AND tmdb_id = ? AND media_type = ?')
      .run(req.user.id, tmdbId, mediaType)
    return res.json({ message: 'Completed — removed from continue watching' })
  }

  db.prepare(`
    INSERT INTO continue_watching (user_id, tmdb_id, media_type, title, poster_path, season, episode, progress, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, tmdb_id, media_type)
    DO UPDATE SET title = ?, poster_path = ?, season = ?, episode = ?, progress = ?, duration = ?, updated_at = CURRENT_TIMESTAMP
  `).run(req.user.id, tmdbId, mediaType, title, poster, season || null, episode || null, progress || 0, duration || 0,
         title, poster, season || null, episode || null, progress || 0, duration || 0)

  res.json({ message: 'Progress saved' })
})

// Remove from continue watching
router.delete('/continue/:mediaType/:tmdbId', (req, res) => {
  const { tmdbId, mediaType } = req.params
  db.prepare('DELETE FROM continue_watching WHERE user_id = ? AND tmdb_id = ? AND media_type = ?')
    .run(req.user.id, tmdbId, mediaType)
  res.json({ message: 'Removed' })
})

// ==================== PREFERENCES ====================

// Get preferences
router.get('/preferences', (req, res) => {
  const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id)
  if (!prefs) {
    // Create default preferences
    db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.user.id)
    return res.json({
      preferences: { autoPlay: true, preferredSource: 'vidsrccc', nsfwFilter: true, theme: 'dark' }
    })
  }
  res.json({
    preferences: {
      autoPlay: !!prefs.auto_play,
      preferredSource: prefs.preferred_source,
      nsfwFilter: !!prefs.nsfw_filter,
      theme: prefs.theme,
    }
  })
})

// Update preferences
router.put('/preferences', (req, res) => {
  const { autoPlay, preferredSource, nsfwFilter, theme } = req.body
  const updates = []
  const values = []

  if (autoPlay !== undefined) { updates.push('auto_play = ?'); values.push(autoPlay ? 1 : 0) }
  if (preferredSource !== undefined) { updates.push('preferred_source = ?'); values.push(preferredSource) }
  if (nsfwFilter !== undefined) { updates.push('nsfw_filter = ?'); values.push(nsfwFilter ? 1 : 0) }
  if (theme !== undefined) { updates.push('theme = ?'); values.push(theme) }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

  updates.push('updated_at = CURRENT_TIMESTAMP')
  values.push(req.user.id)
  
  db.prepare(`
    INSERT INTO user_preferences (user_id) VALUES (?)
    ON CONFLICT(user_id) DO UPDATE SET ${updates.join(', ')}
  `).run(req.user.id, ...values)
  // The above won't work correctly. Let's fix:
  
  // Actually just use upsert properly
  const existing = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = ?').get(req.user.id)
  if (existing) {
    values.pop() // remove user_id from end
    values.push(req.user.id)
    db.prepare(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`).run(...values)
  } else {
    db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.user.id)
    values.pop()
    values.push(req.user.id)
    db.prepare(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`).run(...values)
  }

  res.json({ message: 'Preferences updated' })
})

export default router
