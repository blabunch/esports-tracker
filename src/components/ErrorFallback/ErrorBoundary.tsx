import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  // Цей метод ловить помилку і оновлює стан
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Цей метод можна використовувати для відправки логів на сервер
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const showDetails = import.meta.env.DEV;

      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: 'center', backgroundColor: '#09090b', color: '#fff', textAlign: 'center', padding: '20px',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <h1 style={{ color: '#ff4655', fontSize: '48px', marginBottom: '16px' }}>Oops, something broke 🫠</h1>
          <p style={{ color: '#a1a1aa', fontSize: '18px', marginBottom: '24px' }}>
            We are aware of this issue. For now, try refreshing the page.
          </p>
          {showDetails && (
            <pre style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', color: '#ffb3b8', maxWidth: '600px', overflowX: 'auto', marginBottom: '24px' }}>
              {this.state.error?.message}
            </pre>
          )}
          <button 
            onClick={this.resetErrorBoundary}
            style={{
              padding: '12px 24px', background: '#fff', color: '#000', border: 'none', 
              borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
