import { TextAttribute } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Segmented, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import type { MetricView, ModelMetric } from '../config/types';
import { useMonitoringExpansion } from '../hooks/use-monitoring-expansion';
import { canOmitMetric, canOmitMetricGroup } from '../utils/metric-state';
import {
  pdCacheHasObservations,
  type PDCacheFeatures
} from '../utils/pd-cache-features';
import {
  pdCompletionMetric,
  pdIngressMetric,
  pdObservationGroups,
  pdRoleMetric,
  pdUnsupportedMetric,
  type PDRole
} from '../utils/pd-metrics';
import { pdTimingMetric } from '../utils/pd-timing';
import { combineMetrics } from './hardware-content';
import MonitoringSection from './monitoring-section';
import PDHandoffEvents from './pd-handoff-events';
import PDRouterMembers from './pd-router-members';

export interface PDInstance {
  id: number;
  name: string;
  role?: string | null;
  state?: string | null;
  draining_since?: string | null;
}

export interface PDChartSpec {
  key: string;
  metricKey: string;
  title: string;
  metric?: MetricView;
  help: string;
  source?: string;
  measures?: string[];
  extra?: ReactNode;
}

export interface PDMonitoringContentProps {
  metrics: Record<string, ModelMetric>;
  instances: PDInstance[];
  backend?: string;
  mode?: string;
  cacheFeatures?: PDCacheFeatures;
  view: 'aggregate' | 'instances';
  onViewChange: (view: 'aggregate' | 'instances') => void;
  showViewControl?: boolean;
  omitUnavailable?: boolean;
  sectionIds?: {
    service?: string;
    pools?: string;
    handoff?: string;
    details?: string;
  };
  expandedSections?: string[];
  onExpandedSectionsChange?: (keys: string[]) => void;
  expandedDetails?: string[];
  onExpandedDetailsChange?: (keys: string[]) => void;
  // The page owns chart time ranges, shared inspection, and segmented history.
  // Return the chart card itself; the shared layout supplies its column.
  renderChart: (spec: PDChartSpec) => ReactNode;
}

const useStyles = createStyles(({ css }) => ({
  notice: css`
    padding: var(--ant-padding-sm) var(--ant-padding);
    background: var(--ant-color-fill-quaternary);
    border-radius: var(--ant-border-radius);
  `
}));

