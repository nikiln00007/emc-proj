import React from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PeerHub Runtime Catch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl mb-4 shadow-sm">
            ⚠️
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Something unexpected happened</h2>
          <p className="text-gray-500 max-w-md mb-6 text-sm">
            {this.state.error?.message || 'The page encountered a temporary issue while rendering.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="btn-primary text-sm px-5 py-2.5"
            >
              🔄 Refresh Page
            </button>
            <a href="/home" className="btn-secondary text-sm px-5 py-2.5">
              🏠 Go to Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
