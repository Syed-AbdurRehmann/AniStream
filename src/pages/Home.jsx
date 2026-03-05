import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTrending, getNowPlayingMovies, getPopularMovies, getTopRatedMovies, getPopularTV, getOnTheAirTV, getAiringTodayTV, getRecentlyUpdated, getImageUrl, getBackdropUrl, formatRating } from '../api/tmdb'
import MediaRow from '../components/MediaRow'
import AiringSchedule from '../components/AiringSchedule'
import { FiPlay, FiInfo, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './Home.css'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [trending, setTrending] = useState([])
  const [trendingFilter, setTrendingFilter] = useState('day')
  const [nowPlaying, setNowPlaying] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [airingTV, setAiringTV] = useState([])
  const [topRated, setTopRated] = useState([])
  const [recentlyUpdated, setRecentlyUpdated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTrending(trendingFilter)
  }, [trendingFilter])

  // Auto-rotate featured
  useEffect(() => {
    if (featured.length === 0) return
    const timer = setInterval(() => {
      setFeaturedIdx(prev => (prev + 1) % featured.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [featured])

  async function loadData() {
    try {
      const [trendRes, npRes, popRes, airRes, trRes, ruRes] = await Promise.all([
        getTrending('all', 'day'),
        getNowPlayingMovies(),
        getPopularMovies(),
        getOnTheAirTV(),
        getTopRatedMovies(),
        getRecentlyUpdated(),
      ])
      setFeatured(trendRes.results.slice(0, 5))
      setTrending(trendRes.results)
      setNowPlaying(npRes.results)
      setPopularMovies(popRes.results)
      setAiringTV(airRes.results)
      setTopRated(trRes.results)
      setRecentlyUpdated(ruRes.results)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadTrending(window) {
    try {
      if (window === 'month') {
        // TMDB doesn't have a 'month' window, use popular movies as proxy
        const [movData, tvData] = await Promise.all([
          getPopularMovies(),
          getPopularTV(),
        ])
        const combined = [...movData.results.map(m => ({ ...m, media_type: 'movie' })),
                          ...tvData.results.map(t => ({ ...t, media_type: 'tv' }))]
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 20)
        setTrending(combined)
      } else {
        const data = await getTrending('all', window)
        setTrending(data.results)
      }
    } catch (e) { console.error(e) }
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <div className="spinner"></div>
        <p>Loading amazing content...</p>
      </div>
    )
  }

  const feat = featured[featuredIdx]
  const featType = feat?.media_type || (feat?.title ? 'movie' : 'tv')

  return (
    <div className="home">
      {/* Featured Hero */}
      {feat && (
        <section className="home__hero" style={{ backgroundImage: `url(${getBackdropUrl(feat.backdrop_path)})` }}>
          <div className="home__hero-overlay"></div>
          <div className="home__hero-content container">
            <span className="badge badge-new">FEATURED</span>
            <h1>{feat.title || feat.name}</h1>
            <p className="home__hero-overview">{feat.overview?.slice(0, 200)}{feat.overview?.length > 200 ? '...' : ''}</p>
            <div className="home__hero-meta">
              <span className="home__hero-genres">
                {feat.genre_ids?.slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean).join(' • ')}
              </span>
              {feat.vote_average > 0 && (
                <span className="star-rating"><FiStar /> {formatRating(feat.vote_average)}</span>
              )}
            </div>
            <div className="home__hero-btns">
              <Link to={`/watch/${featType}/${feat.id}`} className="btn btn-primary">
                <FiPlay /> Watch Now
              </Link>
              <Link to={`/${featType}/${feat.id}`} className="btn btn-secondary">
                <FiInfo /> More Info
              </Link>
            </div>
          </div>
          <div className="home__hero-poster">
            <img src={getImageUrl(feat.poster_path, 'w500')} alt={feat.title || feat.name} />
          </div>
          {/* Dots */}
          <div className="home__hero-dots">
            {featured.map((_, i) => (
              <button
                key={i}
                className={`home__hero-dot ${i === featuredIdx ? 'active' : ''}`}
                onClick={() => setFeaturedIdx(i)}
              />
            ))}
          </div>
          {/* Arrows */}
          <button className="home__hero-arrow home__hero-arrow--left" onClick={() => setFeaturedIdx(p => (p - 1 + featured.length) % featured.length)}>
            <FiChevronLeft size={24} />
          </button>
          <button className="home__hero-arrow home__hero-arrow--right" onClick={() => setFeaturedIdx(p => (p + 1) % featured.length)}>
            <FiChevronRight size={24} />
          </button>
        </section>
      )}

      <div className="home__content container">
        {/* Trending */}
        <MediaRow
          title="Trending Now"
          items={trending}
          filters={[
            { label: 'Today', value: 'day' },
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
          ]}
          activeFilter={trendingFilter}
          onFilterChange={setTrendingFilter}
        />

        {/* Now Playing */}
        <MediaRow title="Now Playing in Theaters" items={nowPlaying} type="movie" />

        {/* Currently Airing TV */}
        <MediaRow title="Currently Airing TV" items={airingTV} type="tv" />

        {/* Recently Updated */}
        <MediaRow title="Recently Updated" items={recentlyUpdated} type="tv" />

        {/* Airing Schedule */}
        <AiringSchedule />

        {/* Popular Movies */}
        <MediaRow title="Popular Movies" items={popularMovies} type="movie" />

        {/* Top Rated */}
        <MediaRow title="Top Rated" items={topRated} type="movie" />
      </div>
    </div>
  )
}

// Quick genre ID to name map
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
}