export default function PDMonitoringContent({
  metrics,
  instances,
  backend,
  mode,
  cacheFeatures,
  view,
  onViewChange,
  showViewControl = true,
  omitUnavailable = false,
  sectionIds,
  expandedSections,
  onExpandedSectionsChange,
  expandedDetails,
  onExpandedDetailsChange,
  renderChart
}: PDMonitoringContentProps) {
  const intl = useIntl();
  const { styles } = useStyles();
  const {
    expanded: localSections,
    setExpanded: setLocalSections,
    details: localDetails,
    setDetails: setLocalDetails
  } = useMonitoringExpansion({
    identity: 'pd-content',
    mode: 'deployment',
    pd: true,
    metrics
  });
  const sections = expandedSections || localSections;
  const toggleSection = (key: string, open: boolean) => {
    const next = open
      ? [...new Set([...sections, key])]
      : sections.filter((item) => item !== key);
    if (expandedSections === undefined) setLocalSections(next);
    onExpandedSectionsChange?.(next);
  };
  const details = expandedDetails || localDetails;
  const changeDetail = (key: string, active: boolean) => {
    const next = active
      ? [...new Set([...details, key])]
      : details.filter((item) => item !== key);
    if (expandedDetails === undefined) setLocalDetails(next);
    onExpandedDetailsChange?.(next);
  };
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.pd.${key}` });
  const m = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const roleLabel = (role: PDRole) =>
    ({ prefill: 'Prefill', decode: 'Decode', router: 'Router' })[role];
  const groups = pdObservationGroups(metrics, backend, cacheFeatures);
  const visible = (key: keyof typeof groups) =>
    groups[key].length > 0 &&
    (!omitUnavailable || !canOmitMetricGroup(groups[key], metrics));
  const local = (key: string, role: PDRole) => {
    const metric = pdRoleMetric(metrics[key], role);
    if (metric) return metric;
    const counter = [
      'input_tokens',
      'output_tokens',
      'router_requests'
    ].includes(key);
    const gauge =
      ['running_requests', 'waiting_requests', 'kv_usage'].includes(key) ||
      key.endsWith('_queue');
    const ratio = key.endsWith('_hit_rate');
    const unit = counter
      ? key === 'router_requests'
        ? 'requests_per_second'
        : 'tokens_per_second'
      : gauge
        ? key === 'kv_usage'
          ? 'percent'
          : 'requests'
        : ratio
          ? 'percent'
          : 'seconds';
    return pdUnsupportedMetric(
      unit,
      'engine_local',
      counter || ratio ? 'counter' : gauge ? 'gauge' : 'histogram'
    );
  };
  const chart = (spec: PDChartSpec, span: 8 | 12 | 24 = 12) => {
    const source =
      spec.key === 'ingress-ttft'
        ? 'ingress_ttft'
        : spec.key === 'ingress-e2e'
          ? 'ingress_e2e'
          : spec.metricKey;
    if (
      omitUnavailable &&
      (metrics[source] ||
        ['requests', 'pd_handoff_backlog', 'pd_request_timing'].includes(
          source
        )) &&
      canOmitMetric(spec.metric)
    )
      return null;
    return (
      <Col xs={24} xl={span} key={spec.key} data-pd-metric={spec.key}>
        {renderChart(spec)}
      </Col>
    );
  };
  const roleChart = (
    key: string,
    role: PDRole,
    title: string,
    help: string,
    extra?: ReactNode,
    span: 8 | 12 | 24 = 12
  ) => {
    const cache =
      key === 'prefix_cache_hit_rate'
        ? 'prefix'
        : key === 'external_cache_hit_rate'
          ? 'external'
          : null;
    if (
      cache &&
      role !== 'router' &&
      cacheFeatures?.[role]?.[cache] === false &&
      !pdCacheHasObservations(metrics[key], role) &&
      !['query_error', 'restricted'].includes(metrics[key]?.status || '')
    )
      return null;
    return chart(
      {
        key: `${role}-${key}`,
        metricKey: key,
        title: ['prefill', 'decode'].includes(key)
          ? title
          : `${roleLabel(role)} · ${title}`,
        metric: local(key, role),
        help,
        source:
          role === 'router'
            ? t('routerObservation')
            : `${roleLabel(role)} · ${t('engineObservation')}`,
        extra
      },
      span
    );
  };
  const queues = (role: PDRole) =>
    chart({
      key: `${role}-queues`,
      metricKey: 'requests',
      title: `${roleLabel(role)} · ${m('requestQueues')}`,
      metric: combineMetrics([
        [m('metric.running_requests'), local('running_requests', role)],
        [m('metric.waiting_requests'), local('waiting_requests', role)]
      ]),
      measures: [m('metric.running_requests'), m('metric.waiting_requests')],
      help: t('queuesHelp'),
      source: `${roleLabel(role)} · ${t('engineObservation')}`
    });
  const generationMetrics = (['tpot', 'itl'] as const).filter(
    (key) =>
      !omitUnavailable || !metrics[key] || !canOmitMetric(local(key, 'decode'))
  );
  const flowMetrics = (
    [
      ['router_requests', 'router', t('requestRate'), t('routerRequestHelp')],
      ['input_tokens', 'prefill', t('inputThroughput'), t('tokenHelp')],
      ['output_tokens', 'decode', t('outputThroughput'), t('tokenHelp')]
    ] as const
  ).filter(
    ([key, role]) =>
      !omitUnavailable || !metrics[key] || !canOmitMetric(local(key, role))
  );
  const flowSpan =
    flowMetrics.length === 3 ? 8 : flowMetrics.length === 2 ? 12 : 24;
  const sglang = backend?.toLowerCase().includes('sglang');
  const pdMetric = (
    key: string,
    title: string,
    help: string,
    unit = 'seconds',
    fullWidth = false
  ) =>
    chart(
      {
        key,
        metricKey: key,
        title,
        metric:
          (key === 'pd_kv_completion'
            ? pdCompletionMetric(metrics)
            : metrics[key]) || pdUnsupportedMetric(unit, 'connector'),
        help,
        source: [
          ...new Set(
            (metrics[key]?.series || [])
              .map((series) => series.dimensions.role)
              .filter(Boolean)
          )
        ]
          .map((role) => roleLabel(role as PDRole))
          .concat(t('connectorObservation'))
          .join(' · ')
      },
      fullWidth ? 24 : 12
    );
  const timingComponents = (role: 'prefill' | 'decode') =>
    [
      [t('timingQueue'), local('queue', role)],
      [
        t(role === 'prefill' ? 'timingPrefill' : 'timingDecode'),
        local(role, role)
      ],
      [t('timingRequest'), local('e2e', role)]
    ] as [string, ModelMetric][];
  const timingChart = (role: 'prefill' | 'decode') => {
    const components = timingComponents(role);
    const metric = combineMetrics(
      components
        .filter(([, metric]) => !canOmitMetric(metric))
        .map(([label, metric]) => [label, pdTimingMetric(metric, role)])
    );
    return chart({
      key: `${role}-request-timing`,
      metricKey: 'pd_request_timing',
      title: `${roleLabel(role)} · ${t('requestTiming')}`,
      metric: metric || pdUnsupportedMetric('seconds', 'engine_local'),
      measures: components.map(([label]) => label),
      help: t('timingHelp'),
      source: `${roleLabel(role)} · ${t('engineObservation')}`
    });
  };
  const viewControl = showViewControl && (
    <Segmented
      aria-label={t('poolView')}
      value={view}
      options={[
        { label: m('aggregate'), value: 'aggregate' },
        { label: m('byInstance'), value: 'instances' }
      ]}
      onChange={(value) => onViewChange(value as 'aggregate' | 'instances')}
    />
  );

  return (
    <Flex vertical gap={24} data-pd-monitoring="true">
      {visible('pools') && (
        <MonitoringSection
          sectionKey="pools"
          id={sectionIds?.pools}
          title={t('rolePools')}
          help={t('poolHelp')}
          extra={viewControl}
          expanded={sections.includes('pools')}
          onToggle={(open) => toggleSection('pools', open)}
        >
          {flowMetrics.length > 0 && (
            <Row gutter={[16, 16]}>
              {flowMetrics.map(([key, role, title, help]) =>
                roleChart(key, role, title, help, undefined, flowSpan)
              )}
            </Row>
          )}
          {generationMetrics.length > 0 && (
            <Row gutter={[16, 16]}>
              {generationMetrics.map((key) =>
                roleChart(
                  key,
                  'decode',
                  key.toUpperCase(),
                  t(key === 'tpot' ? 'tpotHelp' : 'itlHelp'),
                  undefined,
                  generationMetrics.length === 1 ? 24 : 12
                )
              )}
            </Row>
          )}
          <Row gutter={[16, 16]}>
            {queues('prefill')}
            {queues('decode')}
            {timingChart('prefill')}
            {timingChart('decode')}
            {roleChart(
              'kv_usage',
              'prefill',
              m('metric.kv_usage'),
              t('kvHelp')
            )}
            {roleChart('kv_usage', 'decode', m('metric.kv_usage'), t('kvHelp'))}
          </Row>
          <PDRouterMembers
            metric={metrics.router_health}
            instances={instances}
            omitUnavailable={omitUnavailable}
          />
          {visible('roleDetails') && (
            <MonitoringSection
              sectionKey="role-details"
              level="detail"
              id={sectionIds?.details}
              title={t('roleDetails')}
              expanded={details.includes('role-details')}
              onToggle={(open) => changeDetail('role-details', open)}
            >
              <Row gutter={[16, 16]}>
                {(['prefill', 'decode'] as const).map((role) =>
                  roleChart(
                    'prefix_cache_hit_rate',
                    role,
                    m('metric.prefix_cache_hit_rate'),
                    t('prefixHelp')
                  )
                )}
                {(['prefill', 'decode'] as const).map((role) =>
                  roleChart(
                    'external_cache_hit_rate',
                    role,
                    m('metric.external_cache_hit_rate'),
                    t('externalCacheHelp')
                  )
                )}
              </Row>
            </MonitoringSection>
          )}
        </MonitoringSection>
      )}

      {visible('service') && (
        <MonitoringSection
          sectionKey="service"
          id={sectionIds?.service}
          title={t('serviceExperience')}
          help={t('ingressHelp')}
          expanded={sections.includes('service')}
          onToggle={(open) => toggleSection('service', open)}
        >
          {[metrics.ingress_ttft, metrics.ingress_e2e].every(
            (metric) => pdIngressMetric(metric).status === 'unsupported'
          ) ? (
            <Flex gap={8} className={styles.notice} data-pd-ingress-unavailable>
              <Typography.Text type="secondary">
                {t('ingressUnavailable')}
              </Typography.Text>
            </Flex>
          ) : (
            <Row gutter={[16, 16]}>
              {chart({
                key: 'ingress-ttft',
                metricKey: 'ttft',
                title: t('ingressTTFT'),
                metric: pdIngressMetric(metrics.ingress_ttft),
                help: t('ingressHelp')
              })}
              {chart({
                key: 'ingress-e2e',
                metricKey: 'e2e',
                title: t('ingressE2E'),
                metric: pdIngressMetric(metrics.ingress_e2e),
                help: t('ingressHelp')
              })}
            </Row>
          )}
        </MonitoringSection>
      )}

      {visible('pd') && (
        <MonitoringSection
          sectionKey="pd"
          id={sectionIds?.handoff}
          title={t('handoff')}
          help={t('handoffHelp')}
          extra={
            mode && <TextAttribute variant="outlined">{mode}</TextAttribute>
          }
          expanded={sections.includes('pd')}
          onToggle={(open) => toggleSection('pd', open)}
        >
          <PDHandoffEvents metrics={metrics} />
          <Row gutter={[16, 16]}>
            {pdMetric(
              'pd_kv_completion',
              t('completionDuration'),
              t(sglang ? 'sglangCompletionHelp' : 'completionHelp')
            )}
            {pdMetric(
              'pd_kv_throughput',
              t('transferThroughput'),
              t('transferThroughputHelp'),
              'bytes_per_second'
            )}
            {sglang &&
              (['prefill', 'decode'] as const).map((role) => {
                const entries =
                  role === 'prefill'
                    ? ([
                        [
                          t('bootstrapQueue'),
                          local('pd_prefill_bootstrap_queue', role)
                        ],
                        [
                          t('inflightQueue'),
                          local('pd_prefill_inflight_queue', role)
                        ]
                      ] as const)
                    : ([
                        [
                          t('preallocQueue'),
                          local('pd_decode_prealloc_queue', role)
                        ],
                        [
                          t('transferQueue'),
                          local('pd_decode_transfer_queue', role)
                        ]
                      ] as const);
                return chart({
                  key: `${role}-handoff-backlog`,
                  metricKey: 'pd_handoff_backlog',
                  title: `${roleLabel(role)} · ${t('handoffBacklog')}`,
                  help: t('handoffQueueHelp'),
                  source: `${roleLabel(role)} · ${t('engineObservation')}`,
                  metric: combineMetrics(
                    entries.map(([label, metric]) => [label, metric])
                  ),
                  measures: entries.map(([label]) => label)
                });
              })}
          </Row>
        </MonitoringSection>
      )}
    </Flex>
  );
}
