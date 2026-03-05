import { Link } from 'react-router-dom'
import { getImageUrl, formatRating, getYear } from '../api/tmdb'
import { FiPlay } from 'react-icons/fi'

export default function MediaCard({ item, type }) {
  const mediaType = type || item.media_type || 'movie'
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const rating = item.vote_average

  return (
    <Link to={`/${mediaType}/${item.id}`} className="media-card">
      <div className="media-card__image">
        <img
          src={getImageUrl(item.poster_path)}
          alt={title}
          loading="lazy"
          onError={(e) => { e.target.src = '/no-poster.svg' }}
        />
        <div className="media-card__badges">
          <span className={`badge badge-${mediaType}`}>
            {mediaType === 'movie' ? 'Movie' : 'TV'}
          </span>
          <span className="badge badge-hd">HD</span>
        </div>
        <div className="media-card__overlay">
          <div className="media-card__play">
            <FiPlay size={20} color="white" fill="white" />
          </div>
        </div>
      </div>
      <div className="media-card__info">
        <div className="media-card__title">{title}</div>
        <div className="media-card__meta">
          <span>{getYear(date)}</span>
          {rating > 0 && (
            <span className="star-rating" style={{ fontSize: '0.75rem' }}>
              ★ {formatRating(rating)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
