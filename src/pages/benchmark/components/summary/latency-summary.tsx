import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import {
  StageLatencyMetric,
  stageLatencyValue
} from '../../utils/stage-detail-metrics';
import { StagePoint } from './metrics';

const useStyles = createStyles(({ css }) => ({
  group: css`
    min-width: 0;
    font-size: 12px;
    .metric-label {
      color: var(--ant-color-text-secondary);
      font-weight: 500;
      line-height: 20px;
      margin-bottom: var(--ant-margin-xs);
    }
    .metric-unit {
      color: var(--ant-color-text-secondary);
      font-weight: 400;
    }
    .aggregation-stats {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      width: max-content;
      gap: 4px;
      max-width: 168px;
    }
    .statistic-label {
      flex: 0 0 36px;
      line-height: 22px;
      color: var(--ant-color-text-secondary);
    }
    .statistic-value {
      flex: none;
      margin-left: auto;
      text-align: right;
      white-space: nowrap;
      color: var(--ant-color-text);
      font-size: 14px;
      line-height: 22px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .configured {
      font-weight: 600;
    }
    .configured .statistic-label {
      color: var(--ant-color-text-secondary);
    }
    .configured .statistic-value {
      font-weight: 600;
    }
    .target-marker {
      color: var(--ant-color-primary);
    }
  `
}));

const LatencySummary: React.FC<{
  point: StagePoint;
  metric: StageLatencyMetric;
}> = ({ point, metric }) => {
  const { styles } = useStyles();
  const { detailData } = useDetailContext();
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const label =
    metric === 'itl' ? 'ITL' : t(`benchmark.form.slo.metric.${metric}`);

  return (
    <Flex
      vertical
      gap={2}
      className={styles.group}
      data-latency-metric={metric}
    >
      <span className="metric-label">
        {label} <span className="metric-unit">(ms)</span>
      </span>
      <div className="aggregation-stats">
        {(['avg', 'p95', 'p99'] as const).map((aggregation) => {
          const value = stageLatencyValue(
            point.raw,
            metric,
            aggregation === 'avg' ? 'mean' : aggregation
          );
          const ms =
            value == null ? null : value * (metric === 'latency' ? 1000 : 1);
          const threshold = (
            detailData as unknown as Record<string, unknown>
          )?.[`slo_${aggregation}_${metric}_ms`];
          const configured = typeof threshold === 'number';
          const aggregationLabel = t(`benchmark.form.slo.agg.${aggregation}`);
          return (
            <Tooltip
              key={aggregation}
              title={
                configured
                  ? `${label} ${aggregationLabel} ≤ ${threshold} ms`
                  : undefined
              }
              trigger={['hover', 'focus']}
            >
              <Flex
                align="baseline"
                gap={8}
                className={configured ? 'configured' : undefined}
                data-aggregation={aggregation}
                data-slo-target={String(configured)}
                tabIndex={configured ? 0 : undefined}
              >
                <span className="statistic-label">
                  {aggregationLabel}
                  {configured && (
                    <span className="target-marker" aria-hidden="true">
                      {' '}
                      •
                    </span>
                  )}
                </span>
                <span className="statistic-value">
                  {ms == null
                    ? '-'
                    : round(ms, Math.abs(ms) < 10 ? 2 : 0).toLocaleString()}
                </span>
              </Flex>
            </Tooltip>
          );
        })}
      </div>
    </Flex>
  );
};

export default LatencySummary;
