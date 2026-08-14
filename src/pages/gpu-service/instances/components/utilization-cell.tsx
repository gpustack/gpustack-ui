import HalfArcGauge from '@/pages/_components/half-arc-gauge';
import { useIntl } from '@umijs/max';
import { Flex, Popover, Progress, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import { AcceleratorGaugeKeys, GaugeLabelIdMap } from '../config';
import {
  AcceleratorGaugeItem,
  GaugeKey,
  GaugeState,
  GaugeValues
} from '../config/types';
import styles from '../styles/utilization-cell.module.less';

const GAUGE_SIZE = 50;
const GAUGE_STROKE = 2;

// A gauge with no entry in the map has never had data, or was reset when the
// instance stopped being polled.
const NO_DATA: GaugeState = { percent: null };

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
 * One Utilization cell — the half-ring gauge for a single resource. There is a
 * column per gauge, so the header carries the resource name and the cell holds
 * nothing but the ring: no label repeated down every row, and every row's
 * reading for a given resource lands at the same x.
 *
 * Pure presentation: the figures are polled for the whole page by
 * use-query-instance-metrics, so this renders whatever the map currently holds
 * for the row and nothing more. No data shows "--", which is also where a
 * stopped row lands once it drops out of the poll set; on a multi-card row the
 * GPU / VRAM gauge aggregates the cards and its hover popover breaks out one
 * bar per card.
 *
 * Three ways a cell says "no figure", and they mean different things:
 *   - "N/A": the instance type has no accelerator, so a GPU / VRAM reading does
 *     not apply to this row at all — the same wording the workers table uses for
 *     a resource a row cannot report;
 *   - a single "-": the row's phase has no Pod behind it (stopped, stopping,
 *     still initializing), so no sample is coming — an empty ring would frame a
 *     reading that will never arrive;
 *   - "--" inside a ring: the row IS being polled and has not answered yet.
 *
 * Memoized on purpose: a page-wide commit hands every row a new `values`
 * reference only for the instances that actually changed, so the rest of the
 * table's gauges skip re-rendering.
 */
const UtilizationCell: React.FC<{
  gaugeKey: GaugeKey;
  values?: GaugeValues;
  hasAccelerators: boolean;
  // Whether the row's phase can produce a sample at all. A boolean rather than
  // the record itself, so the memo holds.
  measurable: boolean;
}> = ({ gaugeKey, values, hasAccelerators, measurable }) => {
  const intl = useIntl();

  const isAcceleratorGauge = _.includes(AcceleratorGaugeKeys, gaugeKey);

  if (isAcceleratorGauge && !hasAccelerators) {
    return <span className={styles.notApplicable}>N/A</span>;
  }

  if (!measurable) {
    return <span className={styles.noData}>-</span>;
  }

  const label = intl.formatMessage({ id: GaugeLabelIdMap[gaugeKey] });
  const state = values?.[gaugeKey] ?? NO_DATA;
  // Displayed percent is clamped to [0, 100] — the source may exceed 100.
  const percent =
    state.percent === null ? null : _.clamp(_.round(state.percent), 0, 100);
  // Multi-card row: the gauge merges the cards, so its hover breaks them out
  // one bar each instead of showing a single exact value, and its percent gets
  // the dashed underline that marks "there is more behind this" across the app.
  const hasBreakdown = isAcceleratorGauge && (state.items?.length ?? 0) > 1;
  // The span is what Tooltip / Popover attach to: HalfArcGauge is a plain
  // function component, so it takes no ref of its own.
  const gauge = (
    <span className={styles.gauge}>
      <HalfArcGauge
        percent={percent}
        color={percent === null ? undefined : getStrokeColor(percent)}
        size={GAUGE_SIZE}
        strokeWidth={GAUGE_STROKE}
        dashedUnderline={hasBreakdown}
      />
    </span>
  );

  if (hasBreakdown) {
    return (
      <Popover
        content={
          <PerCardBars
            gaugeKey={gaugeKey}
            items={state.items as AcceleratorGaugeItem[]}
          />
        }
      >
        {gauge}
      </Popover>
    );
  }

  return (
    <Tooltip title={gaugeTooltip(gaugeKey, label, state)}>{gauge}</Tooltip>
  );
};

export default React.memo(UtilizationCell);
