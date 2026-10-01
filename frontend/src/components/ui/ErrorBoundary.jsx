import React from 'react';

/**
 * Catches render-time crashes (most often a hook used outside its provider) and
 * shows the error instead of leaving the user staring at a blank page.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: '#050505', color: '#fff', fontFamily: 'var(--font)',
      }}>
        <div style={{ maxWidth: '560px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px' }}>
            Something broke on this screen
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 16px' }}>
            Reload the page to continue. If it keeps happening, the details below help pin it down.
          </p>
          <pre style={{
            background: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px',
            padding: '14px', fontSize: '0.75rem', color: '#f87171',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '40vh', overflow: 'auto',
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
