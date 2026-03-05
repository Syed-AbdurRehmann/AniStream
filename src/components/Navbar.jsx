import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { searchMulti, getImageUrl } from '../api/tmdb'
import { useAuth } from '../context/AuthContext'
import { FiSearch, FiX, FiMenu, FiClock, FiBookmark, FiHome, FiGrid, FiLogIn, FiUser, FiLogOut, FiSettings } from 'react-icons/fi'
import './Navbar.css'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const timerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileMenu(false)
    setShowResults(false)
  }, [location])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (val) => {
    setQuery(val)
    clearTimeout(timerRef.current)
    if (val.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(val.trim())
        const filtered = data.results
          .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 8)
        setResults(filtered)
        setShowResults(true)
      } catch (e) {
        console.error(e)
      }
    }, 400)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/home" className="navbar__logo">
          <span className="navbar__logo-icon">▶</span>
          <span className="navbar__logo-text">CineWeb</span>
        </Link>

        <form className="navbar__search" ref={searchRef} onSubmit={handleSubmit}>
          <FiSearch className="navbar__search-icon" />
          <input
            type="text"
            placeholder="Search movies & TV shows..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {query && (
            <button type="button" className="navbar__search-clear" onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}>
              <FiX />
            </button>
          )}
          {showResults && results.length > 0 && (
            <div className="navbar__search-dropdown">
              {results.map(item => (
                <Link
                  key={item.id}
                  to={`/${item.media_type}/${item.id}`}
                  className="search-result"
                  onClick={() => setShowResults(false)}
                >
                  <img
                    src={getImageUrl(item.poster_path, 'w92')}
                    alt={item.title || item.name}
                    className="search-result__poster"
                  />
                  <div className="search-result__info">
                    <span className="search-result__title">{item.title || item.name}</span>
                    <span className="search-result__meta">
                      <span className={`badge badge-${item.media_type}`}>{item.media_type === 'movie' ? 'Movie' : 'TV'}</span>
                      <span>{(item.release_date || item.first_air_date || '').slice(0, 4)}</span>
                      {item.vote_average > 0 && <span>★ {item.vote_average.toFixed(1)}</span>}
                    </span>
                  </div>
                </Link>
              ))}
              <button className="search-result__viewall" onClick={handleSubmit}>
                View all results for "{query}"
              </button>
            </div>
          )}
        </form>

        <div className="navbar__links">
          <Link to="/home" className={`navbar__link ${isActive('/home') ? 'active' : ''}`}>
            <FiHome /> Home
          </Link>
          <Link to="/catalog" className={`navbar__link ${isActive('/catalog') ? 'active' : ''}`}>
            <FiGrid /> Catalog
          </Link>
          <Link to="/history" className={`navbar__link ${isActive('/history') ? 'active' : ''}`}>
            <FiClock /> History
          </Link>
          {isAuthenticated ? (
            <div className="navbar__user" ref={userMenuRef}>
              <button className="navbar__user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <span className="navbar__avatar">{user.username[0].toUpperCase()}</span>
              </button>
              {showUserMenu && (
                <div className="navbar__user-menu">
                  <div className="navbar__user-info">
                    <span className="navbar__user-name">{user.username}</span>
                    <span className="navbar__user-email">{user.email}</span>
                  </div>
                  <Link to="/profile" className="navbar__user-item" onClick={() => setShowUserMenu(false)}>
                    <FiSettings /> Profile & Settings
                  </Link>
                  <button className="navbar__user-item navbar__user-item--danger" onClick={async () => { await logout(); setShowUserMenu(false); navigate('/home'); }}>
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm navbar__auth-btn">
              <FiLogIn /> Sign In
            </Link>
          )}
        </div>

        <button className="navbar__mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile-menu ${mobileMenu ? 'open' : ''}`}>
        <Link to="/home" className="navbar__mobile-link" onClick={() => setMobileMenu(false)}>
          <FiHome /> Home
        </Link>
        <Link to="/catalog" className="navbar__mobile-link" onClick={() => setMobileMenu(false)}>
          <FiGrid /> Catalog
        </Link>
        <Link to="/history" className="navbar__mobile-link" onClick={() => setMobileMenu(false)}>
          <FiClock /> History
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="navbar__mobile-link" onClick={() => setMobileMenu(false)}>
              <FiUser /> Profile
            </Link>
            <button className="navbar__mobile-link navbar__mobile-link--danger" onClick={async () => { await logout(); setMobileMenu(false); navigate('/home'); }}>
              <FiLogOut /> Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar__mobile-link navbar__mobile-link--accent" onClick={() => setMobileMenu(false)}>
            <FiLogIn /> Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}
