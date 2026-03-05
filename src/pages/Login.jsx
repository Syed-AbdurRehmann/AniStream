import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import { FiLogIn, FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import './Auth.css'

const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID &&
  import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWithGoogle } = useAuth()
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.error || 'Login failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">▶</span>
          <h1>Welcome Back</h1>
          <p>Sign in to your CineWeb account</p>
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
              text="signin_with"
              width="360"
            />
          </div>
        )}
        {GOOGLE_ENABLED && (
          <div className="auth-divider"><span>or continue with email</span></div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Username or Email</label>
            <div className="auth-input-wrapper">
              <FiUser className="auth-input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Enter username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? <span className="spinner spinner--sm"></span> : <FiLogIn />}
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" state={{ from }}>Create one</Link></p>
          <Link to="/home" className="auth-skip">Continue as guest</Link>
        </div>
      </div>
    </div>
  )
}
