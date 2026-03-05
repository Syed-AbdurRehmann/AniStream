import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchMulti } from '../api/tmdb'
import MediaCard from '../components/MediaCard'
import { FiSearch } from 'react-icons/fi'
import './SearchResults.css'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (query) {
      setPage(1)
      search(1)
    }
  }, [query])

  async function search(pg = 1) {
    setLoading(true)
    try {
      const data = await searchMulti(query, pg)
      const filtered = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      if (pg === 1) {
        setResults(filtered)
      } else {
        setResults(prev => [...prev, ...filtered])
      }
      setTotalPages(data.total_pages)
      setPage(pg)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? results : results.filter(r => r.media_type === filter)

  return (
    <div className="search-page">
      <div className="search-page__inner container">
        <div className="search-page__header">
          <h1><FiSearch /> Search Results</h1>
          <p className="search-page__query">Showing results for: <strong>"{query}"</strong></p>
          <div className="search-page__filters">
            {['all', 'movie', 'tv'].map(f => (
              <button
                key={f}
                className={`search-page__filter ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Shows'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="search-page__grid">
            {filtered.map(item => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        ) : !loading ? (
          <div className="search-page__empty">
            <FiSearch size={48} />
            <h3>No results found</h3>
            <p>Try different keywords or check for typos</p>
          </div>
        ) : null}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        )}

        {page < totalPages && !loading && filtered.length > 0 && (
          <div className="search-page__more">
            <button className="btn btn-secondary" onClick={() => search(page + 1)}>
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
