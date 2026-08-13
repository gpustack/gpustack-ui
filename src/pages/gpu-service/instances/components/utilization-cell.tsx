import { createAxiosToken, usePageVisibility } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Popover, Progress, Space, Tooltip } from 'antd';
import { CancelTokenSource } from 'axios';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { parseJsonSafe } from '../../utils';
import { queryGPUServiceInstanceMetrics } from '../apis';
import { InstanceStatusValueMap } from '../config';
import {
  InstanceMetricsSample,
  InstanceTypeSnapshotSpec,
  ListItem
} from '../config/types';

const POLL_INTERVAL = 15000;
const GAUGE_SIZE = 50;

type GaugeKey = 'gpu' | 'vram' | 'cpu' | 'memory' | 'storage';

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

// One accelerator's own figures behind a multi-card gpu/vram gauge.
interface AcceleratorGaugeItem {
  percent: number;
  used?: number;
  total?: number;
}

// percent: null = no data → the gauge renders "--". used/total carry the
// exact figures behind it for the hover tooltip. items holds the per-card
// breakdown for gpu/vram when the instance holds multiple accelerators: the
// cell gauge aggregates the cards (mean for GPU, summed used/total for
// VRAM), the hover popover shows one bar per card.
interface GaugeState {
  percent: number | null;
  used?: number;
  total?: number;
  items?: AcceleratorGaugeItem[];
}

type GaugeValues = Record<GaugeKey, GaugeState>;

const EMPTY_VALUES: GaugeValues = {
  gpu: { percent: null },
  vram: { percent: null },
  cpu: { percent: null },
  memory: { percent: null },
  storage: { percent: null }
};

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

const sumOf = (values: (number | undefined)[]): number | undefined => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? _.sum(nums) : undefined;
};

// Total is the instance's own declaration (always populated); Used is absent
// when its source is unavailable — in that case the gauge keeps its last value.
const usageGauge = (used?: number, total?: number): GaugeState | undefined => {
  if (typeof used !== 'number' || !total) {
    return undefined;
  }
  return { percent: (used / total) * 100, used, total };
};

// Derives only the gauges this sample actually carries: a field absent from a
// successful sample (e.g. storageUsedMiB under the metrics.k8s.io fallback, or
// the whole accelerators array) simply produces no entry, so the caller's merge
// leaves that gauge's last value untouched. gpu/vram also keep each card's own
// figures in `items` for the per-card hover popover; a card whose figure is
// unreadable (absent, not zero) is dropped from the breakdown.
const sampleToValues = (
  sample: InstanceMetricsSample
): Partial<GaugeValues> => {
  const accelerators = sample.accelerators ?? [];
  const gpuItems = accelerators
    .filter((a) => typeof a.coresUtilizationPercent === 'number')
    .map((a) => ({ percent: a.coresUtilizationPercent as number }));
  const vramItems = accelerators
    .filter((a) => typeof a.memoryUtilizationPercent === 'number')
    .map((a) => ({
      percent: a.memoryUtilizationPercent as number,
      used: a.memoryUsedMiB,
      total: a.memoryTotalMiB
    }));
  const vramUsed = sumOf(accelerators.map((a) => a.memoryUsedMiB));
  const vramTotal = sumOf(accelerators.map((a) => a.memoryTotalMiB));
  const entries: [GaugeKey, GaugeState | undefined][] = [
    [
      'gpu',
      gpuItems.length
        ? {
            percent: _.mean(gpuItems.map((i) => i.percent)),
            items: gpuItems
          }
        : undefined
    ],
    [
      'vram',
      vramItems.length
        ? {
            // Aggregate by summed used/total — a mean of per-card
            // percents misweights cards of different capacities. Fall
            // back to the mean when absolute figures are unreadable.
            percent:
              vramUsed !== undefined && vramTotal
                ? (vramUsed / vramTotal) * 100
                : _.mean(vramItems.map((i) => i.percent)),
            used: vramUsed,
            total: vramTotal,
            items: vramItems
          }
        : undefined
    ],
    ['cpu', usageGauge(sample.cpuUsedMilliCores, sample.cpuTotalMilliCores)],
    ['memory', usageGauge(sample.memoryUsedMiB, sample.memoryTotalMiB)],
    ['storage', usageGauge(sample.storageUsedMiB, sample.storageTotalMiB)]
  ];
  return Object.fromEntries(
    entries.filter(([, value]) => value !== undefined)
  ) as Partial<GaugeValues>;
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

const columnStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2
};

// One circular gauge with its percent (or "--") at the center.
const GaugeRing: React.FC<{
  percent: number | null;
  size: number;
  fontSize?: number;
}> = ({ percent, size, fontSize = 12 }) => (
  <Progress
    type="circle"
    size={size}
    strokeWidth={8}
    percent={percent ?? 0}
    strokeColor={percent === null ? undefined : getStrokeColor(percent)}
    format={() => (
      <span
        style={{
          fontSize,
          color: 'var(--ant-color-text-secondary)'
        }}
      >
        {percent === null ? '--' : `${percent}%`}
      </span>
    )}
  />
);

