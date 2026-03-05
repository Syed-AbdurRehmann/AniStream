import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getMovieDetails, getTVDetails, getTVSeasonDetails, getImageUrl, formatRating, getYear, EMBED_PROVIDERS } from '../api/tmdb'
import { addToHistory, getPreferences, setPreference } from '../utils/storage'
import { useAuth } from '../context/AuthContext'
import { FiChevronLeft, FiChevronRight, FiDownload, FiCheck, FiPlay, FiMessageSquare, FiShield, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import AdBlocker from '../components/AdBlocker'
import Comments from '../components/Comments'
import './Watch.css'

export default function Watch({ type }) {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  const [data, setData] = useState(null)
  const [season, setSeason] = useState(Number(searchParams.get('s')) || 1)
  const [episode, setEpisode] = useState(Number(searchParams.get('e')) || 1)
  const [source, setSource] = useState('vidsrccc')
  const [autoPlay, setAutoPlay] = useState(getPreferences().autoPlay)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [seasonData, setSeasonData] = useState(null)
  const [adBlockEnabled, setAdBlockEnabled] = useState(true)
  const [playerKey, setPlayerKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [id, type])

  useEffect(() => {
    if (type === 'tv' && data) {
      loadSeason()
    }
  }, [season, data])

  useEffect(() => {
    if (data) {
      addToHistory({
        id: Number(id),
        type,
        title: data.title || data.name,
        poster: data.poster_path,
        rating: data.vote_average,
        year: getYear(data.release_date || data.first_air_date),
        season: type === 'tv' ? season : null,
        episode: type === 'tv' ? episode : null,
      })
    }
  }, [data, season, episode])

  // Keyboard shortcuts — use refs to avoid stale closures
  const episodeRef = React.useRef(episode)
  const episodesRef = React.useRef(episodes)
  const seasonRef = React.useRef(season)
  const dataRef = React.useRef(data)
  useEffect(() => { episodeRef.current = episode }, [episode])
  useEffect(() => { episodesRef.current = episodes }, [episodes])
  useEffect(() => { seasonRef.current = season }, [season])
  useEffect(() => { dataRef.current = data }, [data])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key.toLowerCase()) {
        case 'n': nextEpisode(); break
        case 'p': prevEpisode(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = type === 'movie' ? await getMovieDetails(id) : await getTVDetails(id)
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadSeason() {
    try {
      const sd = await getTVSeasonDetails(id, season)
      setSeasonData(sd)
      setEpisodes(sd.episodes || [])
    } catch (e) {
      console.error(e)
    }
  }

  const getEmbedUrl = () => {
    const provider = EMBED_PROVIDERS[source] || EMBED_PROVIDERS.vidsrccc
    if (type === 'movie') {
      return provider.movie(id)
    }
    return provider.tv(id, season, episode)
  }

  const nextEpisode = () => {
    if (type !== 'tv') return
    if (episode < episodes.length) {
      setEpisode(episode + 1)
      setSearchParams({ s: season, e: episode + 1 })
    } else if (data?.seasons?.some(s => s.season_number === season + 1)) {
      setSeason(season + 1)
      setEpisode(1)
      setSearchParams({ s: season + 1, e: 1 })
    }
  }

  const prevEpisode = () => {
    if (type !== 'tv') return
    if (episode > 1) {
      setEpisode(episode - 1)
      setSearchParams({ s: season, e: episode - 1 })
    } else if (season > 1) {
      setSeason(season - 1)
      setEpisode(1)
      setSearchParams({ s: season - 1, e: 1 })
    }
  }

  const goToEpisode = (s, e) => {
    setSeason(s)
    setEpisode(e)
    setSearchParams({ s, e })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="spinner"></div>
        <p>Loading video...</p>
      </div>
    )
  }

  if (!data) return <div className="container" style={{ paddingTop: '100px' }}>Not found</div>

  const title = data.title || data.name
  const seasons = data.seasons?.filter(s => s.season_number > 0) || []

  return (
    <div className="watch">
      {/* Breadcrumb */}
      <div className="watch__breadcrumb container">
        <Link to="/home">Home</Link>
        <span>/</span>
        <Link to={`/${type}/${id}`}>{title}</Link>
        <span>/</span>
        <span className="watch__breadcrumb-current">
          {type === 'movie' ? 'Watch' : `Episode ${episode}`}
        </span>
      </div>

      {/* Title */}
      <h1 className="watch__title container">
        {title}{type === 'tv' ? ` - Season ${season} Episode ${episode}` : ''}
      </h1>

      {/* Video Player */}
      <div className="watch__player-container container">
        <div className="watch__player" key={playerKey}>
          {adBlockEnabled ? (
            <AdBlocker
              src={getEmbedUrl()}
              title={title}
            />
          ) : (
            <iframe
              src={getEmbedUrl()}
              frameBorder="0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={title}
            ></iframe>
          )}
        </div>

        {/* Controls */}
        <div className="watch__controls">
          <div className="watch__controls-left">
            {type === 'tv' && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={prevEpisode}>
                  <FiChevronLeft /> Previous
                </button>
                <button className="btn btn-secondary btn-sm" onClick={nextEpisode}>
                  Next <FiChevronRight />
                </button>
              </>
            )}
          </div>
          <div className="watch__controls-center">
            {type === 'tv' && (
              <label className="watch__autoplay">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => { setAutoPlay(e.target.checked); setPreference('autoPlay', e.target.checked); }}
                />
                <span className="watch__autoplay-check"><FiCheck size={12} /></span>
                Auto-play next
              </label>
            )}
            <label className="watch__adblock-toggle" title="Block popups and ads from the player">
              <input
                type="checkbox"
                checked={adBlockEnabled}
                onChange={(e) => setAdBlockEnabled(e.target.checked)}
              />
              <span className="watch__adblock-check"><FiShield size={12} /></span>
              Ad Shield
            </label>
          </div>
          <div className="watch__controls-right">
            <a
              href={`https://dl.vidsrc.vip/movie/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm watch__download-btn"
              title="Download"
            >
              <FiDownload size={14} /> Download
            </a>
            <button
              className="btn btn-secondary btn-sm watch__reload-btn"
              onClick={() => setPlayerKey(prev => prev + 1)}
              title="Reload player"
            >
              <FiRefreshCw size={14} />
            </button>
            <select
              className="watch__source-select"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {Object.entries(EMBED_PROVIDERS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.name}{val.tag ? ` (${val.tag})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Server info */}
        <div className="watch__server-info">
          <FiAlertTriangle size={13} />
          <span>If the current server doesn't work, try switching to a different one using the dropdown above.</span>
        </div>

        {/* Shortcuts bar */}
        <div className="watch__shortcuts">
          Shortcuts: Space (play/pause) | F (fullscreen) | ←/→ (seek) | N (next) | P (prev) | M (mute)
        </div>
      </div>

      {/* Comments section */}
      <div className="watch__comments container">
        <Comments
          mediaType={type}
          tmdbId={id}
          season={type === 'tv' ? season : undefined}
          episode={type === 'tv' ? episode : undefined}
        />
      </div>

      {/* Episodes (TV) */}
      {type === 'tv' && (
        <div className="watch__episodes container">
          <div className="watch__episodes-header">
            <h2 className="section-title">Episodes</h2>
            <div className="watch__episodes-controls">
              {seasons.length > 1 && (
                <select
                  value={season}
                  onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
                  className="watch__season-select"
                >
                  {seasons.map(s => (
                    <option key={s.season_number} value={s.season_number}>
                      Season {s.season_number}
                    </option>
                  ))}
                </select>
              )}
              <div className="watch__goto">
                <input
                  type="number"
                  min="1"
                  max={episodes.length}
                  placeholder="Go to ep."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const ep = Number(e.target.value)
                      if (ep >= 1 && ep <= episodes.length) goToEpisode(season, ep)
                    }
                  }}
                />
                <button className="btn btn-primary btn-sm" onClick={(e) => {
                  const inp = e.target.previousElementSibling
                  const ep = Number(inp?.value)
                  if (ep >= 1 && ep <= episodes.length) goToEpisode(season, ep)
                }}>Go</button>
              </div>
            </div>
          </div>
          <div className="watch__episodes-grid">
            {episodes.map((ep) => (
              <button
                key={ep.episode_number}
                className={`watch__episode-btn ${ep.episode_number === episode ? 'active' : ''}`}
                onClick={() => goToEpisode(season, ep.episode_number)}
              >
                {ep.episode_number}
              </button>
            ))}
            {episodes.length === 0 && (
              Array.from({ length: seasons.find(s => s.season_number === season)?.episode_count || 0 }, (_, i) => (
                <button
                  key={i + 1}
                  className={`watch__episode-btn ${(i + 1) === episode ? 'active' : ''}`}
                  onClick={() => goToEpisode(season, i + 1)}
                >
                  {i + 1}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
