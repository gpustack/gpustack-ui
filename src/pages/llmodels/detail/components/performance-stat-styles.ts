import { createStyles } from 'antd-style';

// Deployment summaries share one visual scale, including wrapped explanations.
export default createStyles(({ css }) => ({
  card: css`
    height: 100%;
    min-width: 0;
    padding: var(--ant-padding-sm) var(--ant-padding);
    border-radius: var(--ant-border-radius);
    background: var(--ant-color-fill-quaternary);
  `,
  labelRow: css`
    min-height: 32px;
  `,
  label: css`
    min-width: 0;
    color: var(--ant-color-text-secondary);
    font-size: var(--ant-font-size-sm);
    line-height: 16px;
    overflow-wrap: anywhere;
  `,
  value: css`
    margin-block: var(--ant-margin-xs);
    font-size: var(--ant-font-size-heading-3);
    font-weight: 600;
    line-height: 28px;
    font-variant-numeric: tabular-nums;

    @media (min-width: 1200px) and (max-width: 1279px) {
      [data-pd-performance] & {
        font-size: var(--ant-font-size-heading-4);
      }
    }
  `,
  note: css`
    min-height: 32px;
    max-height: 32px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: var(--ant-color-text-tertiary);
    font-size: var(--ant-font-size-sm);
    line-height: 16px;
    overflow-wrap: anywhere;
  `
}));
