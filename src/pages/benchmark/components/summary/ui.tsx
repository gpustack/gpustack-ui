import { SectionTitle } from '@gpustack/core-ui';
import { createStyles } from 'antd-style';
import React from 'react';
import { BenchmarkResultItem } from '../../config/types';

// ── Unified design language for the Summary tab ────────────────────────────
// One semantic palette, applied everywhere (badge, chart markers, row
// highlight) so the page reads with a single visual grammar:
//   blue = recommended / selected   green = peak / SLO met
//   red = request overload / SLO broken   amber = throughput decline

export type StageStatusKind =
  | 'recommended'
  | 'peak'
  | 'overloaded'
  | 'declining'
  | 'ok';

interface DetailLike {
  recommended_rate?: number | null;
  peak_rate?: number | null;
}

// A stage's verdict, derived once and reused by the table + the chart markers.
export const getStageStatus = (
  r: BenchmarkResultItem,
  detail?: DetailLike,
  maxThroughput?: number
): StageStatusKind => {
  const rate = r.rate;
  // Request overload and post-peak throughput loss are different findings. A
  // throughput decline can still meet every SLO target with all requests passing.
  // A few incomplete requests at a duration boundary do not establish overload.
  const failedCount = (r.request_errored ?? 0) + (r.request_incomplete ?? 0);
  const total = r.request_total ?? (r.request_successful ?? 0) + failedCount;
  const failRate = total > 0 ? failedCount / total : 0;
  if (failRate > 0.05) return 'overloaded';

  const throughput = r.tokens_per_second_mean;
  const peakRate = detail?.peak_rate;
  if (
    typeof rate === 'number' &&
    Number.isFinite(rate) &&
    typeof peakRate === 'number' &&
    Number.isFinite(peakRate) &&
    rate > peakRate &&
    typeof throughput === 'number' &&
    Number.isFinite(throughput) &&
    throughput >= 0 &&
    typeof maxThroughput === 'number' &&
    Number.isFinite(maxThroughput) &&
    maxThroughput > 0 &&
    throughput < maxThroughput * 0.95
  ) {
    return 'declining';
  }
  return 'ok';
};

export const statusLabelId: Record<StageStatusKind, string> = {
  recommended: 'benchmark.detail.status.recommended',
  peak: 'benchmark.detail.status.peak',
  overloaded: 'benchmark.detail.status.overloaded',
  declining: 'benchmark.detail.status.declining',
  ok: 'benchmark.detail.status.healthy'
};

// One glyph per status, matching the chart markers (⭐ recommended · ▲ peak ·
// ✕ overloaded · ↘ throughput decline) so every view keeps the same meaning.
const statusGlyph: Record<StageStatusKind, string> = {
  recommended: '⭐',
  peak: '▲',
  overloaded: '✕',
  declining: '↘',
  ok: '•'
};

// One class per verdict rather than a colour pair interpolated into the
// template: the palette stays declarative and `cx` picks the one that applies.
const tagKindClass = {
  recommended: 'tagRecommended',
  peak: 'tagPeak',
  overloaded: 'tagOverloaded',
  declining: 'tagDeclining',
  ok: 'tagOk'
} as const;

const useStyles = createStyles(({ css }) => ({
  tag: css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 1px 9px;
    border-radius: 10px;
    .glyph {
      font-size: 11px;
      line-height: 1;
    }
  `,
  tagRecommended: css`
    color: var(--ant-color-primary);
    background: var(--ant-color-primary-bg);
  `,
  tagPeak: css`
    color: var(--color-status-success-text);
    background: var(--ant-color-success-bg);
  `,
  tagOverloaded: css`
    color: var(--color-status-error-text);
    background: var(--ant-color-error-bg);
  `,
  tagDeclining: css`
    color: var(--ant-color-warning-text);
    background: var(--ant-color-warning-bg);
  `,
  tagOk: css`
    color: var(--ant-color-text-tertiary);
    background: var(--ant-color-fill-quaternary);
  `,
  // Section titles come from core-ui's `SectionTitle` (re-exported below), so
  // the local `sectionTitle` class that used to live here is gone.
  // Hairline separator between major sections (flat layout, no boxes).
  sectionRule: css`
    border-top: 1px solid var(--ant-color-border-secondary);
  `,
  panel: css`
    background: var(--ant-color-bg-container);
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: var(--ant-border-radius);
    overflow: hidden;
    .panel-head {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 14px 20px;
    }
    .panel-head.divided {
      border-bottom: 1px solid var(--ant-color-border-secondary);
    }
    .panel-head .sub {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
    }
    .panel-head .spacer {
      flex: 1;
    }
    .panel-body {
      padding: 4px 16px 14px;
    }
    .panel-body.flush {
      padding: 0;
    }
  `,
  // Monospace pill carrying the selected stage's load value.
  loadChip: css`
    font-size: 12px;
    font-weight: 600;
    color: var(--ant-color-primary);
    background: var(--ant-color-primary-bg);
    border: 1px solid var(--ant-color-primary-border);
    border-radius: 6px;
    padding: 1px 8px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  `
}));

// The single status badge used across the page.
export const StatusTag: React.FC<{
  kind: StageStatusKind;
  label: string;
}> = ({ kind, label }) => {
  const { styles, cx } = useStyles();
  return (
    <span className={cx(styles.tag, styles[tagKindClass[kind]])}>
      <span className="glyph">{statusGlyph[kind]}</span>
      {label}
    </span>
  );
};

// Re-exported from core-ui rather than defined here: this local copy was
// character-for-character the shared one (14px / 500 / text / 12px below), and
// having two of them is how the product ended up with group titles that
// differed page to page. Re-exporting keeps every call site in this tab
// unchanged.
export { SectionTitle };

export const SectionRule: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.sectionRule, className)} {...rest} />;
};

/**
 * One report section = one card. Every block on the page (hero band, load sweep,
 * detailed metrics, stage table, stage detail) is a Panel, so the page
 * reads as a stack of sections instead of a run-on column separated by hairlines.
 *
 * Slots:
 *   .panel-head          title row; add `divided` when content below is a table
 *                        that runs to the card edges
 *   .panel-head .sub     the one-line explanation next to the title
 *   .panel-head .spacer  pushes the trailing controls right
 *   .panel-body          padded content; add `flush` for edge-to-edge tables
 */
export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.panel, className)} {...rest} />;
};

export const LoadChip: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  className,
  ...rest
}) => {
  const { styles, cx } = useStyles();
  return <span className={cx(styles.loadChip, className)} {...rest} />;
};
