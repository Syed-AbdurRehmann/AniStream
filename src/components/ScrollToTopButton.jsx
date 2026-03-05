import { useState, useEffect } from 'react'
import { FiArrowUp } from 'react-icons/fi'

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', toggle)
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  if (!visible) return null

  return (
    <button
      onClick={scrollTop}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 999,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--accent)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s, opacity 0.2s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
      }}
      aria-label="Scroll to top"
    >
      <FiArrowUp size={20} />
    </button>
  )
}
