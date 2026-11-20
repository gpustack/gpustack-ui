import { useIntl } from '@umijs/max';
import React from 'react';

interface RowErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage: string;
}

interface RowErrorBoundaryState {
  failed: boolean;
}

// A single malformed provider record (e.g. one created via REST with
// api_tokens: []) must not unmount the whole Model Providers list — wrap each
// table row so a render error degrades only that row.
class RowErrorBoundary extends React.Component<
  RowErrorBoundaryProps,
  RowErrorBoundaryState
> {
  state: RowErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RowErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Provider row failed to render:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <tr>
          <td colSpan={99}>{this.props.fallbackMessage}</td>
        </tr>
      );
    }
    return this.props.children as JSX.Element;
  }
}

const BoundaryRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  ...rest
}) => {
  const intl = useIntl();
  return (
    <RowErrorBoundary
      fallbackMessage={intl.formatMessage({
        id: 'providers.row.renderError',
        defaultMessage: 'This item could not be rendered.'
      })}
    >
      <tr {...rest}>{children}</tr>
    </RowErrorBoundary>
  );
};

export default BoundaryRow;
