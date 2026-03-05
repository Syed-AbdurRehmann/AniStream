import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMovieDetails, getTVDetails, getImageUrl, getBackdropUrl, formatRating, formatRuntime, getYear } from '../api/tmdb'
import { addToWatchlist, getWatchlistStatus, removeFromWatchlist } from '../utils/storage'
import MediaRow from '../components/MediaRow'
import { FiPlay, FiPlus, FiCheck, FiStar, FiClock, FiCalendar, FiFilm, FiChevronDown } from 'react-icons/fi'
import './Details.css'

export default function Details({ type }) {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wlStatus, setWlStatus] = useState(null)
  const [showWlMenu, setShowWlMenu] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(1)

  useEffect(() => {
    loadDetails()
  }, [id, type])

  async function loadDetails() {
    setLoading(true)
    try {
      const res = type === 'movie' ? await getMovieDetails(id) : await getTVDetails(id)
      setData(res)
      setWlStatus(getWatchlistStatus(Number(id), type))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleWatchlist = (category) => {
    if (!data) return
    if (wlStatus === category) {
      removeFromWatchlist(data.id, type)
      setWlStatus(null)
    } else {
      addToWatchlist(category, {
        id: data.id,
        type,
        title: data.title || data.name,
        poster: data.poster_path,
        rating: data.vote_average,
        year: getYear(data.release_date || data.first_air_date),
      })
      setWlStatus(category)
    }
    setShowWlMenu(false)
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!data) return <div className="container" style={{ paddingTop: '100px' }}>Not found</div>

  const title = data.title || data.name
  const date = data.release_date || data.first_air_date
  const genres = data.genres || []
  const rating = data.vote_average
  const episodes = type === 'tv' ? data.number_of_episodes : null
  const seasons = type === 'tv' ? data.seasons?.filter(s => s.season_number > 0) : null

  const WL_OPTIONS = [
    { key: 'watching', label: 'Watching', icon: '👁' },
    { key: 'toWatch', label: 'To Watch', icon: '📋' },
    { key: 'watched', label: 'Watched', icon: '✅' },
  ]

  return (
    <div className="details">
      {/* Backdrop */}
      <div className="details__backdrop" style={{ backgroundImage: `url(${getBackdropUrl(data.backdrop_path)})` }}>
        <div className="details__backdrop-overlay"></div>
      </div>

      {/* Breadcrumb */}
      <div className="details__breadcrumb container">
        <Link to="/home">Home</Link>
        <span>/</span>
        <Link to="/catalog">{type === 'movie' ? 'Movies' : 'TV'}</Link>
        <span>/</span>
        <span className="details__breadcrumb-current">{title}</span>
      </div>

      {/* Main Info */}
      <div className="details__main container">
        <div className="details__poster">
          <img src={getImageUrl(data.poster_path, 'w500')} alt={title} />
        </div>
        <div className="details__info">
          <h1>{title}</h1>
          <div className="details__meta-line">
            {type === 'tv' && episodes && <span>{episodes} episodes ({data.status === 'Returning Series' ? 'SUB' : 'Complete'})</span>}
            {type === 'movie' && data.runtime && <span><FiClock /> {formatRuntime(data.runtime)}</span>}
            <span><FiCalendar /> {getYear(date)}</span>
            {type === 'movie' && <span><FiFilm /> Movie</span>}
          </div>

          <div className="details__genres">
            {genres.map(g => (
              <span key={g.id} className="genre-tag">{g.name}</span>
            ))}
          </div>

          <div className="details__ratings">
            {rating > 0 && (
              <span className="details__rating">
                <FiStar /> {formatRating(rating)}
              </span>
            )}
            {data.vote_count > 0 && (
              <span className="details__tmdb-badge">
                <FiStar /> TMDB {formatRating(rating)}
              </span>
            )}
          </div>

          {data.status && (
            <div className={`details__status ${data.status === 'Returning Series' || data.status === 'Released' ? 'details__status--good' : ''}`}>
              Status: {data.status}
            </div>
          )}

          {/* Watchlist button */}
          <div className="details__wl-wrapper">
            <button
              className={`btn ${wlStatus ? 'btn-primary' : 'btn-secondary'} details__wl-btn`}
              onClick={() => setShowWlMenu(!showWlMenu)}
            >
              {wlStatus ? <FiCheck /> : <FiPlus />}
              {wlStatus ? WL_OPTIONS.find(o => o.key === wlStatus)?.label : 'Add to List'}
              <FiChevronDown />
            </button>
            {showWlMenu && (
              <div className="details__wl-menu">
                {WL_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    className={`details__wl-option ${wlStatus === opt.key ? 'active' : ''}`}
                    onClick={() => handleWatchlist(opt.key)}
                  >
                    <span>{opt.icon}</span> {opt.label}
                    {wlStatus === opt.key && <FiCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Watch button */}
          <Link to={`/watch/${type}/${data.id}`} className="btn btn-primary details__watch-btn">
            <FiPlay /> Watch Now
          </Link>

          {/* Overview */}
          {data.overview && (
            <p className="details__overview">{data.overview}</p>
          )}

          {/* Cast */}
          {data.credits?.cast?.length > 0 && (
            <div className="details__cast">
              <h3>Cast</h3>
              <div className="details__cast-list">
                {data.credits.cast.slice(0, 8).map(c => (
                  <span key={c.id} className="details__cast-member">{c.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Episodes (TV) */}
      {type === 'tv' && seasons && (
        <div className="details__episodes container">
          <div className="details__episodes-header">
            <h2 className="section-title">Episodes</h2>
            <div className="details__season-select">
              <select value={selectedSeason} onChange={(e) => setSelectedSeason(Number(e.target.value))}>
                {seasons.map(s => (
                  <option key={s.season_number} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="details__episodes-grid">
            {Array.from({ length: seasons.find(s => s.season_number === selectedSeason)?.episode_count || 0 }, (_, i) => (
              <Link
                key={i}
                to={`/watch/tv/${data.id}?s=${selectedSeason}&e=${i + 1}`}
                className="details__episode-btn"
              >
                {i + 1}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar / Recommendations */}
      <div className="container">
        {data.recommendations?.results?.length > 0 && (
          <MediaRow title="Recommended" items={data.recommendations.results.slice(0, 20)} type={type} />
        )}
        {data.similar?.results?.length > 0 && (
          <MediaRow title="Similar" items={data.similar.results.slice(0, 20)} type={type} />
        )}
      </div>
    </div>
  )
}
