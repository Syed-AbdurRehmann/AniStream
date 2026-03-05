import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import { FiUserPlus, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi'
import './Auth.css'

const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID &&
  import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/home'

  const handleGoogleSuccess = async (credential) => {
    setSubmitting(true)
    setError('')
    try {
      await loginWithGoogle(credential)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.error || 'Google sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const passwordChecks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Passwords match', ok: password && confirmPw && password === confirmPw },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password || !confirmPw) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await register(username.trim(), email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.error || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">▶</span>
          <h1>Create Account</h1>
          <p>Join CineWeb for a personalized experience</p>
        </div>

        {error && (
          <div className="auth-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        {GOOGLE_ENABLED && (
          <div className="auth-google">
            <GoogleLogin
              onSuccess={(r) => handleGoogleSuccess(r.credential)}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="signup_with"
              width="360"
            />
          </div>
        )}
        {GOOGLE_ENABLED && (
          <div className="auth-divider"><span>or sign up with email</span></div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <div className="auth-input-wrapper">
              <FiUser className="auth-input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <span className="auth-hint">3-20 characters, letters, numbers, underscores</span>
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="confirm-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="auth-pw-checks">
            {passwordChecks.map((c, i) => (
              <span key={i} className={`auth-pw-check ${c.ok ? 'ok' : ''}`}>
                <FiCheck size={12} /> {c.label}
              </span>
            ))}
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? <span className="spinner spinner--sm"></span> : <FiUserPlus />}
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" state={{ from }}>Sign in</Link></p>
          <Link to="/home" className="auth-skip">Continue as guest</Link>
        </div>
      </div>
    </div>
  )
}
