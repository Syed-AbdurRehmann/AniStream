import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, clearHistory, removeFromHistory } from '../utils/storage'
import { getServerHistory } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getImageUrl, formatRating } from '../api/tmdb'
import { FiTrash2, FiClock, FiPlay, FiX } from 'react-icons/fi'
import './History.css'

export default function History() {
  const { isAuthenticated } = useAuth()
  const [history, setHistory] = useState(getHistory())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true)
      getServerHistory(100, 0)
        .then(data => {
          if (data.history?.length > 0) setHistory(data.history)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isAuthenticated])

  const handleClear = () => {
    clearHistory()
    setHistory([])
  }

  const handleRemove = (id, type) => {
    removeFromHistory(id, type)
    setHistory(getHistory())
  }

  return (
    <div className="history">
      <div className="history__inner container">
        <div className="history__header">
          <h1><FiClock /> Watch History</h1>
          {history.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}>
              <FiTrash2 /> Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="history__empty">
            <FiClock size={48} />
            <h3>No watch history yet.</h3>
            <p>Start watching to build your history!</p>
            <Link to="/home" className="btn btn-primary">
              <FiPlay /> Start Watching
            </Link>
          </div>
        ) : (
          <div className="history__grid">
            {history.map(item => (
              <div key={`${item.type}-${item.id}`} className="history__item">
                <Link to={`/${item.type}/${item.id}`} className="history__item-link">
                  <img
                    src={getImageUrl(item.poster)}
                    alt={item.title}
                    className="history__poster"
                    onError={(e) => { e.target.src = '/no-poster.svg' }}
                  />
                  <div className="history__info">
                    <div className="history__title">{item.title}</div>
                    <div className="history__meta">
                      <span className={`badge badge-${item.type}`}>
                        {item.type === 'movie' ? 'Movie' : 'TV'}
                      </span>
                      {item.year && <span>{item.year}</span>}
                      {item.rating > 0 && <span>★ {formatRating(item.rating)}</span>}
                      {item.season && <span>S{item.season} E{item.episode}</span>}
                    </div>
                    <div className="history__time">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
                <button
                  className="history__remove"
                  onClick={() => handleRemove(item.id, item.type)}
                  title="Remove"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
