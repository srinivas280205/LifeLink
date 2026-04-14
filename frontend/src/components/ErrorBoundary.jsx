import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('LifeLink error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem',
        background: 'var(--bg)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--heading)', marginBottom: '0.5rem' }}>
          Something went wrong
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem', maxWidth: 340, lineHeight: 1.6 }}>
          An unexpected error occurred. Your data is safe — please refresh to continue.
        </p>
        {this.state.error && (
          <pre style={{
            background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.72rem',
            color: '#d32f2f', maxWidth: '100%', overflowX: 'auto',
            marginBottom: '1.5rem', textAlign: 'left',
          }}>{this.state.error.message}</pre>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.7rem 1.8rem', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#d32f2f,#b71c1c)', color: '#fff',
            fontSize: '0.9rem', fontWeight: 700,
          }}
        >↺ Reload App</button>
      </div>
    );
  }
}
