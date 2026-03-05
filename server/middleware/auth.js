import jwt from 'jsonwebtoken'
import db from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'cineweb_super_secret_key_change_in_production_2026'

/**
 * Auth middleware — extracts and verifies JWT token.
 * Sets req.user = { id, username, email } on success.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Check session exists and not expired
    const session = db.prepare(
      `SELECT * FROM sessions WHERE token = ? AND user_id = ? AND expires_at > datetime('now')`
    ).get(token, decoded.id)
    
    if (!session) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' })
    }

    req.user = { id: decoded.id, username: decoded.username, email: decoded.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Optional auth middleware — if token is present and valid, sets req.user.
 * Doesn't fail if no token — allows guest access.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null
    return next()
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const session = db.prepare(
      `SELECT * FROM sessions WHERE token = ? AND user_id = ? AND expires_at > datetime('now')`
    ).get(token, decoded.id)
    
    if (session) {
      req.user = { id: decoded.id, username: decoded.username, email: decoded.email }
    } else {
      req.user = null
    }
  } catch {
    req.user = null
  }
  next()
}
