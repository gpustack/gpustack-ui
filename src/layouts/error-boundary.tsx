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

  // 捕获错误并更新状态
  static getDerivedStateFromError(error: any) {
    console.error('Error caught by Error Boundary:', error);
    return { hasError: true };
  }

  // 记录错误信息（可选）
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
