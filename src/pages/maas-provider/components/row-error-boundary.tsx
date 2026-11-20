import { useIntl } from '@umijs/max';
import React from 'react';

interface RowErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage: string;
  // Changes when the underlying record is re-fetched (id + updated_at, fed
  // through onRow) — a changed value re-arms the boundary so a row that failed
  // before the data was fixed renders again instead of staying stuck on the
  // fallback until a full remount.
  resetKey?: string | number | null;
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

  componentDidUpdate(prevProps: RowErrorBoundaryProps) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
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
  // antd merges onRow() props into the row element props; data-reset-key
  // carries the record's id + updated_at for the reset logic above.
  const resetKey = (rest as Record<string, unknown>)['data-reset-key'] as
    | string
    | number
    | null
    | undefined;
  return (
    <RowErrorBoundary
      fallbackMessage={intl.formatMessage({
        id: 'providers.row.renderError',
        defaultMessage: 'This item could not be rendered.'
      })}
      resetKey={resetKey}
    >
      <tr {...rest}>{children}</tr>
    </RowErrorBoundary>
  );
};

export { RowErrorBoundary };
export default BoundaryRow;
