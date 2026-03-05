import { useEffect, useRef, useState } from 'react'
import MediaCard from './MediaCard'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './MediaRow.css'

export default function MediaRow({ title, items, type, filters, activeFilter, onFilterChange }) {
  const rowRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!rowRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = rowRef.current
    if (el) el.addEventListener('scroll', checkScroll)
    return () => el?.removeEventListener('scroll', checkScroll)
  }, [items])

  const scroll = (dir) => {
    if (!rowRef.current) return
    const amount = rowRef.current.clientWidth * 0.75
    rowRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section className="media-row">
      <div className="media-row__header">
        <h2 className="section-title">{title}</h2>
        {filters && (
          <div className="media-row__filters">
            {filters.map(f => (
              <button
                key={f.value}
                className={`media-row__filter ${activeFilter === f.value ? 'active' : ''}`}
                onClick={() => onFilterChange(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="media-row__wrapper">
        {canScrollLeft && (
          <button className="media-row__arrow media-row__arrow--left" onClick={() => scroll('left')}>
            <FiChevronLeft size={24} />
          </button>
        )}
        <div className="scroll-row" ref={rowRef}>
          {items?.map(item => (
            <MediaCard key={item.id} item={item} type={type} />
          ))}
        </div>
        {canScrollRight && (
          <button className="media-row__arrow media-row__arrow--right" onClick={() => scroll('right')}>
            <FiChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  )
}
