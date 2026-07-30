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
    // The handoff. Until now an inline snippet has been watching for failed asset loads,
    // because before React mounts there is nothing else to catch them. From here on that
    // listener would also fire for a route prefetch — which `routePrefetch: 'intent'` can
    // trigger from a mouse passing over a menu item — and reloading the page because of a
    // hover is indefensible. So it stands down, and this boundary becomes the only path
    // to a reload: it fires from a real render, i.e. a navigation the user chose.
    // Reaching mount is also the "booted fine" signal that strips `?_r=` from the URL.
    window.__assetRecovery__?.disarm();
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.log(error, errorInfo);

    // A chunk that 404s after a release is recoverable by reloading, and nothing is lost
    // by doing it: this subtree is already gone. Suppress the error UI while the reload
    // lands, or the user reads an error they never needed to see on its way out. When the
    // one-attempt guard is spent, `recover` returns false and ErrorResult takes over with
    // the message and a manual Reload button.
    if (
      isChunkLoadError(error?.message) &&
      window.__assetRecovery__?.recover(error.message)
    ) {
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
