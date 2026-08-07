import { createStyles } from 'antd-style';
import React from 'react';
import { BenchmarkResultItem } from '../../config/types';

// ── Unified design language for the Summary tab ────────────────────────────
// One semantic palette, applied everywhere (badge, chart markers, row
// highlight) so the page reads with a single visual grammar:
//   blue = recommended / selected   green = peak / SLA met
//   red  = overloaded / SLA broken   gray = secondary

export type StageStatusKind = 'recommended' | 'peak' | 'overloaded' | 'ok';

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
  const recRate = detail?.recommended_rate;
  if (rate != null && recRate != null && rate === recRate) {
    return 'recommended';
  }
  // "Overloaded" = a meaningful share of requests failed / didn't finish, OR the
  // point sits on the DECLINING side of the curve: past the peak rate AND
  // delivering meaningfully less throughput than the peak. Being merely past the
  // recommended knee at ~peak throughput with no failures is NOT overload — the
  // point one step above the knee is often the true throughput argmax. A couple of
  // incomplete requests at the max_seconds boundary (common at low rates) is
  // normal, so gate on a failure RATE (>5%) rather than any single failure.
  const failedCount = (r.request_errored ?? 0) + (r.request_incomplete ?? 0);
  const total = r.request_total ?? (r.request_successful ?? 0) + failedCount;
  const failRate = total > 0 ? failedCount / total : 0;
  const throughput = r.tokens_per_second_mean ?? 0;
  const pastPeak = detail?.peak_rate != null && (rate ?? 0) > detail.peak_rate;
  const declining =
    pastPeak &&
    maxThroughput != null &&
    maxThroughput > 0 &&
    throughput < maxThroughput * 0.95;
  if (failRate > 0.05 || declining) {
    return 'overloaded';
  }
  return 'ok';
};

export const statusLabelId: Record<StageStatusKind, string> = {
  recommended: 'benchmark.detail.status.recommended',
  peak: 'benchmark.detail.status.peak',
  overloaded: 'benchmark.detail.status.overloaded',
  ok: 'benchmark.detail.status.healthy'
};

// One glyph per status, matching the chart markers (⭐ recommended · ▲ peak ·
// ✕ overloaded) so the badge and the chart speak the same language.
const statusGlyph: Record<StageStatusKind, string> = {
  recommended: '⭐',
  peak: '▲',
  overloaded: '✕',
  ok: '•'
};

// One class per verdict rather than a colour pair interpolated into the
// template: the palette stays declarative and `cx` picks the one that applies.
const tagKindClass = {
  recommended: 'tagRecommended',
  peak: 'tagPeak',
  overloaded: 'tagOverloaded',
  ok: 'tagOk'
} as const;

const useStyles = createStyles(({ css }) => ({
  tag: css`
    display: inline-flex;
    align-items: center;
    gap: 5px;
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
    color: var(--ant-color-success);
    background: var(--ant-color-success-bg);
  `,
  tagOverloaded: css`
    color: var(--ant-color-error);
    background: var(--ant-color-error-bg);
  `,
  tagOk: css`
    color: var(--ant-color-text-tertiary);
    background: var(--ant-color-fill-quaternary);
  `,
  // Type scale — the page uses exactly four sizes: 40 (hero) · 16 (section) ·
  // 14 (metric) · 12 (label). sectionTitle is the 16.
  sectionTitle: css`
    font-size: 16px;
    font-weight: 600;
    color: var(--ant-color-text);
    margin-bottom: 12px;
  `,
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

// The four layout primitives keep their component API — they are consumed as
// elements across the tab, so wrapping the class in a component leaves every
// call site (and its `style` / `className` passthrough) untouched.
export const SectionTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.sectionTitle, className)} {...rest} />;
};

export const SectionRule: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.sectionRule, className)} {...rest} />;
};

/**
 * One report section = one card. Every block on the page (hero band, operating
 * curve, detailed metrics, stage table, stage detail) is a Panel, so the page
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
