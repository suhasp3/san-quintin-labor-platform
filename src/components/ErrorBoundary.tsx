import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to ensure clean state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Always render a simple fallback that doesn't depend on external components
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 text-red-600">⚠️</div>
              <h1 className="text-xl font-bold text-red-800">Something went wrong</h1>
            </div>
            <p className="text-gray-600">
              An unexpected error occurred. The page couldn't load properly.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-lg bg-gray-100 p-3 text-sm">
                <p className="font-mono text-xs text-gray-800 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-600">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 text-gray-800">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/jobs'}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Wrap children in try-catch to prevent render errors from crashing
    try {
      return this.props.children;
    } catch (renderError) {
      console.error('Error rendering children in ErrorBoundary:', renderError);
      this.setState({
        hasError: true,
        error: renderError instanceof Error ? renderError : new Error(String(renderError)),
        errorInfo: null,
      });
      return null; // Will trigger re-render with error state
    }
  }
}

export default ErrorBoundary;

