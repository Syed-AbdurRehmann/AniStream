import { Link } from 'react-router-dom'
import { FiPlay, FiMonitor, FiZap, FiSearch, FiBookmark, FiRotateCw, FiCheck, FiArrowDown, FiArrowRight } from 'react-icons/fi'
import './Landing.css'

const POSTERS = [
  { title: 'Interstellar', img: 'https://image.tmdb.org/t/p/w300/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { title: 'The Dark Knight', img: 'https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911BTUgMe1nUEOB.jpg' },
  { title: 'Inception', img: 'https://image.tmdb.org/t/p/w300/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg' },
  { title: 'Avengers', img: 'https://image.tmdb.org/t/p/w300/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg' },
  { title: 'Dune', img: 'https://image.tmdb.org/t/p/w300/d5NXSklXo0qyIYkgV94XAgMIckC.jpg' },
  { title: 'Oppenheimer', img: 'https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
]

const FEATURES = [
  { icon: <FiMonitor />, title: 'HD Streaming', desc: 'Crystal-clear quality up to 1080p. Every frame looks stunning on any device.' },
  { icon: <FiZap />, title: 'Fast Servers', desc: 'Multiple streaming servers with lightning-fast load times. No buffering.' },
  { icon: <FiPlay />, title: 'Auto-Play', desc: 'Episodes flow seamlessly. Sit back and let your marathon run itself.' },
  { icon: <FiSearch />, title: 'Smart Search', desc: 'Find any movie instantly with intelligent search and genre filters.' },
  { icon: <FiBookmark />, title: 'Watch Lists', desc: 'Bookmark your favorites and build the perfect watchlist for later.' },
  { icon: <FiRotateCw />, title: 'Resume Playback', desc: 'Pick up right where you left off. Your progress is always saved.' },
]

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause' },
  { key: 'F', action: 'Toggle Fullscreen' },
  { key: 'N', action: 'Next Episode' },
  { key: 'M', action: 'Mute / Unmute' },
  { key: '←', action: 'Rewind 5 seconds' },
  { key: '→', action: 'Forward 5 seconds' },
]

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__logo">
            <span className="landing__logo-icon">▶</span>
            <span className="landing__logo-text">CineWeb</span>
          </div>
          <div className="landing__nav-links">
            <a href="#features">Features</a>
            <a href="#showcase">See in Action</a>
            <a href="#stats">Stats</a>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/home" className="btn btn-primary btn-sm">Start Watching</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-posters landing__hero-posters--left">
          {POSTERS.slice(0, 3).map((p, i) => (
            <div key={i} className="landing__floating-poster" style={{ animationDelay: `${i * 0.5}s` }}>
              <img src={p.img} alt={p.title} />
              <span>{p.title}</span>
            </div>
          ))}
        </div>
        <div className="landing__hero-content">
          <div className="landing__hero-badge">FREE MOVIE STREAMING — NO SIGN-UP</div>
          <h1>Watch Movies Online. <span className="gradient-text">Free Forever.</span></h1>
          <p>Stream 50,000+ movies & TV shows in HD — the latest releases, timeless classics, and everything in between. No account, no fees — just press play.</p>
          <div className="landing__hero-btns">
            <Link to="/home" className="btn btn-primary"><FiPlay /> Start Watching</Link>
            <a href="#showcase" className="btn btn-secondary"><FiMonitor /> See in Action</a>
          </div>
        </div>
        <div className="landing__hero-posters landing__hero-posters--right">
          {POSTERS.slice(3).map((p, i) => (
            <div key={i} className="landing__floating-poster" style={{ animationDelay: `${(i + 3) * 0.5}s` }}>
              <img src={p.img} alt={p.title} />
              <span>{p.title}</span>
            </div>
          ))}
        </div>
        <a href="#stats" className="landing__scroll-indicator">
          <FiArrowDown className="landing__scroll-bounce" />
        </a>
      </section>

      {/* Stats */}
      <section id="stats" className="landing__stats">
        <div className="landing__stats-grid">
          <div className="landing__stat">
            <span className="landing__stat-num gradient-text">50,000+</span>
            <span className="landing__stat-label">Movies & Shows</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-num gradient-text">1080p</span>
            <span className="landing__stat-label">Max Quality</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-num gradient-text">24/7</span>
            <span className="landing__stat-label">Available</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-num" style={{ color: 'var(--success)', fontWeight: 900 }}>FREE</span>
            <span className="landing__stat-label">Forever</span>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="landing__showcase">
        <h2>Movie Streaming in Action</h2>
        <p className="landing__showcase-sub">See the smooth HD streaming experience on CineWeb.</p>
        <div className="landing__showcase-video">
          <div className="landing__showcase-browser">
            <div className="landing__browser-dots">
              <span></span><span></span><span></span>
            </div>
            <div className="landing__browser-url">cineweb.app/home</div>
          </div>
          <div className="landing__showcase-player">
            <div className="landing__showcase-logo">
              <span>▶</span> CineWeb
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing__features">
        <h2>Why Movie Fans Choose CineWeb</h2>
        <p className="landing__features-sub">Everything you need to watch movies online for free — built for the perfect binge session.</p>
        <div className="landing__features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing__feature-card">
              <div className="landing__feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Beautiful Interface */}
      <section className="landing__interface">
        <div className="landing__interface-inner container">
          <div className="landing__interface-text">
            <h2>A Beautiful Interface</h2>
            <p>Designed for comfort during those late-night movie sessions.</p>
            <ul>
              <li><FiCheck className="check-icon" /> Dark theme that's easy on your eyes</li>
              <li><FiCheck className="check-icon" /> Responsive layout for any screen size</li>
              <li><FiCheck className="check-icon" /> Fast, smooth navigation with zero lag</li>
              <li><FiCheck className="check-icon" /> Custom video player with full controls</li>
            </ul>
            <Link to="/home" className="btn btn-primary"><FiPlay /> Explore the App</Link>
          </div>
          <div className="landing__interface-preview">
            <div className="landing__showcase-browser">
              <div className="landing__browser-dots"><span></span><span></span><span></span></div>
              <div className="landing__browser-url">cineweb.app/home</div>
            </div>
            <div className="landing__interface-mockup">
              <div className="landing__mockup-gradient"></div>
              <div className="landing__mockup-cards">
                <div className="landing__mockup-card"></div>
                <div className="landing__mockup-card"></div>
                <div className="landing__mockup-card"></div>
                <div className="landing__mockup-card"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="landing__shortcuts">
        <h2>⌨ Keyboard Shortcuts</h2>
        <p>Navigate like a pro with these handy shortcuts.</p>
        <div className="landing__shortcuts-grid">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="landing__shortcut">
              <kbd>{s.key}</kbd>
              <span>{s.action}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta">
        <h2>Start Watching Movies for Free</h2>
        <p>50,000+ movies & TV shows with HD streaming. Completely free for all movie lovers — no sign-up needed.</p>
        <Link to="/home" className="btn btn-primary btn-lg"><FiPlay /> Start Watching Now</Link>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-brand">
            <span className="landing__logo-icon">▶</span>
            <span className="landing__logo-text">CineWeb</span>
            <span className="landing__footer-tagline">Watch movies online free — HD streaming for all movie lovers.</span>
          </div>
          <div className="landing__footer-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Contact</a>
          </div>
          <div className="landing__footer-socials">
            <a href="#">💬</a>
            <a href="#">🐦</a>
            <a href="#">📂</a>
          </div>
        </div>
        <div className="landing__footer-bottom">
          © 2026 CineWeb — Free Movie Streaming Platform. All rights reserved. For educational purposes only.
        </div>
      </footer>
    </div>
  )
}
