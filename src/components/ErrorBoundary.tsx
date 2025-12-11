// Error Boundary component to catch React errors
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          background: '#2a1a1a',
          color: '#ff6b6b',
          borderRadius: '8px',
          margin: '20px',
          border: '2px solid #ff6b6b'
        }}>
          <h2 style={{ marginTop: 0 }}>⚠️ Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
              Error Details (click to expand)
            </summary>
            <div style={{
              background: '#1a1a1a',
              padding: '15px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              <p><strong>Error:</strong> {this.state.error?.toString()}</p>
              <p><strong>Stack:</strong></p>
              <pre>{this.state.error?.stack}</pre>
              {this.state.errorInfo && (
                <>
                  <p><strong>Component Stack:</strong></p>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
