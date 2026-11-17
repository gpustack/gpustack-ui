import { displayMetricValue } from '@/pages/llmodels/detail/utils/metrics';
import { Table as SealTable } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import type { BenchmarkMonitoringData } from '../../config/monitoring-types';
import {
  exactRange,
  peakSourceComparison,
  phaseForPoint,
  phaseObservationSummary,
  safeDelta
} from '../../utils/monitoring';
import {
  stageLatencyValue,
  stageRateValue
} from '../../utils/stage-detail-metrics';
import type { StagePoint } from './metrics';
import {
  comparisonPoint,
  measurementNumber,
  sameWorkload,
  type ComparisonBasis
} from './point-navigation';
import { MonitoringNotice } from './stage-observations';

type Peak = ReturnType<typeof phaseObservationSummary>;
interface ComparisonRow {
  key: string;
  dataIndex?: string;
  label: string;
  current: number | null | undefined;
  baseline: number | null | undefined;
  unit: string;
  pp: boolean;
  peaks?: { current: Peak; baseline: Peak };
}

export default function StageComparison({
  point,
  points,
  baselineId,
  basis = 'adjacent',
  onBasisChange,
  onBaseline,
  onShowBands,
  data,
  dataForPoint,
  onEvidence
}: {
  point: StagePoint;
  points: StagePoint[];
  baselineId: number | null;
  basis?: ComparisonBasis;
  onBasisChange?: (basis: ComparisonBasis) => void;
  onBaseline: (id: number | null) => void;
  onShowBands: (baselineId: number) => void;
  data: BenchmarkMonitoringData;
  dataForPoint: (point: StagePoint) => BenchmarkMonitoringData;
  onEvidence: () => void;
}) {
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const phases = data.context?.stages || [];
  const baseline =
    basis === 'custom'
      ? points.find(
          (item) =>
            item.id === baselineId &&
            item.id !== point.id &&
            sameWorkload(item, point)
        )
      : comparisonPoint(points, point, phases, basis);
  const currentRange = exactRange(
    phaseForPoint(point, data.context?.stages || [])
  );
  const baselineRange = exactRange(
    phaseForPoint(baseline, data.context?.stages || [])
  );
  const baselineData = baseline ? dataForPoint(baseline) : null;
  const isPD = [data, baselineData].some(
    (snapshot) =>
      snapshot?.context?.instances?.some((instance) =>
        ['prefill', 'decode'].includes(instance.role || '')
      ) ||
      [snapshot?.runtime, snapshot?.instances].some(
        (response) =>
          Object.values(response?.metrics || {}).some((metric) =>
            [...metric.series, ...metric.summaries].some((item) =>
              ['prefill', 'decode'].includes(item.dimensions.role || '')
            )
          ) ||
          Object.values(response?.sample_statistics || {}).some((entries) =>
            entries.some((entry) =>
              ['prefill', 'decode'].includes(entry.dimensions.role || '')
            )
          )
      )
  );
  const peakRow = (
    key: string,
    metric: string,
    label: string,
    hardware: boolean,
    unit: string,
    role?: 'prefill' | 'decode'
  ): ComparisonRow => {
    const dimension = role
      ? { key: 'role' as const, values: [role] }
      : undefined;
    const current = phaseObservationSummary(
      hardware ? data.resources : data.runtime,
      metric,
      currentRange,
      dimension
    );
    const previous = phaseObservationSummary(
      (hardware ? baselineData?.resources : baselineData?.runtime) || null,
      metric,
      baselineRange,
      dimension
    );
    return {
      key: role ? `${key}-${role}` : key,
      label: role
        ? `${role === 'prefill' ? 'Prefill' : 'Decode'} · ${label}`
        : label,
      current: current.peak,
      baseline: previous.peak,
      unit,
      pp: unit === 'percent',
      peaks: { current, baseline: previous }
    };
  };
  const renderPeak = (
    peak: Peak,
    unit: string,
    snapshot: BenchmarkMonitoringData | null
  ) => {
    if (peak.peak == null) return '—';
    const dimensions = peak.peakDimensions;
    const instance = snapshot?.context?.instances?.find(
      (item) => item.id === dimensions?.model_instance_id
    );
    const device = [
      ...(snapshot?.resources?.devices || []),
      ...(snapshot?.context?.devices || [])
    ].find((item) => item.id === dimensions?.device_id);
    const workerId = dimensions?.worker_id ?? device?.worker_id;
    const worker = [
      ...(snapshot?.resources?.workers || []),
      ...(snapshot?.context?.workers || [])
    ].find((item) => item.id === workerId);
    const role = dimensions?.role || instance?.role;
    const instanceName = dimensions?.model_instance_name || instance?.name;
    const source = [
      role &&
        (role === 'prefill' ? 'Prefill' : role === 'decode' ? 'Decode' : role),
      instanceName ||
        (dimensions?.model_instance_id != null
          ? `${intl.formatMessage({ id: 'modelMonitoring.instance' })} #${dimensions.model_instance_id}`
          : null),
      device
        ? `GPU ${device.index} · ${device.name}`
        : dimensions?.device_id
          ? `GPU ${dimensions.device_id}`
          : null,
      workerId != null &&
        `${intl.formatMessage({ id: 'resources.worker' })}: ${worker?.name || device?.worker_name || `#${workerId}`}`,
      dimensions?.source_name !== 'legacy' && dimensions?.source_name,
      dimensions?.dp_rank != null && `DP ${dimensions.dp_rank}`,
      dimensions?.endpoint_dp_rank != null &&
        `Endpoint DP ${dimensions.endpoint_dp_rank}`,
      dimensions?.mount_point,
      dimensions?.upstream_instance_id != null &&
        `${intl.formatMessage({ id: 'modelMonitoring.instance' })} #${dimensions.upstream_instance_id}`
    ].filter(Boolean);
    return (
      <Flex vertical gap={4}>
        <span>{displayMetricValue(peak.peak, unit)}</span>
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 12,
            overflowWrap: 'anywhere',
            whiteSpace: 'normal'
          }}
        >
          {source.join(' · ') || t('peakSourceUnavailable')}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t('peakAt')}:{' '}
          {peak.peakTime == null
            ? '—'
            : dayjs(peak.peakTime * 1000).format('HH:mm:ss')}
        </Typography.Text>
      </Flex>
    );
  };
  const rate = (
    candidate: StagePoint | undefined,
    metric: Parameters<typeof stageRateValue>[1]
  ) => (candidate ? stageRateValue(candidate.raw, metric, 'mean') : null);
  const latency = (
    candidate: StagePoint | undefined,
    metric: Parameters<typeof stageLatencyValue>[1],
    statistic: 'p95' | 'p99'
  ) => (candidate ? stageLatencyValue(candidate.raw, metric, statistic) : null);
  const clientRows: ComparisonRow[] = [
    {
      key: 'success',
      label: intl.formatMessage({
        id: 'benchmark.detail.chart.axis.successRate'
      }),
      current: point.total > 0 ? (100 * point.ok) / point.total : null,
      baseline:
        baseline && baseline.total > 0
          ? (100 * baseline.ok) / baseline.total
          : null,
      unit: 'percent',
      pp: true
    },
    {
      key: 'concurrency',
      label: intl.formatMessage({
        id: 'benchmark.detail.stage.measuredConcurrency'
      }),
      current: rate(point, 'concurrency'),
      baseline: rate(baseline, 'concurrency'),
      // A measured mean is continuous; integer request-count formatting loses it.
      unit: '',
      pp: false
    },
    {
      key: 'request-rate',
      label: intl.formatMessage({ id: 'benchmark.detail.stage.measuredRate' }),
      current: rate(point, 'requests'),
      baseline: rate(baseline, 'requests'),
      unit: 'requests_per_second',
      pp: false
    },
    {
      key: 'tps',
      dataIndex: 'tps',
      label: intl.formatMessage({
        id: 'benchmark.detail.throughput.totalToken'
      }),
      current: point.tps,
      baseline: baseline?.tps,
      unit: 'tokens_per_second',
      pp: false
    },
    ...(['input', 'output'] as const).map(
      (metric): ComparisonRow => ({
        key: `${metric}-tps`,
        label: intl.formatMessage({
          id: `benchmark.detail.throughput.${metric}Token`
        }),
        current: rate(point, metric),
        baseline: rate(baseline, metric),
        unit: 'tokens_per_second',
        pp: false
      })
    ),
    ...(
      [
        ['ttft', 'TTFT', 'ms', point.ttftP99, baseline?.ttftP99],
        ['tpot', 'TPOT', 'ms/token', point.tpotP99, baseline?.tpotP99],
        ['itl', 'ITL', 'ms', point.itlP99, baseline?.itlP99],
        [
          'latency',
          t('requestLatency'),
          'seconds',
          latency(point, 'latency', 'p99'),
          latency(baseline, 'latency', 'p99')
        ]
      ] as const
    ).flatMap(
      ([metric, label, unit, currentP99, baselineP99]): ComparisonRow[] => [
        {
          key: `${metric}-p95`,
          label: `${label} P95`,
          current: latency(point, metric, 'p95'),
          baseline: latency(baseline, metric, 'p95'),
          unit,
          pp: false
        },
        {
          key: metric === 'latency' ? 'latency-p99' : metric,
          label: `${label} P99`,
          current: currentP99,
          baseline: baselineP99,
          unit,
          pp: false
        }
      ]
    )
  ];
  const rows: ComparisonRow[] = [
    ...clientRows.map((row) => ({
      ...row,
      label: `${t('client')} · ${row.label}`
    })),
    ...(isPD ? (['prefill', 'decode'] as const) : [undefined]).flatMap(
      (role) => [
        peakRow('kv', 'kv_usage', t('kvPeak'), false, 'percent', role),
        peakRow(
          'waiting',
          'waiting_requests',
          t('waitingPeak'),
          false,
          'requests',
          role
        )
      ]
    ),
    peakRow('gpu', 'gpu_utilization', t('gpuPeak'), true, 'percent'),
    peakRow('cpu', 'host_cpu', t('cpuPeak'), true, 'percent')
  ];
  return (
    <Flex vertical gap={16}>
      <MonitoringNotice data={data} hardware />
      <Flex align="center" gap={12} wrap>
        <Typography.Text>{t('baseline')}</Typography.Text>
        <Select
          aria-label={t('baseline')}
          value={basis}
          options={[
            { value: 'adjacent', label: t('adjacentLoad') },
            { value: 'previous', label: t('previousMeasurement') },
            { value: 'custom', label: t('custom') }
          ]}
          onChange={(value) => onBasisChange?.(value)}
        />
        {basis === 'custom' && (
          <Select
            aria-label={t('custom')}
            placeholder={t('custom')}
            style={{ width: 220, maxWidth: '100%', flexShrink: 0 }}
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { maxWidth: 'calc(100vw - 32px)' } } }}
            value={baseline?.id}
            options={points
              .filter(
                (item) => item.id !== point.id && sameWorkload(item, point)
              )
              .map((item) => ({
                value: item.id,
                label: `${t('measurement')} #${measurementNumber(item, phases) ?? '—'} · ${item.load}`
              }))}
            onChange={onBaseline}
          />
        )}
        <Button
          disabled={
            !baseline ||
            !currentRange ||
            !baselineRange ||
            !data.context?.run_window ||
            Math.max(currentRange.end, baselineRange.end) -
              Math.min(currentRange.start, baselineRange.start) >
              (data.context?.capabilities.max_query_seconds || Infinity)
          }
          onClick={() => {
            onBaseline(baseline?.id ?? null);
            if (baseline) onShowBands(baseline.id);
          }}
        >
          {t('compareCharts')}
        </Button>
        <Button onClick={onEvidence}>{t('viewPhaseLatency')}</Button>
      </Flex>
      <Typography.Text type="secondary">
        {t('comparisonDefinition')} {t('peakComparisonDefinition')}
      </Typography.Text>
      <SealTable
        loading={data.loading || baselineData?.loading || false}
        rowKey="key"
        dataSource={rows}
        scroll={{ x: true }}
        columns={[
          { dataIndex: 'label', title: t('metric'), minWidth: 180 },
          {
            key: 'baseline',
            dataIndex: 'baseline',
            title: baseline
              ? `${t('baseline')} · #${measurementNumber(baseline, phases) ?? '—'} · ${baseline.load}`
              : t('baseline'),
            minWidth: 150,
            render: (_: unknown, row: (typeof rows)[number]) =>
              row.peaks
                ? renderPeak(row.peaks.baseline, row.unit, baselineData)
                : displayMetricValue(row.baseline, row.unit)
          },
          {
            key: 'current',
            dataIndex: 'current',
            title: `${t('selectedStage')} · #${measurementNumber(point, phases) ?? '—'} · ${point.load}`,
            minWidth: 150,
            render: (_: unknown, row: (typeof rows)[number]) =>
              row.peaks
                ? renderPeak(row.peaks.current, row.unit, data)
                : displayMetricValue(row.current, row.unit)
          },
          {
            key: 'delta',
            dataIndex: 'delta',
            title: t('change'),
            minWidth: 120,
            render: (_: unknown, row: (typeof rows)[number]) => {
              if (row.peaks) {
                const source = peakSourceComparison(
                  row.peaks.current,
                  row.peaks.baseline
                );
                if (source === 'missing') return '—';
                if (source !== 'same')
                  return t(
                    source === 'changed'
                      ? 'peakSourceChanged'
                      : 'peakSourceUnavailable'
                  );
              }
              const delta = safeDelta(row.current, row.baseline, row.pp);
              return delta == null
                ? '—'
                : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${row.pp ? t('percentagePoints') : '%'}`;
            }
          }
        ]}
      />
    </Flex>
  );
}
