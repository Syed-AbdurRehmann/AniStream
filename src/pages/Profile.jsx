import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile, changePassword, deleteAccount, getServerWatchlist, getServerHistory } from '../api/auth'
import { FiUser, FiMail, FiLock, FiTrash2, FiSave, FiLogOut, FiFilm, FiClock, FiBookmark, FiSettings, FiCheck, FiAlertCircle } from 'react-icons/fi'
import './Auth.css'

export default function Profile() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [stats, setStats] = useState({ watchlist: 0, history: 0 })
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    setUsername(user.username)
    setEmail(user.email)
    loadStats()
  }, [user, authLoading])

  if (authLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!user) return null

  async function loadStats() {
    try {
      const [wl, hist] = await Promise.all([
        getServerWatchlist().catch(() => ({ watchlist: {} })),
        getServerHistory(50, 0).catch(() => ({ history: [], total: 0 })),
      ])
      // watchlist is an object { watching: [], toWatch: [], watched: [] }
      const watchlistObj = wl.watchlist || {}
      const totalWatchlist = (watchlistObj.watching?.length || 0) +
                             (watchlistObj.toWatch?.length || 0) +
                             (watchlistObj.watched?.length || 0)
      setStats({
        watchlist: totalWatchlist,
        history: hist.total || hist.history?.length || 0,
      })
    } catch { /* ok */ }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await updateProfile({ username: username.trim(), email: email.trim() })
      await refreshUser()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.error || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePw = async () => {
    if (!currentPw || !newPw) {
      setMessage({ type: 'error', text: 'Please fill in both password fields' })
      return
    }
    if (newPw.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await changePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setMessage({ type: 'success', text: 'Password changed successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.error || 'Failed to change password' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAccount()
      await logout()
      navigate('/home')
    } catch (err) {
      setMessage({ type: 'error', text: err.error || 'Failed to delete account' })
    }
  }

  if (!user) return null

  const joinedDate = user.created_at ? new Date(user.created_at) : null
  const joined = joinedDate && !isNaN(joinedDate.getTime())
    ? joinedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently'

  return (
    <div className="profile">
      <div className="profile__inner container">
        <div className="profile__header">
          <div className="profile__avatar">{user.username[0].toUpperCase()}</div>
          <div className="profile__header-info">
            <h1>{user.username}</h1>
            <p>Member since {joined}</p>
          </div>
        </div>

        {message.text && (
          <div className={message.type === 'success' ? 'profile__success' : 'auth-error'} style={{ marginBottom: 20 }}>
            {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />} {message.text}
          </div>
        )}

        <div className="profile__stats">
          <div className="profile__stat">
            <div className="profile__stat-value">{stats.watchlist}</div>
            <div className="profile__stat-label"><FiBookmark /> Watchlist</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-value">{stats.history}</div>
            <div className="profile__stat-label"><FiClock /> History</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-value"><FiFilm /></div>
            <div className="profile__stat-label">Active</div>
          </div>
        </div>

        <div className="profile__section">
          <h2><FiUser /> Profile Settings</h2>
          <div className="profile__field">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="profile__field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="profile__actions">
            <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
              <FiSave /> Save Changes
            </button>
          </div>
        </div>

        <div className="profile__section">
          <h2><FiLock /> Change Password</h2>
          <div className="profile__field">
            <label>Current Password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="profile__field">
            <label>New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Enter new password (min 6 chars)" />
          </div>
          <div className="profile__actions">
            <button className="btn btn-primary btn-sm" onClick={handleChangePw} disabled={saving}>
              <FiLock /> Update Password
            </button>
          </div>
        </div>

        <div className="profile__section profile__danger-zone">
          <h2><FiTrash2 /> Danger Zone</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          {!showDelete ? (
            <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
              <FiTrash2 /> Delete Account
            </button>
          ) : (
            <div className="profile__actions">
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                Yes, permanently delete my account
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDelete(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={async () => { await logout(); navigate('/home'); }}>
            <FiLogOut /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
