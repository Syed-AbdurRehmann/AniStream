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
          <Link to="/home">Terms of Service</Link>
          <Link to="/home">Privacy Policy</Link>
          <Link to="/home">Contact</Link>
        </div>

        <div className="footer__socials">
          <a href="#" className="footer__social" title="Discord"><FaDiscord /></a>
          <a href="#" className="footer__social" title="Twitter"><FiTwitter /></a>
          <a href="#" className="footer__social" title="GitHub"><FiGithub /></a>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2026 CineWeb. All rights reserved. For educational purposes only.</p>
      </div>
    </footer>
  )
}
