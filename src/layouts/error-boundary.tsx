import type { ErrorInfo } from 'react';
import React from 'react';
import ErrorResult from './error-result';

class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean; errorInfo: string }
> {
  state = { hasError: false, errorInfo: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service

    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <ErrorResult extra={this.state.errorInfo} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
