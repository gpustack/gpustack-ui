import { convertFileSize, formatLargeNumber } from '@/utils';
import {
  BaseSelect,
  CardWrapper,
  SimpleSelect,
  TemplateCard
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Col, Flex, Row, Segmented } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { queryCacheServiceMetrics } from '../apis';
import {
  CacheServiceMetricChart,
  CacheServiceMetricSeries,
  CacheServiceMetricsData,
  MetricPoint
} from '../config/types';
import MetricTrendChart, { MetricSeries } from './metric-trend-chart';
import SubTitle from './sub-title';

const POLL_INTERVAL = 60 * 1000;
const CardHeight = 336;
const ChartHeight = 300;
const GiB = 1024 * 1024 * 1024;

const WINDOW_OPTIONS = ['30m', '1h', '6h', '24h'];

const seriesColors = [
  'rgba(84, 204, 152, 0.8)',
  'rgba(250, 173, 20, 0.8)',
  'rgba(114, 46, 209, 0.8)',
  'rgba(255, 107, 179, 0.8)'
];

// human-friendly legend labels for known throughput series keys
const throughputLabelMap: Record<string, string> = {
  l0_l1_store: 'L0/L1 Store',
  l0_l1_load: 'L0/L1 Load',
  l2_store: 'L2 Store',
  l2_load: 'L2 Load'
};

// typography only — layout composes with antd Flex
const useStyles = createStyles(({ css }) => ({
  statCard: css`
    .title {
      font-size: 14px;
      color: var(--ant-color-text-tertiary);
    }
    .value {
      font-size: 20px;
      font-weight: 600;
    }
  `,
  controlLabel: css`
    font-size: 14px;
    color: var(--ant-color-text-tertiary);
    margin-right: 8px;
  `
}));

// per-instance series carry worker_name (external services expose one
// unlabeled service-level series — the chart title names it); L2 usage
// series additionally carry the adapter's l2_name, shown by its catalog
// display name when the configured backends are known
const seriesName = (
  series: CacheServiceMetricSeries,
  fallback: string,
  l2BackendNames?: Record<string, string>
): string => {
  const base =
    series.labels?.worker_name ||
    (series.labels?.cache_service_instance_id
      ? `#${series.labels.cache_service_instance_id}`
      : fallback);
  const l2Name = series.labels?.l2_name;
  return l2Name ? `${base} (${l2BackendNames?.[l2Name] || l2Name})` : base;
};

// flow metrics (hit rate, lookup traffic, throughput) read a null
// sample — an idle 0/0 window — as zero: a continuous zero line reads
// clearer than a gap. Gauges keep their gaps: a scrape gap is not a
// zero capacity.
const toPoints = (
  series: CacheServiceMetricSeries,
  transform: (value: number) => number,
  fillZero = false
): MetricPoint[] =>
  (series.points || []).map(([timestamp, value]) => ({
    timestamp,
    value: value == null ? (fillZero ? 0 : null) : transform(value)
  }));

// latest non-null sample of one series
const latestValue = (series: CacheServiceMetricSeries): number | null => {
  for (let i = (series.points || []).length - 1; i >= 0; i -= 1) {
    const value = series.points[i][1];
    if (value != null) {
      return value;
    }
  }
  return null;
};

const formatPercent = (value: number | null) =>
  value == null ? '-' : `${_.round(value * 100, 1)}%`;

interface ServiceMonitorProps {
  serviceId: number;
  // worker names of the service's instances (database authority);
  // offered as a chart filter when there is more than one
  workerOptions?: string[];
  // configured L2 backend key -> catalog display name
  l2BackendNames?: Record<string, string>;
}

