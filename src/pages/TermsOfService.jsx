import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Legal.css'

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <div className="legal-page">
        <div className="legal-page__inner container">
          <h1>Terms of Service</h1>
          <p className="legal-page__updated">Last updated: February 25, 2026</p>

          <p>Welcome to CineWeb ("we," "our," or "us"). By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.</p>

          <h2>1. Use of Service</h2>
          <p>CineWeb provides a free movie and TV show streaming discovery platform. Our service allows users to:</p>
          <ul>
            <li>Browse and search for movies and TV shows</li>
            <li>Stream content through third-party embed providers</li>
            <li>Maintain watchlists and viewing history</li>
            <li>Create and manage user accounts</li>
          </ul>

          <h2>2. User Accounts</h2>
          <p>When creating an account, you agree to:</p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h2>3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service</li>
            <li>Use automated tools to scrape or collect data</li>
            <li>Upload or transmit viruses or malicious code</li>
          </ul>

          <h2>4. Content Disclaimer</h2>
          <p>CineWeb does not host any video content. All streaming is provided through third-party embed services. We are not responsible for the content, availability, or quality of third-party streams. Content metadata is provided by The Movie Database (TMDB) and is subject to their terms of use.</p>

          <h2>5. Intellectual Property</h2>
          <p>The CineWeb brand, logo, design, and original code are our intellectual property. Movie and TV show metadata, images, and descriptions are the property of their respective owners and are used under fair use for informational purposes.</p>

          <h2>6. Privacy</h2>
          <p>Your privacy is important to us. Please review our <Link to="/privacy">Privacy Policy</Link> to understand how we collect, use, and protect your information.</p>

          <h2>7. Limitation of Liability</h2>
          <p>CineWeb is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to direct, indirect, incidental, or consequential damages.</p>

          <h2>8. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

          <h2>9. Educational Purpose</h2>
          <p>This platform is built and maintained for educational and portfolio demonstration purposes. It showcases modern web development techniques including React, Express.js, and third-party API integration.</p>

          <h2>10. Contact</h2>
          <p>If you have any questions about these Terms of Service, please contact us through the links provided on our website.</p>
        </div>
      </div>
      <Footer />
    </>
  )
}
