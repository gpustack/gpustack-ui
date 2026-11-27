import { createStyles } from 'antd-style';

// Deployment summaries share one visual scale, including wrapped explanations.
export default createStyles(({ css }) => ({
  card: css`
    height: 100%;
    min-width: 0;
    padding: var(--ant-padding-sm) var(--ant-padding);
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-lg);
    background: var(--ant-color-bg-container);
    font-size: var(--ant-font-size);
    line-height: var(--ant-line-height);
  `,
  labelRow: css`
    min-height: 28px;
  `,
  labelMain: css`
    min-width: 0;
    flex: 1;
  `,
  label: css`
    min-width: 0;
    color: var(--ant-color-text-secondary);
    overflow-wrap: anywhere;
  `,
  badge: css`
    margin-inline-start: 0;
    padding: 1px 8px;
    border-radius: var(--ant-border-radius);
    background: var(--ant-color-fill-secondary);
    color: var(--ant-color-text-secondary);
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    line-height: 20px;
    flex-shrink: 0;
    white-space: nowrap;
  `,
  value: css`
    margin-block: var(--ant-margin-xs);
    font-size: var(--ant-font-size-heading-3);
    font-weight: 600;
    line-height: 28px;
    font-variant-numeric: tabular-nums;

    [data-pd-performance] & {
      font-size: clamp(
        var(--ant-font-size-heading-4),
        1.5vw,
        var(--ant-font-size-heading-3)
      );
    }
  `,
  unit: css`
    margin-inline-start: var(--ant-margin-xxs);
    font-size: var(--ant-font-size);
  `,
  note: css`
    max-height: 2lh;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: var(--ant-color-text-secondary);
    overflow-wrap: anywhere;
  `
}));
