import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { OAuth2Client } from 'google-auth-library'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'cineweb_super_secret_key_change_in_production_2026'
const TOKEN_EXPIRY = '7d'

// ==================== REGISTER ====================
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' })
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check existing user
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)
    if (existing) {
      return res.status(409).json({ error: 'Username or email already taken' })
    }

    // Create user
    const id = uuidv4()
    const passwordHash = bcrypt.hashSync(password, 12)
    
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)'
    ).run(id, username, email.toLowerCase(), passwordHash)

    // Create default preferences
    db.prepare(
      'INSERT INTO user_preferences (user_id) VALUES (?)'
    ).run(id)

    // Generate token & session
    const token = jwt.sign({ id, username, email: email.toLowerCase(), jti: uuidv4() }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
    const sessionId = uuidv4()
    db.prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime('now', '+7 days'))`
    ).run(sessionId, id, token)

    res.status(201).json({
      user: { id, username, email: email.toLowerCase() },
      token,
    })
  } catch (err) {
    console.error('[Register Error]', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// ==================== LOGIN ====================
router.post('/login', (req, res) => {
  try {
    const { login, password } = req.body // login = username or email

    if (!login || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' })
    }

    // Find user by username or email
    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(login, login.toLowerCase())

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    // Account was created via Google — has no password
    if (!user.password_hash || user.password_hash === 'GOOGLE_OAUTH_NO_PASSWORD') {
      return res.status(401).json({ error: 'This account uses Google sign-in. Please click \'Sign in with Google\'.' })
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Cleanup old sessions for this user (keep max 5)
    const sessions = db.prepare(
      'SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
    ).all(user.id)
    if (sessions.length >= 5) {
      const toDelete = sessions.slice(4).map(s => s.id)
      db.prepare(`DELETE FROM sessions WHERE id IN (${toDelete.map(() => '?').join(',')})`).run(...toDelete)
    }

    // Generate token & session
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, jti: uuidv4() },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    )
    const sessionId = uuidv4()
    db.prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime('now', '+7 days'))`
    ).run(sessionId, user.id, token)

    res.json({
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      token,
    })
  } catch (err) {
    console.error('[Login Error]', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ==================== GOOGLE OAUTH ====================
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ error: 'Google credential is required' })

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return res.status(503).json({ error: 'Google sign-in is not configured on this server' })
    }

    // Verify the ID token with Google
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    if (!email) return res.status(400).json({ error: 'Google account has no email address' })

    // Find user by google_id, then fall back to email (link accounts)
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId)
    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())
      if (user) {
        // Existing email account — link Google ID to it
        db.prepare('UPDATE users SET google_id = ?, avatar = COALESCE(avatar, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(googleId, picture || null, user.id)
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
      } else {
        // Brand new user — auto-generate a unique username from their Google name
        const base = (name || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16) || 'user'
        let username = base
        let n = 1
        while (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
          username = `${base}${n++}`
        }
        const id = uuidv4()
        db.prepare(`INSERT INTO users (id, username, email, password_hash, google_id, avatar) VALUES (?, ?, ?, 'GOOGLE_OAUTH_NO_PASSWORD', ?, ?)`)
          .run(id, username, email.toLowerCase(), googleId, picture || null)
        db.prepare('INSERT OR IGNORE INTO user_preferences (user_id) VALUES (?)').run(id)
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      }
    }

    // Cleanup old sessions (keep max 5)
    const sessions = db.prepare('SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(user.id)
    if (sessions.length >= 5) {
      const toDelete = sessions.slice(4).map(s => s.id)
      db.prepare(`DELETE FROM sessions WHERE id IN (${toDelete.map(() => '?').join(',')})`).run(...toDelete)
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, jti: uuidv4() },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    )
    const sessionId = uuidv4()
    db.prepare(`INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime('now', '+7 days'))`)
      .run(sessionId, user.id, token)

    res.json({
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      token,
    })
  } catch (err) {
    console.error('[Google Auth Error]', err.message)
    res.status(400).json({ error: 'Google sign-in failed. Please try again.' })
  }
})

// ==================== LOGOUT ====================
router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization.split(' ')[1]
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  res.json({ message: 'Logged out successfully' })
})

// ==================== GET CURRENT USER ====================
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  
  const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id)
  res.json({ user, preferences: prefs })
})

// ==================== UPDATE PROFILE ====================
router.put('/me', requireAuth, (req, res) => {
  try {
    const { username, email, avatar } = req.body
    const updates = []
    const values = []

    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' })
      }
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id)
      if (existing) return res.status(409).json({ error: 'Username already taken' })
      updates.push('username = ?')
      values.push(username)
    }
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), req.user.id)
      if (existing) return res.status(409).json({ error: 'Email already taken' })
      updates.push('email = ?')
      values.push(email.toLowerCase())
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(req.user.id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    const user = db.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?').get(req.user.id)
    res.json({ user })
  } catch (err) {
    console.error('[Update Profile Error]', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ==================== CHANGE PASSWORD ====================
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id)
  if (!user.password_hash || user.password_hash === 'GOOGLE_OAUTH_NO_PASSWORD') {
    return res.status(400).json({ error: 'Google accounts don\'t use a password. Sign in with Google.' })
  }
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const hash = bcrypt.hashSync(newPassword, 12)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.user.id)
  
  // Invalidate all sessions except current
  const token = req.headers.authorization.split(' ')[1]
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(req.user.id, token)
  
  res.json({ message: 'Password changed successfully' })
})

// ==================== DELETE ACCOUNT ====================
router.delete('/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id)
  res.json({ message: 'Account deleted' })
})

export default router
