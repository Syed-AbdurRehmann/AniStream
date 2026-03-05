import { Link } from 'react-router-dom'
import { FiGithub, FiTwitter } from 'react-icons/fi'
import { FaDiscord } from 'react-icons/fa'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <Link to="/home" className="footer__logo">
            <span className="footer__logo-icon">▶</span>
            <span className="footer__logo-text">CineWeb</span>
          </Link>
          <p className="footer__tagline">Your favorite movie streaming platform</p>
        </div>

        <div className="footer__links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <a href="mailto:contact@cineweb.app">Contact</a>
        </div>

        <div className="footer__socials">
          <a href="https://discord.gg/cineweb" target="_blank" rel="noopener noreferrer" className="footer__social" title="Discord"><FaDiscord /></a>
          <a href="https://twitter.com/cineweb" target="_blank" rel="noopener noreferrer" className="footer__social" title="Twitter"><FiTwitter /></a>
          <a href="https://github.com/cineweb" target="_blank" rel="noopener noreferrer" className="footer__social" title="GitHub"><FiGithub /></a>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2026 CineWeb. All rights reserved. For educational purposes only.</p>
      </div>
    </footer>
  )
}
