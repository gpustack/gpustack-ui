import { useIntl } from '@umijs/max';
import { Alert, Button, Flex } from 'antd';
import React from 'react';
import type { UsageExportEstimate } from '../config/types';

/**
 * What each remedy does when clicked. The dialog owns the filter state, so it
 * supplies the handlers; this component only decides what to offer and how to
 * label it.
 */
export interface ExportSuggestionHandlers {
  onShortenRange?: (maxDays: number) => void;
  onSplitExport?: (parts: number) => void;
}

interface ExportSuggestionState {
  // A split download is in flight. Without this the button stays live and
  // every impatient click fires another full export — the server ends up
  // running N identical multi-part queries and the user gets N downloads.
  exporting?: boolean;
  // A re-estimate is in flight. Shortening again before the new numbers land
  // would compute the next window off a stale row count.
  estimating?: boolean;
}

/**
 * Render an over-limit estimate as actions rather than prose.
 *
 * "Narrow the date range" is correct and useless: the user still has to work
 * out how far. The server already computed the answer — how many days fit, how
 * many files a split would take — so every remedy here is one click, not a
 * research task.
 *
 * Both remedies are LOSSLESS: they change how the rows are delivered, never
 * which rows exist. A third option (switch to month buckets) was dropped for
 * exactly that reason — it collapses 30 daily rows into one, which is a
 * different export, not a smaller one.
 */
const ExportSuggestions: React.FC<
  { estimate: UsageExportEstimate | null } & ExportSuggestionHandlers &
    ExportSuggestionState
> = ({ estimate, onShortenRange, onSplitExport, exporting, estimating }) => {
  const intl = useIntl();
  const busy = !!exporting || !!estimating;
  if (!estimate?.exceeds_hard_limit) {
    return null;
  }

  const actions = (estimate.suggestions || [])
    .map((suggestion) => {
      switch (suggestion.action) {
        case 'shorten_range':
          if (!onShortenRange || !suggestion.max_days) return null;
          return (
            <Button
              key="shorten_range"
              size="small"
              disabled={busy}
              onClick={() => onShortenRange(suggestion.max_days!)}
            >
              {intl.formatMessage(
                { id: 'usage.export.suggest.shortenRange' },
                { days: suggestion.max_days }
              )}
            </Button>
          );
        case 'split_export':
          if (!onSplitExport || !suggestion.parts) return null;
          return (
            <Button
              key="split_export"
              size="small"
              type="primary"
              loading={exporting}
              disabled={busy}
              onClick={() => onSplitExport(suggestion.parts!)}
            >
              {intl.formatMessage(
                { id: 'usage.export.suggest.split' },
                { parts: suggestion.parts }
              )}
            </Button>
          );
        default:
          return null;
      }
    })
    .filter(Boolean);

  return (
    <Alert
      type="warning"
      showIcon
      message={intl.formatMessage(
        { id: 'usage.export.rowsExceeded' },
        {
          total: estimate.total,
          limit: estimate.hard_limit,
          days: estimate.suggested_max_days ?? 0
        }
      )}
      description={
        actions.length ? (
          <Flex gap={8} wrap>
            {actions}
          </Flex>
        ) : null
      }
    />
  );
};

export default ExportSuggestions;