const ServiceMonitor: React.FC<ServiceMonitorProps> = ({
  serviceId,
  workerOptions = [],
  l2BackendNames = {}
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [data, setData] = useState<CacheServiceMetricsData | null>(null);
  // the polling effect's closure would otherwise capture the initial
  // null and hide the section on a transient error after a successful
  // load
  const loadedRef = useRef(false);
  const [window, setWindow] = useState<string>('1h');
  // empty selection = every worker
  const [workers, setWorkers] = useState<string[]>([]);
  // aggregate is the default view (readable at any fleet size); the
  // per-instance breakdown sits behind a toggle
  const [perInstance, setPerInstance] = useState(false);
  // a failed fetch (403 for plain members, network) hides the section
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      return;
    }
    let active = true;
    const fetchMetrics = async () => {
      try {
        const res = await queryCacheServiceMetrics(serviceId, {
          window,
          workers: workers.length ? workers.join(',') : undefined
        });
        if (active) {
          setData(res);
          loadedRef.current = true;
          setHidden(false);
        }
      } catch (error) {
        if (active && !loadedRef.current) {
          setHidden(true);
        }
        // keep the last successful data on transient failures
      }
    };
    fetchMetrics();
    const timer = setInterval(fetchMetrics, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [serviceId, window, workers]);

  if (hidden || data == null) {
    return null;
  }

  const mappingCharts = data.mappings || {};
  const throughputCharts = data.throughput || {};
  const hasMultipleInstances = [
    ...Object.values(mappingCharts),
    ...Object.values(throughputCharts)
  ].some((chart) => (chart?.instances?.length || 0) > 1);

  // the chosen granularity, falling back to whichever side has data
  const chartSeries = (
    chart: CacheServiceMetricChart | undefined
  ): CacheServiceMetricSeries[] => {
    if (!chart) {
      return [];
    }
    if (perInstance && hasMultipleInstances) {
      return chart.instances?.length ? chart.instances : chart.aggregate || [];
    }
    return chart.aggregate?.length ? chart.aggregate : chart.instances || [];
  };

  const title = (
    // the flex header replaces the SubTitle's own block margins, so it
    // carries the same section rhythm (24 above, 16 below)
    <Flex
      align="center"
      justify="space-between"
      style={{ marginBlock: '24px 16px' }}
    >
      <SubTitle style={{ marginBlock: 0 }}>
        {intl.formatMessage({ id: 'kvCache.detail.monitoring' })}
      </SubTitle>
      {data.available && (
        <Flex align="center" gap={12}>
          {(workerOptions.length > 1 || workers.length > 0) && (
            <SimpleSelect
              allowClear
              showSearch
              mode="multiple"
              maxTagCount={'responsive'}
              options={workerOptions.map((name) => ({
                label: name,
                value: name
              }))}
              placeholder={intl.formatMessage({ id: 'kvCache.table.worker' })}
              styles={{
                wrapper: { maxWidth: 280, minWidth: 150 }
              }}
              value={workers}
              onChange={(value: string[]) => setWorkers(value || [])}
            />
          )}
          {hasMultipleInstances && (
            <BaseSelect
              variant="borderless"
              prefix={
                <span className={styles.controlLabel}>
                  {intl.formatMessage({ id: 'kvCache.detail.view' })}
                </span>
              }
              options={[
                {
                  label: intl.formatMessage({
                    id: 'kvCache.detail.aggregated'
                  }),
                  value: 'aggregate'
                },
                {
                  label: intl.formatMessage({
                    id: 'kvCache.detail.perInstance'
                  }),
                  value: 'instances'
                }
              ]}
              value={perInstance ? 'instances' : 'aggregate'}
              popupMatchSelectWidth={false}
              onChange={(value: string) =>
                setPerInstance(value === 'instances')
              }
              style={{ width: 'max-content' }}
            />
          )}
          <Segmented
            size="small"
            options={WINDOW_OPTIONS}
            value={window}
            onChange={(value) => setWindow(value as string)}
          />
        </Flex>
      )}
    </Flex>
  );

  if (!data.available) {
    return (
      <div>
        {title}
        <Alert
          type="info"
          showIcon
          title={intl.formatMessage({
            id: 'kvCache.detail.metricsUnavailable'
          })}
          description={data.reason}
        />
      </div>
    );
  }

  const percentChart = (
    key: string,
    chartTitle: string,
    fillZero = false
  ): MetricSeries[] =>
    chartSeries(mappingCharts[key]).map((series, index) => ({
      name: seriesName(series, chartTitle, l2BackendNames),
      color: seriesColors[index % seriesColors.length],
      data: toPoints(series, (value) => _.round(value * 100, 1), fillZero)
    }));

  const hitRateSeries = percentChart(
    'hit_rate',
    intl.formatMessage({ id: 'kvCache.detail.hitRate' }),
    true
  );
  const l1UsageRatioSeries = percentChart(
    'l1_usage_ratio',
    intl.formatMessage({ id: 'kvCache.detail.usageRatio' })
  );
  const bytesChart = (key: string, chartTitle: string): MetricSeries[] =>
    chartSeries(mappingCharts[key]).map((series, index) => ({
      name: seriesName(series, chartTitle, l2BackendNames),
      color: seriesColors[index % seriesColors.length],
      data: toPoints(series, (value) => _.round(value / GiB, 2))
    }));

  const l1UsageSeries = bytesChart(
    'l1_usage_bytes',
    intl.formatMessage({ id: 'kvCache.detail.usage' })
  );
  const l2UsageSeries = bytesChart(
    'l2_usage_bytes',
    intl.formatMessage({ id: 'kvCache.detail.l2Usage' })
  );
  const lookupRateSeries: MetricSeries[] = chartSeries(
    mappingCharts.lookup_tokens_per_second
  ).map((series, index) => ({
    name: seriesName(
      series,
      intl.formatMessage({ id: 'kvCache.detail.lookupTraffic' }),
      l2BackendNames
    ),
    color: seriesColors[index % seriesColors.length],
    data: toPoints(series, (value) => _.round(value, 1), true)
  }));
  // one chart merges every declared throughput direction; per-instance
  // series are suffixed with the worker for disambiguation
  const throughputSeries: MetricSeries[] = Object.keys(
    throughputCharts
  ).flatMap((key, keyIndex) =>
    chartSeries(throughputCharts[key]).map((series, index) => {
      const label = throughputLabelMap[key] || key;
      const worker = series.labels?.worker_name;
      return {
        name: worker ? `${label} (${worker})` : label,
        color: seriesColors[(keyIndex + index) % seriesColors.length],
        data: toPoints(series, (value) => _.round(value, 2), true)
      };
    })
  );

  // stat cards read the service-level aggregate's latest sample — the
  // server already weights ratios by traffic and sums capacities
  const latestAggregate = (key: string): number | null => {
    const series = mappingCharts[key]?.aggregate?.[0];
    return series ? latestValue(series) : null;
  };
  const hitRateNow = latestAggregate('hit_rate');
  const l1UsageBytesNow = latestAggregate('l1_usage_bytes');
  const l1UsageRatioNow = latestAggregate('l1_usage_ratio');
  const l2UsageBytesNow = latestAggregate('l2_usage_bytes');

  // null-checked, not truthiness: zero is a real reading and keeps
  // its unit
  const percentFormatter = (value: any) =>
    value == null ? value : `${value}%`;
  const tokensFormatter = (value: any) =>
    value == null ? value : `${formatLargeNumber(value)} tokens/s`;
  const throughputFormatter = (value: any) =>
    value == null ? value : `${value} GB/s`;
  const gibFormatter = (value: any) => (value == null ? value : `${value} GiB`);

  const statCards = [
    'hit_rate' in mappingCharts && {
      key: 'hit_rate',
      title: intl.formatMessage({ id: 'kvCache.detail.hitRate' }),
      value: formatPercent(hitRateNow ?? 0)
    },
    // the platform tier vocabulary defines L1 as the memory tier, so
    // the RAM suffix is definitional, not provider-specific
    'l1_usage_bytes' in mappingCharts && {
      key: 'l1_usage_bytes',
      title: `${intl.formatMessage({ id: 'kvCache.detail.usage' })} (RAM)`,
      value: l1UsageBytesNow == null ? '-' : convertFileSize(l1UsageBytesNow)
    },
    'l1_usage_ratio' in mappingCharts && {
      key: 'l1_usage_ratio',
      title: `${intl.formatMessage({ id: 'kvCache.detail.usageRatio' })} (RAM)`,
      value: formatPercent(l1UsageRatioNow)
    },
    // parallel to the L1 cards' (RAM): the configured backend types
    // say what the capacity tier is made of
    'l2_usage_bytes' in mappingCharts && {
      key: 'l2_usage_bytes',
      title: `${intl.formatMessage({ id: 'kvCache.detail.l2Usage' })}${
        Object.values(l2BackendNames).length
          ? ` (${Object.values(l2BackendNames).join(', ')})`
          : ''
      }`,
      value: l2UsageBytesNow == null ? '-' : convertFileSize(l2UsageBytesNow)
    }
  ].filter(Boolean) as { key: string; title: string; value: string }[];

  const charts = [
    'hit_rate' in mappingCharts && {
      key: 'hit_rate',
      title: `${intl.formatMessage({ id: 'kvCache.detail.hitRate' })} (%)`,
      series: hitRateSeries,
      // ratios chart on a fixed 0-100 axis so 59% never fills the frame
      yAxisMax: 100,
      formatter: percentFormatter
    },
    // lookup traffic sits beside the hit rate: an empty hit-rate
    // window reads as no traffic, not as a fault
    'lookup_tokens_per_second' in mappingCharts && {
      key: 'lookup_tokens_per_second',
      title: `${intl.formatMessage({
        id: 'kvCache.detail.lookupTraffic'
      })} (tokens/s)`,
      series: lookupRateSeries,
      formatter: tokensFormatter
    },
    'l1_usage_ratio' in mappingCharts && {
      key: 'l1_usage_ratio',
      title: `${intl.formatMessage({ id: 'kvCache.detail.usageRatio' })} (%)`,
      series: l1UsageRatioSeries,
      yAxisMax: 100,
      formatter: percentFormatter
    },
    'l1_usage_bytes' in mappingCharts && {
      key: 'l1_usage_bytes',
      title: `${intl.formatMessage({ id: 'kvCache.detail.usage' })} (GiB)`,
      series: l1UsageSeries,
      formatter: gibFormatter
    },
    'l2_usage_bytes' in mappingCharts && {
      key: 'l2_usage_bytes',
      title: `${intl.formatMessage({ id: 'kvCache.detail.l2Usage' })} (GiB)`,
      series: l2UsageSeries,
      formatter: gibFormatter
    },
    Object.keys(throughputCharts).length > 0 && {
      key: 'throughput',
      title: `${intl.formatMessage({ id: 'kvCache.detail.throughput' })} (GB/s)`,
      series: throughputSeries,
      formatter: throughputFormatter
    }
  ].filter(Boolean) as {
    key: string;
    title: string;
    series: MetricSeries[];
    yAxisMax?: number;
    formatter: (value: any) => string;
  }[];

  return (
    <div>
      {title}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map((card) => (
          <Col span={24 / statCards.length} key={card.key}>
            <CardWrapper style={{ padding: 16, height: 120 }}>
              <Flex
                vertical
                gap={16}
                className={styles.statCard}
                style={{ height: 86 }}
              >
                <div className="title">{card.title}</div>
                <div className="value">{card.value}</div>
              </Flex>
            </CardWrapper>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        {charts.map((chart) => (
          <Col span={12} key={chart.key}>
            <TemplateCard height={CardHeight} clickable={false} ghost>
              <MetricTrendChart
                title={chart.title}
                series={chart.series}
                yAxisMax={chart.yAxisMax}
                valueFormatter={chart.formatter}
                height={ChartHeight}
              ></MetricTrendChart>
            </TemplateCard>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ServiceMonitor;
