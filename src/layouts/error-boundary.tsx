import { cleanupBustParam, recoverStaleAssets } from '@/utils/asset-recovery';
import type { ErrorInfo } from 'react';
import React from 'react';
import ErrorResult, { isChunkLoadError } from './error-result';

class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean; errorInfo: string; recovering: boolean }
> {
  state = { hasError: false, errorInfo: '', recovering: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidMount() {
    // Reaching mount is the "booted fine" signal: whatever a recovery reload left in the
    // address bar has served its purpose and should not outlive the boot it fixed.
    cleanupBustParam();
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.log(error, errorInfo);

    // A chunk that 404s after a release is recoverable by reloading, and nothing is lost
    // by doing it: this subtree is already gone. Suppress the error UI while the reload
    // lands, or the user reads an error they never needed to see on its way out. When the
    // one-attempt guard is spent, `recoverStaleAssets` returns false and ErrorResult takes
    // over with the message and a manual Reload button.
    if (isChunkLoadError(error?.message) && recoverStaleAssets(error.message)) {
      this.setState({ recovering: true });
    }
  }

  render() {
    if (this.state.recovering) {
      return null;
    }
    if (this.state.hasError) {
      return <ErrorResult extra={this.state.errorInfo} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
