import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Legal.css'

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <div className="legal-page">
        <div className="legal-page__inner container">
          <h1>Privacy Policy</h1>
          <p className="legal-page__updated">Last updated: February 25, 2026</p>

          <p>Welcome to CineWeb ("we," "our," or "us"). We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.</p>

          <h2>1. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li><strong>Account Information:</strong> When you create an account, we collect your username, email address, and encrypted password.</li>
            <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our service, including pages visited, movies watched, watch history, and preferences.</li>
            <li><strong>Device Information:</strong> We may collect device type, browser type, operating system, and IP address for analytics and security purposes.</li>
            <li><strong>Cookies:</strong> We use cookies and similar technologies to maintain your session, remember preferences, and improve your experience.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and maintain our streaming service</li>
            <li>Personalize your experience with watchlists and history</li>
            <li>Improve our platform and user interface</li>
            <li>Ensure security and prevent unauthorized access</li>
            <li>Communicate important updates about the service</li>
          </ul>

          <h2>3. Data Storage and Security</h2>
          <p>Your data is stored securely using industry-standard encryption. Passwords are hashed using bcrypt with a cost factor of 12. We implement rate limiting, CORS policies, and input validation to protect against common attack vectors.</p>

          <h2>4. Third-Party Services</h2>
          <p>We integrate with the following third-party services:</p>
          <ul>
            <li><strong>The Movie Database (TMDB):</strong> For movie and TV show metadata, images, and search functionality.</li>
            <li><strong>Google OAuth:</strong> For optional Google sign-in authentication.</li>
            <li><strong>Third-party embed providers:</strong> For video streaming content delivery.</li>
          </ul>
          <p>Each third-party service has its own privacy policy and data practices.</p>

          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data through your profile settings</li>
            <li>Update or correct your account information</li>
            <li>Delete your account and all associated data</li>
            <li>Clear your watch history at any time</li>
            <li>Opt out of non-essential data collection</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>We retain your data for as long as your account is active. When you delete your account, all associated data (watchlist, history, preferences, sessions) is permanently removed from our servers.</p>

          <h2>7. Children's Privacy</h2>
          <p>CineWeb is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If we discover that we have collected information from a child, we will delete it immediately.</p>

          <h2>8. Changes to Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last updated" date at the top of this page.</p>

          <h2>9. Contact</h2>
          <p>If you have any questions about this Privacy Policy, please contact us through the links provided on our website.</p>
        </div>
      </div>
      <Footer />
    </>
  )
}
