import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#08090C',
          color: '#F8FAFC',
          minHeight: '100vh',
          padding: '40px 20px',
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#111218',
            border: '1px solid #EE1D36',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 0 30px rgba(238,29,54,0.2)'
          }}>
            <h2 style={{ color: '#EE1D36', margin: '0 0 12px', fontSize: '20px', fontWeight: 'bold' }}>
              ⚠️ Application Render Error
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 16px' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            <pre style={{
              backgroundColor: '#08090C',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '11px',
              overflowX: 'auto',
              color: '#F87171'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                marginTop: '16px',
                backgroundColor: '#EE1D36',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reset Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
