import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, googleAuth as apiGoogleAuth } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('cineweb_token')
    if (token) {
      getMe()
        .then(data => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('cineweb_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    try {
      const data = await apiLogin(username, password)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.error || 'Login failed')
      throw err
    }
  }, [])

  const register = useCallback(async (username, email, password) => {
    setError(null)
    try {
      const data = await apiRegister(username, email, password)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.error || 'Registration failed')
      throw err
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    setError(null)
    try {
      const data = await apiGoogleAuth(credential)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.error || 'Google sign-in failed')
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe()
      setUser(data.user)
    } catch {
      setUser(null)
      localStorage.removeItem('cineweb_token')
    }
  }, [])

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshUser,
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
