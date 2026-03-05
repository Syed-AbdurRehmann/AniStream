import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollToTopButton from './components/ScrollToTopButton'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Details from './pages/Details'
import Watch from './pages/Watch'
import Catalog from './pages/Catalog'
import History from './pages/History'
import SearchResults from './pages/SearchResults'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app">
          <ScrollToTop />
          <ScrollToTopButton />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<><Navbar /><Home /><Footer /></>} />
            <Route path="/movie/:id" element={<><Navbar /><Details type="movie" /><Footer /></>} />
            <Route path="/tv/:id" element={<><Navbar /><Details type="tv" /><Footer /></>} />
            <Route path="/watch/movie/:id" element={<><Navbar /><Watch type="movie" /><Footer /></>} />
            <Route path="/watch/tv/:id" element={<><Navbar /><Watch type="tv" /><Footer /></>} />
            <Route path="/catalog" element={<><Navbar /><Catalog /><Footer /></>} />
            <Route path="/history" element={<><Navbar /><History /><Footer /></>} />
            <Route path="/search" element={<><Navbar /><SearchResults /><Footer /></>} />
            <Route path="/profile" element={<><Navbar /><Profile /><Footer /></>} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  )
}
