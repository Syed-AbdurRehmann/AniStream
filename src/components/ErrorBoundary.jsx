import { Component } from 'react'
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 420 }}>
            <FiAlertTriangle size={48} style={{ color: 'var(--warning)', marginBottom: 16 }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <FiRefreshCw /> Refresh
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = '/home'
                }}
              >
                <FiHome /> Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
