import { useIntl } from '@umijs/max';
import { Flex, Popover, Progress, Space, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import {
  AcceleratorGaugeItem,
  GaugeKey,
  GaugeState,
  GaugeValues
} from '../config/types';
import styles from '../styles/utilization-cell.module.less';

const GAUGE_SIZE = 50;

// A gauge with no entry in the map has never had data, or was reset when the
// instance stopped being polled.
const NO_DATA: GaugeState = { percent: null };

// Every gauge the cell can render, in display order. acceleratorOnly gauges
// render only for rows whose instance type is acceleratable.
const GAUGE_DEFINITIONS: {
  key: GaugeKey;
  labelId: string;
  acceleratorOnly?: boolean;
}[] = [
  {
    key: 'gpu',
    labelId: 'gpuservice.instance.utilization.gpu',
    acceleratorOnly: true
  },
  {
    key: 'vram',
    labelId: 'gpuservice.instance.utilization.vram',
    acceleratorOnly: true
  },
  { key: 'cpu', labelId: 'gpuservice.instance.utilization.cpu' },
  { key: 'memory', labelId: 'gpuservice.instance.utilization.memory' },
  { key: 'storage', labelId: 'gpuservice.instance.utilization.storage' }
];

// Threshold stroke colors, same cutoffs as the cluster system-load card.
const getStrokeColor = (percent: number) => {
  if (percent <= 50) {
    return 'var(--ant-color-success)';
  }
  if (percent <= 80) {
    return 'var(--ant-color-warning)';
  }
  return 'var(--ant-color-error)';
};

const formatMiB = (value: number) =>
  value >= 1024 ? `${_.round(value / 1024, 1)} GiB` : `${value} MiB`;

// Hover tooltip: the exact used/total behind the gauge. GPU core utilization
// has no absolute figure in the subresource, so it shows the percent itself.
const gaugeTooltip = (key: GaugeKey, label: string, state: GaugeState) => {
  if (state.percent === null) {
    return label;
  }
  if (key === 'gpu') {
    return `${label}: ${_.round(state.percent, 1)}%`;
  }
  if (state.used === undefined || !state.total) {
    return label;
  }
  if (key === 'cpu') {
    return `${label}: ${_.round(state.used / 1000, 2)} / ${_.round(state.total / 1000, 2)} cores`;
  }
  return `${label}: ${formatMiB(state.used)} / ${formatMiB(state.total)}`;
};

// One circular gauge with its percent (or "--") at the center.
const GaugeRing: React.FC<{ percent: number | null }> = ({ percent }) => (
  <Progress
    type="circle"
    size={GAUGE_SIZE}
    strokeWidth={8}
    percent={percent ?? 0}
    strokeColor={percent === null ? undefined : getStrokeColor(percent)}
    format={() => (
      <span className={styles.percent}>
        {percent === null ? '--' : `${percent}%`}
      </span>
    )}
  />
);

// Multi-card hover content: one short bar per accelerator — the card's index in
// the instance's accelerator list tags the row, the bar and its figures sit
// inline, so everything is visible without a second hover. VRAM rows append the
// exact used/total; GPU rows have no absolute figure in the subresource, so the
// percent stands alone.
const PerCardBars: React.FC<{
  gaugeKey: GaugeKey;
  items: AcceleratorGaugeItem[];
}> = ({ gaugeKey, items }) => (
  <span
    className={`${styles.cardGrid} ${items.length > 2 ? styles.cardGridSplit : ''}`}
  >
    {items.map((item) => {
      const percent = _.clamp(_.round(item.percent), 0, 100);
      return (
        <Flex key={item.index} align="center" gap={8}>
          <span className={styles.cardIndex}>{item.index}</span>
          <Progress
            type="line"
            size={{ width: 80, height: 6 }}
            percent={percent}
            strokeColor={getStrokeColor(percent)}
            format={(p) => <span className={styles.cardPercent}>{p}%</span>}
          />
          {gaugeKey === 'vram' && item.used !== undefined && !!item.total && (
            <span className={styles.cardFigures}>
              {formatMiB(item.used)} / {formatMiB(item.total)}
            </span>
          )}
        </Flex>
      );
    })}
  </span>
);

/**
 * Utilization cell for the GPU Instances list: small circular gauges for GPU /
 * VRAM / CPU / RAM / Storage. Pure presentation — the figures are polled for
 * the whole page by use-query-instance-metrics, so this renders whatever the
 * map currently holds for the row and nothing more: a gauge with no data shows
 * "--", which is also what a stopped row falls back to once it drops out of the
 * poll set. Rows whose instance type has no accelerator render only the CPU /
 * RAM / Storage gauges; on multi-card rows the GPU / VRAM gauge aggregates the
 * cards and its hover popover breaks out one bar per card.
 *
 * Memoized on purpose: a page-wide commit hands every row a new `values`
 * reference only for the instances that actually changed, so the rest of the
 * table's gauges skip re-rendering.
 */
const UtilizationCell: React.FC<{
  values?: GaugeValues;
  hasAccelerators: boolean;
}> = ({ values, hasAccelerators }) => {
  const intl = useIntl();
  const gauges = GAUGE_DEFINITIONS.filter(
    (definition) => !definition.acceleratorOnly || hasAccelerators
  );

  return (
    <Space size="middle">
      {gauges.map(({ key, labelId }) => {
        const label = intl.formatMessage({ id: labelId });
        const state = values?.[key] ?? NO_DATA;
        // Displayed percent is clamped to [0, 100] — the source may exceed 100.
        const percent =
          state.percent === null
            ? null
            : _.clamp(_.round(state.percent), 0, 100);
        const gauge = (
          <Flex vertical align="center" gap={2}>
            <GaugeRing percent={percent} />
            <span className={styles.label}>{label}</span>
          </Flex>
        );
        // Multi-card row: the merged gauge's hover breaks out one bar per card
        // instead of the single exact-value tooltip.
        if (
          (key === 'gpu' || key === 'vram') &&
          (state.items?.length ?? 0) > 1
        ) {
          return (
            <Popover
              key={key}
              content={
                <PerCardBars
                  gaugeKey={key}
                  items={state.items as AcceleratorGaugeItem[]}
                />
              }
            >
              {gauge}
            </Popover>
          );
        }
        return (
          <Tooltip key={key} title={gaugeTooltip(key, label, state)}>
            {gauge}
          </Tooltip>
        );
      })}
    </Space>
  );
};

export default React.memo(UtilizationCell);
