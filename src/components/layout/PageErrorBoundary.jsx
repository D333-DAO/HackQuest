import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Page error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message || 'An unexpected error occurred on this page.'}
          </p>
          <Link
            to="/Dashboard"
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Go to Dashboard
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;