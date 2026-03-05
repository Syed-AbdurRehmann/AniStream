import { useState, useEffect } from 'react'
import { discoverMovies, discoverTV, getGenres, getImageUrl, getYear, formatRating } from '../api/tmdb'
import MediaCard from '../components/MediaCard'
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi'
import './Catalog.css'

const SORT_OPTIONS_MOVIE = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Recently Released' },
  { value: 'revenue.desc', label: 'Highest Revenue' },
  { value: 'original_title.asc', label: 'Name (A-Z)' },
]

const SORT_OPTIONS_TV = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'first_air_date.desc', label: 'Recently Released' },
  { value: 'name.asc', label: 'Name (A-Z)' },
]

const YEARS = ['', ...Array.from({ length: 30 }, (_, i) => String(2026 - i))]

export default function Catalog() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [genres, setGenres] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters
  const [mediaType, setMediaType] = useState('movie')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [year, setYear] = useState('')

  useEffect(() => {
    loadGenres()
    // Reset sort when switching media type to avoid invalid sort keys
    setSortBy('popularity.desc')
    setSelectedGenres([])
  }, [mediaType])

  useEffect(() => {
    setPage(1)
    loadContent(1)
  }, [mediaType, sortBy, selectedGenres, year])

  async function loadGenres() {
    try {
      const data = await getGenres(mediaType)
      setGenres(data.genres)
    } catch (e) { console.error(e) }
  }

  async function loadContent(pg = page) {
    setLoading(true)
    try {
      const params = {
        sort_by: sortBy,
        page: pg,
        'vote_count.gte': sortBy === 'vote_average.desc' ? 200 : undefined,
        with_genres: selectedGenres.length > 0 ? selectedGenres.join(',') : undefined,
      }
      if (year) {
        if (mediaType === 'movie') {
          params.primary_release_year = year
        } else {
          params.first_air_date_year = year
        }
      }
      const data = mediaType === 'movie' ? await discoverMovies(params) : await discoverTV(params)
      if (pg === 1) {
        setItems(data.results)
      } else {
        setItems(prev => [...prev, ...data.results])
      }
      setTotalPages(data.total_pages)
      setPage(pg)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleGenre = (id) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setYear('')
    setSortBy('popularity.desc')
  }

  const hasActiveFilters = selectedGenres.length > 0 || year

  return (
    <div className="catalog">
      <div className="catalog__inner container">
        <div className="catalog__header">
          <h1>Catalog</h1>
          <div className="catalog__header-controls">
            <div className="catalog__type-toggle">
              <button
                className={`catalog__type-btn ${mediaType === 'movie' ? 'active' : ''}`}
                onClick={() => setMediaType('movie')}
              >
                Movies
              </button>
              <button
                className={`catalog__type-btn ${mediaType === 'tv' ? 'active' : ''}`}
                onClick={() => setMediaType('tv')}
              >
                TV Shows
              </button>
            </div>
            <button
              className={`btn btn-secondary btn-sm catalog__filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter /> Filters {hasActiveFilters && `(${selectedGenres.length + (year ? 1 : 0)})`}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="catalog__filters">
            <div className="catalog__filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {(mediaType === 'movie' ? SORT_OPTIONS_MOVIE : SORT_OPTIONS_TV).map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="catalog__filter-group">
              <label>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">All Years</option>
                {YEARS.filter(Boolean).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="catalog__filter-group catalog__filter-group--genres">
              <label>Genres</label>
              <div className="catalog__genres">
                {genres.map(g => (
                  <button
                    key={g.id}
                    className={`catalog__genre-btn ${selectedGenres.includes(g.id) ? 'active' : ''}`}
                    onClick={() => toggleGenre(g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="catalog__filter-actions">
              {hasActiveFilters && (
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                  <FiX /> Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="catalog__grid">
          {items.map(item => (
            <MediaCard key={item.id} item={item} type={mediaType} />
          ))}
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        )}

        {/* Load More */}
        {page < totalPages && !loading && (
          <div className="catalog__load-more">
            <button className="btn btn-secondary" onClick={() => loadContent(page + 1)}>
              Show More <FiChevronDown />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
