import { Router } from 'express'
import db from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// ==================== GET COMMENTS (public) ====================
router.get('/:mediaType/:tmdbId', optionalAuth, (req, res) => {
  const { mediaType, tmdbId } = req.params
  const { season, episode, page = 1, limit = 50 } = req.query

  if (!['movie', 'tv'].includes(mediaType)) {
    return res.status(400).json({ error: 'Invalid media type' })
  }

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = `
    SELECT c.*, u.username, u.avatar
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.tmdb_id = ? AND c.media_type = ? AND c.parent_id IS NULL
  `
  const params = [parseInt(tmdbId), mediaType]

  if (season) {
    query += ' AND c.season = ?'
    params.push(parseInt(season))
  }
  if (episode) {
    query += ' AND c.episode = ?'
    params.push(parseInt(episode))
  }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const comments = db.prepare(query).all(...params)

  // Get replies for each comment
  const commentsWithReplies = comments.map(comment => {
    const replies = db.prepare(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.parent_id = ?
      ORDER BY c.created_at ASC
    `).all(comment.id)

    return {
      id: comment.id,
      content: comment.content,
      username: comment.username,
      avatar: comment.avatar,
      userId: comment.user_id,
      isOwner: req.user?.id === comment.user_id,
      createdAt: comment.created_at,
      replies: replies.map(r => ({
        id: r.id,
        content: r.content,
        username: r.username,
        avatar: r.avatar,
        userId: r.user_id,
        isOwner: req.user?.id === r.user_id,
        createdAt: r.created_at,
      })),
    }
  })

  // Get total count
  let countQuery = `
    SELECT COUNT(*) as total FROM comments
    WHERE tmdb_id = ? AND media_type = ? AND parent_id IS NULL
  `
  const countParams = [parseInt(tmdbId), mediaType]
  if (season) { countQuery += ' AND season = ?'; countParams.push(parseInt(season)) }
  if (episode) { countQuery += ' AND episode = ?'; countParams.push(parseInt(episode)) }
  const { total } = db.prepare(countQuery).get(...countParams)

  res.json({ comments: commentsWithReplies, total, page: parseInt(page), limit: parseInt(limit) })
})

// ==================== ADD COMMENT (auth required) ====================
router.post('/:mediaType/:tmdbId', requireAuth, (req, res) => {
  const { mediaType, tmdbId } = req.params
  const { content, season, episode, parentId } = req.body

  if (!['movie', 'tv'].includes(mediaType)) {
    return res.status(400).json({ error: 'Invalid media type' })
  }
  if (!content?.trim()) {
    return res.status(400).json({ error: 'Comment content is required' })
  }
  if (content.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be 1000 characters or less' })
  }

  // If replying, verify parent exists
  if (parentId) {
    const parent = db.prepare('SELECT id FROM comments WHERE id = ?').get(parentId)
    if (!parent) return res.status(404).json({ error: 'Parent comment not found' })
  }

  const result = db.prepare(`
    INSERT INTO comments (user_id, tmdb_id, media_type, season, episode, content, parent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    parseInt(tmdbId),
    mediaType,
    season ? parseInt(season) : null,
    episode ? parseInt(episode) : null,
    content.trim(),
    parentId || null
  )

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({
    comment: {
      id: comment.id,
      content: comment.content,
      username: comment.username,
      avatar: comment.avatar,
      userId: comment.user_id,
      isOwner: true,
      createdAt: comment.created_at,
      replies: [],
    },
  })
})

// ==================== DELETE COMMENT (owner only) ====================
router.delete('/:commentId', requireAuth, (req, res) => {
  const { commentId } = req.params
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId)

  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' })

  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId)
  res.json({ message: 'Comment deleted' })
})

export default router
