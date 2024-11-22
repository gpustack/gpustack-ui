import { Component } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<
  { children?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: any) {
    console.error('Error caught by Error Boundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Error caught by Error Boundary:', error);
    console.error(info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