// Multi-card hover content: one short bar per accelerator — the card index
// tags the row, the bar and its figures sit inline, so everything is visible
// without a second hover. VRAM rows append the exact used/total; GPU rows
// have no absolute figure in the subresource, so the percent stands alone.
// Layout: up to 2 cards in a single column, more cards in two columns
// (4 cards → 2×2, 8 cards → 4 rows × 2 columns).
const PerCardBars: React.FC<{
  gaugeKey: GaugeKey;
  items: AcceleratorGaugeItem[];
}> = ({ gaugeKey, items }) => (
  <span
    style={{
      display: 'inline-grid',
      gridTemplateColumns: items.length > 2 ? 'repeat(2, auto)' : 'auto',
      columnGap: 24,
      rowGap: 8
    }}
  >
    {items.map((item, index) => {
      const percent = _.clamp(_.round(item.percent), 0, 100);
      return (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span
            style={{
              fontSize: 12,
              minWidth: 12,
              textAlign: 'right',
              color: 'var(--ant-color-text-tertiary)'
            }}
          >
            {index}
          </span>
          <Progress
            type="line"
            size={{ width: 80, height: 6 }}
            percent={percent}
            strokeColor={getStrokeColor(percent)}
            format={(p) => (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  minWidth: 34,
                  textAlign: 'left',
                  color: 'var(--ant-color-text-secondary)'
                }}
              >
                {p}%
              </span>
            )}
          />
          {gaugeKey === 'vram' && item.used !== undefined && !!item.total && (
            <span
              style={{
                fontSize: 11,
                whiteSpace: 'nowrap',
                color: 'var(--ant-color-text-tertiary)'
              }}
            >
              {formatMiB(item.used)} / {formatMiB(item.total)}
            </span>
          )}
        </span>
      );
    })}
  </span>
);

/**
 * Utilization cell for the GPU Instances list: small circular gauges fed by
 * the instance metrics subresource through the cluster proxy. Polls every 15s
 * while the row is Ready, pauses while the tab is hidden, keeps the last
 * successful values on any fetch failure, and renders "--" for a gauge that
 * has no data — including after the instance leaves Ready (Stopped rows show
 * no live utilization). Rows without allocated accelerators render only the
 * CPU / RAM / storage gauges; on multi-card rows the GPU / VRAM gauge
 * aggregates the cards and its hover popover breaks out one bar per card.
 */
const UtilizationCell: React.FC<{ record: ListItem }> = ({ record }) => {
  const intl = useIntl();
  const [values, setValues] = useState<GaugeValues>(EMPTY_VALUES);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const wasPollingRef = useRef(false);

  const name = record.name;
  const namespace = record.status?.namespace;
  const clusterID = record.clusterId;
  const isReady = record.status?.phase === InstanceStatusValueMap.Ready;

  // GPU / VRAM gauges belong to accelerated instance types only. The type
  // snapshot persisted in the row's description (the same source the Instance
  // Type column renders from) carries the type's `acceleratable` flag.
  const typeSnapshot = parseJsonSafe<{ spec?: InstanceTypeSnapshotSpec }>(
    record?.description || '{}',
    {}
  ).spec;
  const hasAccelerators = !!typeSnapshot?.acceleratable;

  // Without clusterID/namespace the proxy URL cannot be built — the row just
  // shows "--", no polling, no error.
  const canPoll = isReady && !!clusterID && !!namespace && !!name;

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchMetrics = useMemoizedFn(async () => {
    try {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const data = await queryGPUServiceInstanceMetrics(
        { namespace: namespace as string, name, clusterID },
        { token: axiosTokenRef.current.token }
      );
      // A missing sample (early-return without clusterID, empty payload) is
      // not a successful sample — keep the last values.
      if (!data?.sample) {
        return;
      }
      const next = sampleToValues(data.sample);
      setValues((prev) => ({ ...prev, ...next }));
    } catch {
      // Keep-last-data: network errors, proxy 503/404, timeouts all leave the
      // previous values untouched — no error UI, no error spam.
    }
  });

  const startPolling = useMemoizedFn(() => {
    stopPolling();
    fetchMetrics();
    pollingRef.current = setInterval(fetchMetrics, POLL_INTERVAL);
  });

  useEffect(() => {
    if (!canPoll) {
      // The phase left Ready (the row updates via the list's watch stream —
      // this cell only reacts to props): stop polling and reset the gauges to
      // "--" — a Stopped instance has no live utilization. Rows that were
      // never Ready keep their initial "--".
      if (wasPollingRef.current) {
        wasPollingRef.current = false;
        setValues(EMPTY_VALUES);
      }
      return undefined;
    }
    wasPollingRef.current = true;
    // Never start while the tab is hidden (fresh background tab, or a
    // Ready-flip while hidden): usePageVisibility resumes on visible.
    if (document.visibilityState !== 'hidden') {
      startPolling();
    }
    return () => {
      stopPolling();
      axiosTokenRef.current?.cancel();
    };
  }, [canPoll, name, namespace, clusterID, startPolling]);

  // Pause while the tab is hidden, resume (with an immediate refresh) on the
  // way back — same precedent as use-table-fetch.
  usePageVisibility({
    enabled: canPoll,
    onHidden: stopPolling,
    onVisible: startPolling
  });

  const gauges = GAUGE_DEFINITIONS.filter(
    (definition) => !definition.acceleratorOnly || hasAccelerators
  ).map(({ key, labelId }) => ({
    key,
    label: intl.formatMessage({ id: labelId })
  }));

  return (
    <Space size={16}>
      {gauges.map(({ key, label }) => {
        const state = values[key];
        // Displayed percent is clamped to [0, 100] — the source may exceed 100.
        const percent =
          state.percent === null
            ? null
            : _.clamp(_.round(state.percent), 0, 100);
        const cell = (
          <span style={columnStyle}>
            <GaugeRing percent={percent} size={GAUGE_SIZE} />
            <span
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                color: 'var(--ant-color-text-tertiary)'
              }}
            >
              {label}
            </span>
          </span>
        );
        // Multi-card row: the merged gauge's hover breaks out one bar per
        // card instead of the single exact-value tooltip.
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
              {cell}
            </Popover>
          );
        }
        return (
          <Tooltip key={key} title={gaugeTooltip(key, label, state)}>
            {cell}
          </Tooltip>
        );
      })}
    </Space>
  );
};

export default UtilizationCell;
