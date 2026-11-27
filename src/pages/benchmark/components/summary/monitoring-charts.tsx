import navigationStyles from '@/pages/_components/monitoring/monitoring-navigation.module.less';
import ChartInteractionHelp from '@/pages/llmodels/detail/components/chart-interaction-help';
import { combineMetrics } from '@/pages/llmodels/detail/components/hardware-content';
import { labelHardwareMetric } from '@/pages/llmodels/detail/components/hardware-metrics';
import HelpTooltip from '@/pages/llmodels/detail/components/help-tooltip';
import { LatencyStatisticsControl } from '@/pages/llmodels/detail/components/latency-statistics';
import MetricChart from '@/pages/llmodels/detail/components/metric-chart';
import MonitoringSection from '@/pages/llmodels/detail/components/monitoring-section';
import MonitoringVisibilityActions from '@/pages/llmodels/detail/components/monitoring-visibility-actions';
import ObservationNotes from '@/pages/llmodels/detail/components/observation-notes';
import PDMonitoringContent, {
  type PDChartSpec
} from '@/pages/llmodels/detail/components/pd-monitoring-content';
import { LatencyStatisticsProvider } from '@/pages/llmodels/detail/config/latency-statistics-context';
import type { ModelMetric } from '@/pages/llmodels/detail/config/types';
import { useMonitoringExpansion } from '@/pages/llmodels/detail/hooks/use-monitoring-expansion';
import { containsTimestamp } from '@/pages/llmodels/detail/utils/chart-context';
import type { ChartTimeSegment } from '@/pages/llmodels/detail/utils/chart-segments';
import type { LatencyStatistic } from '@/pages/llmodels/detail/utils/latency-statistics';
import {
  canOmitMetric,
  canOmitMetricGroup
} from '@/pages/llmodels/detail/utils/metric-state';
import { hasMetricSamples } from '@/pages/llmodels/detail/utils/metrics';
import { orderMonitoringSections } from '@/pages/llmodels/detail/utils/monitoring-sections';
import { monitoringObservationGroups } from '@/pages/llmodels/detail/utils/observation-visibility';
import type { PDCacheFeatures } from '@/pages/llmodels/detail/utils/pd-cache-features';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import { scrollWhenSectionSettles } from '@/pages/llmodels/detail/utils/section-navigation';
import { withTokenTotal } from '@/pages/llmodels/detail/utils/token-throughput';
import {
  resourceHref,
  validResourceRange
} from '@/pages/resources/detail/utils/navigation';
import { useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Flex,
  Popover,
  Row,
  Segmented,
  Space,
  Typography
} from 'antd';
import { createStyles } from 'antd-style';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import type {
  BenchmarkMonitoringData,
  BenchmarkTimeRange
} from '../../config/monitoring-types';
import { hasUnavailableRunIdentity } from '../../utils/monitoring';
import { MonitoringNotice } from './stage-observations';

interface Props {
  benchmarkId?: number;
  data: BenchmarkMonitoringData;
  range: BenchmarkTimeRange | null;
  bands: {
    start: number;
    end: number;
    label: string;
    kind: 'selected' | 'baseline';
  }[];
  view: 'aggregate' | 'instances';
  latencyStatistics?: LatencyStatistic[];
  onLatencyStatisticsChange?: (statistics: LatencyStatistic[]) => void;
  onViewChange: (view: 'aggregate' | 'instances') => void;
  onResourcesRequest?: () => void;
  controls?: React.ReactNode;
  timeSegments?: ChartTimeSegment[];
  inspectionScope?: string;
  pinnedTimestamp?: number | null;
  onPinnedTimestampChange?: (timestamp: number | null) => void;
  untimedCount?: number;
  backend?: string;
  cacheFeatures?: PDCacheFeatures;
  targetMode?: string;
}

export interface MonitoringChartsHandle {
  openSection: (section: string) => void;
}
const useStyles = createStyles(({ css }) => ({
  root: css`
    [id^='benchmark-monitor-'] {
      scroll-margin-top: calc(
        var(--benchmark-navigation-height, 0px) + var(--ant-padding-lg)
      );
    }
  `,
  navigation: css`
    .ant-space,
    .ant-space-item {
      min-width: 0;
      max-width: 100%;
    }
  `
}));
const MonitoringCharts = forwardRef<MonitoringChartsHandle, Props>(
  function MonitoringCharts(
    {
      benchmarkId,
      data,
      range,
      bands,
      view,
      latencyStatistics,
      onLatencyStatisticsChange,
      onViewChange,
      onResourcesRequest,
      controls,
      timeSegments,
      inspectionScope = 'time',
      pinnedTimestamp = null,
      onPinnedTimestampChange,
      untimedCount = 0,
      backend,
      cacheFeatures,
      targetMode
    }: Props,
    ref
  ) {
    const intl = useIntl();
    const t = (key: string) =>
      intl.formatMessage({ id: `benchmark.monitoring.${key}` });
    const m = (key: string) =>
      intl.formatMessage({ id: `modelMonitoring.${key}` });
    const cancelNavigation = useRef<(() => void) | null>(null);
    useEffect(() => () => cancelNavigation.current?.(), []);
    const [associationsOpen, setAssociationsOpen] = useState(false);
    const associationsTrigger = useRef<HTMLButtonElement>(null);
    const dismissAssociations = (event: React.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setAssociationsOpen(false);
      associationsTrigger.current?.focus();
    };
    const [inspection, setInspection] = useState({
      scope: inspectionScope,
      timestamp: null as number | null,
      pinned: false
    });
    const interaction =
      pinnedTimestamp !== null
        ? { timestamp: pinnedTimestamp, pinned: true }
        : inspection.scope === inspectionScope
          ? inspection
          : { timestamp: null, pinned: false };
    const setInteraction = (next: {
      timestamp: number | null;
      pinned: boolean;
    }) => {
      setInspection({
        ...next,
        pinned: onPinnedTimestampChange ? false : next.pinned,
        scope: inspectionScope
      });
      if (next.pinned || pinnedTimestamp !== null)
        onPinnedTimestampChange?.(next.pinned ? next.timestamp : null);
    };
    const segmented = timeSegments !== undefined;
    const context = data.context;
    const { styles } = useStyles();
    const rootRef = useRef<HTMLDivElement>(null);
    const navigationRef = useRef<HTMLDivElement>(null);
    const unavailableIdentity = hasUnavailableRunIdentity(context);
    useEffect(() => {
      if (!navigationRef.current || typeof ResizeObserver === 'undefined')
        return;
      const observer = new ResizeObserver(() =>
        rootRef.current?.style.setProperty(
          '--benchmark-navigation-height',
          `${navigationRef.current?.offsetHeight || 0}px`
        )
      );
      observer.observe(navigationRef.current);
      return () => observer.disconnect();
    }, [unavailableIdentity]);
    const instances = context?.instances || [];
    const knownPD = instances.length
      ? instances.some((instance) =>
          ['prefill', 'decode', 'router'].includes(instance.role || '')
        )
      : undefined;
    const {
      expanded,
      setExpanded,
      pd,
      details: pdDetails,
      setDetails: setPDDetails
    } = useMonitoringExpansion({
      identity: benchmarkId ?? context?.benchmark_id ?? 'pending',
      mode: 'benchmark',
      pd: knownPD
    });
    const changeExpanded = (next: React.SetStateAction<string[]>) => {
      const keys = typeof next === 'function' ? next(expanded) : next;
      if (keys.some((key) => ['gpu', 'host'].includes(key)))
        onResourcesRequest?.();
      setExpanded(keys);
    };
    const runtimeResponse =
      view === 'instances' ? data.instances : data.runtime;
    const runtimeError =
      data.errors[view === 'instances' ? 'instances' : 'runtime'];
    const activeData = {
      ...data,
      runtime: runtimeResponse,
      errors: { ...data.errors, runtime: runtimeError }
    };
    const waitingForRuntime =
      !runtimeResponse && (!!runtimeError || data.loading);
    const runtime = runtimeResponse?.metrics || {};
    const resources = data.resources?.metrics || {};
    const groups = monitoringObservationGroups(
      runtime,
      pd,
      backend,
      cacheFeatures
    );
    const allMetrics = { ...runtime, ...resources };
    const visible = (key: string) =>
      (key !== 'service' || !!groups.service) &&
      !canOmitMetricGroup(groups[key] || [], allMetrics);
    const latencyMetrics = ['ttft', 'tpot', 'itl'].filter(
      (key) => !canOmitMetric(runtime[key])
    );
    const latencySpan =
      latencyMetrics.length === 3 ? 8 : latencyMetrics.length === 2 ? 12 : 24;
    const devices = data.resources?.devices || context?.devices || [];
    const workers = data.resources?.workers || context?.workers || [];
    const colorDomain = instances
      .map((instance) => `instance:${instance.id}`)
      .concat(
        devices.map((device) => `device:${device.id}`),
        workers.map((worker) => `worker:${worker.id}`)
      );
    const local = (key: string) => runtime[key];
    const chart = (
      key: string,
      metric?: ModelMetric,
      title?: string,
      options: {
        hardware?: boolean;
        host?: boolean;
        measures?: string[];
        neutralMeasures?: string[];
        extra?: React.ReactNode;
        help?: string;
        source?: string;
        wrap?: boolean;
        span?: 8 | 12 | 24;
      } = {}
    ) => {
      if (canOmitMetric(metric)) return null;
      const chartTitle = title || m(`metric.${key}`);
      const observed =
        metric &&
        hasMetricSamples({
          series: metric.series.map((series) => ({
            ...series,
            points: range
              ? series.points.filter(
                  ([timestamp]) =>
                    containsTimestamp(range, timestamp) &&
                    (!timeSegments ||
                      timeSegments.some((segment) =>
                        containsTimestamp(segment, timestamp)
                      ))
                )
              : series.points
          }))
        });
      const compact =
        !data.loading &&
        metric &&
        !observed &&
        metric.status !== 'query_error' &&
        metric.reason !== 'query_failed';
      const content = (
        <MetricChart
          metricKey={key}
          title={chartTitle}
          metric={metric}
          colorDomain={colorDomain}
          showSummary={false}
          compactEmpty={!!compact}
          timeRange={range || undefined}
          timeBands={bands}
          timeSegments={timeSegments}
          note={[
            options.help,
            options.hardware && data.resources?.step != null
              ? `${intl.formatMessage(
                  { id: 'resourceDetail.queryStep' },
                  { seconds: data.resources.step }
                )} · ${intl.formatMessage({ id: 'resourceDetail.queryStepHelp' })}`
              : undefined
          ]
            .filter(Boolean)
            .join(' ')}
          source={options.source}
          interaction={{ ...interaction, onChange: setInteraction }}
          exactCursor
          rateWindowSeconds={runtimeResponse?.rate_window_seconds}
          measures={options.measures}
          neutralMeasures={options.neutralMeasures}
          extra={options.extra}
        />
      );
      return options.wrap === false ? (
        content
      ) : (
        <Col xs={24} xl={options.span || 12} key={key}>
          {content}
        </Col>
      );
    };
    const hardware = (key: string, host = false) =>
      labelHardwareMetric(
        resources[key],
        data.resources || undefined,
        host,
        m('chip')
      );
    const memory = (key: string, host = false) =>
      combineMetrics([
        [m('usedMemory'), hardware(key, host)],
        [m('totalMemory'), hardware(key.replace('_used', '_total'), host)]
      ]);
    const resourceRange = range || context?.run_window;
    const resourceScope =
      resourceRange &&
      validResourceRange(resourceRange.start, resourceRange.end)
        ? { window: '1h', ...resourceRange }
        : undefined;
    const resourceAccessRevoked = [
      data.errors.context,
      data.errors.resources
    ].some((error) =>
      [401, 403, 404].includes(
        (error as { response?: { status?: number } } | undefined)?.response
          ?.status || 0
      )
    );
    const resourceLinksAvailable =
      !!resourceScope &&
      context?.observation_storage?.source !== 'archive' &&
      !unavailableIdentity &&
      !resourceAccessRevoked &&
      !['restricted', 'unavailable'].includes(context?.resource_status || '') &&
      !['resource_not_visible', 'historical_association_changed'].includes(
        data.resources?.reason || ''
      );
    const associations = (
      <Flex
        vertical
        gap={16}
        style={{ width: 'min(460px, calc(100vw - 48px))' }}
      >
        <Space size={4}>
          <Typography.Text type="secondary">
            {t('participation')}:{' '}
            {context?.run_window
              ? `${new Date(context.run_window.start * 1000).toLocaleTimeString()} — ${new Date(context.run_window.end * 1000).toLocaleTimeString()}`
              : '—'}
          </Typography.Text>
          <HelpTooltip
            label={t('associatedResources')}
            content={t('resourceDrilldownHelp')}
          />
        </Space>
        {workers.map((worker) => (
          <Flex vertical gap={4} key={worker.id}>
            <strong>
              {resourceLinksAvailable ? (
                <a
                  href={resourceHref(
                    { kind: 'worker', id: String(worker.id) },
                    resourceScope,
                    'monitoring'
                  )}
                >
                  {worker.name}
                </a>
              ) : (
                worker.name
              )}
            </strong>
            {instances
              .filter(
                (instance) =>
                  instance.worker_id === worker.id ||
                  instance.worker_ids?.includes(worker.id)
              )
              .map((instance) => (
                <Flex key={instance.id} gap={4} wrap align="baseline">
                  <span>
                    {instance.name} · {instance.role || t('inference')} ·
                  </span>
                  {devices
                    .filter(
                      (device) =>
                        device.worker_id === worker.id &&
                        device.model_instance_ids.includes(instance.id)
                    )
                    .map((device) =>
                      resourceLinksAvailable &&
                      device.reason !== 'device_identity_unresolved' ? (
                        <a
                          key={device.id}
                          href={resourceHref(
                            {
                              kind: 'gpu',
                              id: String(worker.id),
                              deviceId: device.id
                            },
                            resourceScope,
                            'monitoring'
                          )}
                        >
                          {gpuDeviceLabel(device, m('chip'))}
                        </a>
                      ) : (
                        <span key={device.id}>
                          {gpuDeviceLabel(device, m('chip'))}
                        </span>
                      )
                    )}
                  {!devices.some(
                    (device) =>
                      device.worker_id === worker.id &&
                      device.model_instance_ids.includes(instance.id)
                  ) && <span>{instance.role === 'router' ? 'CPU' : '—'}</span>}
                </Flex>
              ))}
          </Flex>
        ))}
        {!workers.length && <span>{t('noVisibleResources')}</span>}
        {(context?.events || []).map((event, index) => (
          <Typography.Text type="secondary" key={index}>
            {t(
              event.kind === 'generation_changed'
                ? 'resourceChanged'
                : 'associationCaptured'
            )}{' '}
            · {new Date(event.at * 1000).toLocaleTimeString()}
            {event.model_instance_id != null
              ? ` · ${instances.find((instance) => instance.id === event.model_instance_id)?.name || '—'}`
              : ''}
          </Typography.Text>
        ))}
      </Flex>
    );
    const queue = (source: Record<string, ModelMetric>) =>
      combineMetrics([
        [m('metric.running_requests'), source.running_requests],
        [m('metric.waiting_requests'), source.waiting_requests]
      ]);
    const standardSections = [
      {
        key: 'service',
        label: m('pd.serviceExperience'),
        children: (
          <Row gutter={[16, 16]}>
            {chart('ingress_ttft', runtime.ingress_ttft, m('pd.ingressTTFT'), {
              help: m('pd.ingressHelp')
            })}
            {chart('ingress_e2e', runtime.ingress_e2e, m('pd.ingressE2E'), {
              help: m('pd.ingressHelp')
            })}
          </Row>
        )
      },
      {
        key: 'llm',
        label: m('section.llm'),
        help: [
          t('recordedRuntime'),
          data.runtime?.rate_window_seconds ||
          data.instances?.rate_window_seconds
            ? intl.formatMessage(
                { id: 'benchmark.monitoring.rollingContext' },
                {
                  seconds:
                    data.runtime?.rate_window_seconds ||
                    data.instances?.rate_window_seconds ||
                    0
                }
              )
            : ''
        ]
          .filter(Boolean)
          .join(' '),
        children: (
          <Row gutter={[16, 16]}>
            {latencyMetrics.map((key) =>
              chart(key, local(key), m(`metric.${key}`), {
                span: latencySpan,
                help: m(`help.${key}`)
              })
            )}
            {chart(
              'tokens',
              view === 'instances'
                ? runtime.output_tokens
                : withTokenTotal({
                    metric: combineMetrics([
                      [m('metric.input_tokens'), runtime.input_tokens],
                      [m('metric.output_tokens'), runtime.output_tokens]
                    ]),
                    input: runtime.input_tokens,
                    output: runtime.output_tokens,
                    totalLabel: m('metric.total_tokens'),
                    pd
                  }),
              view === 'instances'
                ? m('outputThroughput')
                : m('tokenThroughput'),
              {
                measures:
                  view === 'aggregate'
                    ? [
                        m('metric.input_tokens'),
                        m('metric.output_tokens'),
                        m('metric.total_tokens')
                      ]
                    : []
              }
            )}
            {chart('requests', queue(runtime), m('requestQueues'), {
              measures: [
                m('metric.running_requests'),
                m('metric.waiting_requests')
              ]
            })}
          </Row>
        )
      },
      {
        key: 'stages',
        label: m('section.stages'),
        children: (
          <Row gutter={[16, 16]}>
            {chart('e2e', local('e2e'))}
            {chart('queue', local('queue'))}
            {chart('prefill', runtime.prefill)}
            {chart('decode', runtime.decode)}
          </Row>
        )
      },
      {
        key: 'cache',
        label: m('section.cache'),
        help: m('cacheScope'),
        children: (
          <Row gutter={[16, 16]}>
            {[
              'kv_usage',
              'prefix_cache_hit_rate',
              'external_cache_hit_rate'
            ].map((key) => chart(key, runtime[key]))}
          </Row>
        )
      },
      {
        key: 'gpu',
        label: m('section.gpu'),
        help: `${m('sharedHardware')} ${m('hardwareHistory')}`,
        children: (
          <Flex vertical gap={16}>
            <MonitoringNotice data={data} hardware />
            <Row gutter={[16, 16]}>
              {chart(
                'gpu_utilization',
                hardware('gpu_utilization'),
                undefined,
                {
                  hardware: true
                }
              )}
              {chart('gpu_memory_used', memory('gpu_memory_used'), undefined, {
                hardware: true,
                measures: [m('usedMemory'), m('totalMemory')],
                neutralMeasures: [m('totalMemory')]
              })}
              {chart('gpu_power', hardware('gpu_power'), undefined, {
                hardware: true
              })}
              {chart(
                'gpu_temperature',
                hardware('gpu_temperature'),
                undefined,
                {
                  hardware: true
                }
              )}
            </Row>
          </Flex>
        )
      },
      {
        key: 'host',
        label: m('section.host'),
        help: m('sharedHardware'),
        children: (
          <Row gutter={[16, 16]}>
            {chart('host_cpu', hardware('host_cpu', true), undefined, {
              hardware: true,
              host: true
            })}
            {chart(
              'host_memory_used',
              memory('host_memory_used', true),
              undefined,
              {
                hardware: true,
                host: true,
                measures: [m('usedMemory'), m('totalMemory')],
                neutralMeasures: [m('totalMemory')]
              }
            )}
          </Row>
        )
      }
    ];
    const pdContent = !waitingForRuntime && (
      <PDMonitoringContent
        metrics={runtime}
        instances={instances}
        view={view}
        onViewChange={onViewChange}
        backend={backend}
        cacheFeatures={cacheFeatures}
        showViewControl={false}
        omitUnavailable
        expandedSections={expanded}
        onExpandedSectionsChange={changeExpanded}
        expandedDetails={pdDetails}
        onExpandedDetailsChange={setPDDetails}
        sectionIds={{
          service: 'benchmark-monitor-service',
          pools: 'benchmark-monitor-pools',
          handoff: 'benchmark-monitor-pd',
          details: 'benchmark-monitor-role-details'
        }}
        renderChart={(spec: PDChartSpec) =>
          chart(spec.metricKey, spec.metric, spec.title, {
            wrap: false,
            help: spec.help,
            source: spec.source,
            measures: spec.measures,
            extra: spec.extra
          })
        }
      />
    );
    const sections = orderMonitoringSections(
      standardSections.filter(
        (section) =>
          (['gpu', 'host'].includes(section.key) ||
            (!pd && !waitingForRuntime)) &&
          visible(section.key)
      )
    );
    const navigation = orderMonitoringSections(
      pd
        ? [
            { key: 'service', label: m('pd.serviceExperience') },
            { key: 'pools', label: m('pd.rolePools') },
            { key: 'pd', label: m('pd.handoff') },
            ...sections
          ].filter((section) => visible(section.key))
        : sections
    );
    const viewControls = (
      <Space onClick={(event) => event.stopPropagation()} wrap>
        <Popover
          trigger="click"
          placement="bottomRight"
          open={associationsOpen}
          onOpenChange={setAssociationsOpen}
          content={
            <div
              role="region"
              aria-label={t('associatedResources')}
              onKeyDown={dismissAssociations}
            >
              {associations}
            </div>
          }
        >
          <Button
            size="small"
            type="text"
            ref={associationsTrigger}
            aria-expanded={associationsOpen}
            onKeyDown={dismissAssociations}
          >
            {t('associatedResources')}
          </Button>
        </Popover>
        <Segmented<'aggregate' | 'instances'>
          size="small"
          aria-label={m('viewMode')}
          value={view}
          options={[
            { value: 'aggregate', label: m('aggregate') },
            { value: 'instances', label: m('byInstance') }
          ]}
          onChange={onViewChange}
        />
      </Space>
    );
    const jump = (key: string) => {
      const requestedDetail = pd && key === 'cache';
      const detail = requestedDetail && visible('roleDetails');
      const target =
        (pd && ['llm', 'stages', 'router'].includes(key)) ||
        (requestedDetail && !detail)
          ? 'pools'
          : detail
            ? 'role-details'
            : key;
      if (!detail && !navigation.some((section) => section.key === target))
        return;
      if (detail)
        setPDDetails((keys) => [...new Set([...keys, 'role-details'])]);
      if (detail) changeExpanded((keys) => [...new Set([...keys, 'pools'])]);
      if (navigation.some((section) => section.key === target))
        changeExpanded((keys) => [...new Set([...keys, target])]);
      cancelNavigation.current?.();
      cancelNavigation.current = scrollWhenSectionSettles(
        `benchmark-monitor-${target}`
      );
    };
    useImperativeHandle(ref, () => ({ openSection: jump }));
    if (
      hasUnavailableRunIdentity(context) ||
      (data.errors.context as any)?.code === 'benchmark_run_changed'
    )
      return <MonitoringNotice data={data} />;
    return (
      <LatencyStatisticsProvider
        key={benchmarkId ?? context?.benchmark_id ?? 'pending'}
        value={latencyStatistics}
        onChange={onLatencyStatisticsChange}
      >
        <Flex vertical gap={16} className={styles.root} ref={rootRef}>
          <MonitoringNotice data={activeData} />
          <Flex
            align="center"
            justify="space-between"
            gap={12}
            wrap
            className={`${navigationStyles.navigation} ${styles.navigation}`}
            ref={navigationRef}
            data-benchmark-monitoring-navigation
          >
            <Space wrap>
              {navigation.map((section) => (
                <Button
                  type="text"
                  size="small"
                  key={section.key}
                  onClick={() => jump(section.key)}
                >
                  {section.label}
                </Button>
              ))}
            </Space>
            <Space wrap>
              {controls}
              {viewControls}
              <LatencyStatisticsControl />
              <ObservationNotes
                metrics={allMetrics}
                groups={groups}
                ingressContext={
                  targetMode === 'model_instance'
                    ? {
                        notApplicable: true,
                        reason: t(
                          pd
                            ? 'directRouterObservation'
                            : 'directInstanceObservation'
                        )
                      }
                    : undefined
                }
              />
              <MonitoringVisibilityActions
                keys={navigation.map((section) => section.key)}
                expanded={expanded}
                onChange={changeExpanded}
              />
              <ChartInteractionHelp
                legendValuesNote={
                  segmented ? t('segmentLegendHelp') : undefined
                }
                contextNote={pd ? m('pd.scopeHelp') : undefined}
              />
            </Space>
          </Flex>
          {untimedCount > 0 && (
            <Typography.Text type="secondary">
              {intl.formatMessage(
                { id: 'benchmark.monitoring.untimedSegments' },
                { count: untimedCount }
              )}
            </Typography.Text>
          )}
          {pd && pdContent}
          {sections.map((section) => (
            <MonitoringSection
              key={section.key}
              sectionKey={section.key}
              id={`benchmark-monitor-${section.key}`}
              title={section.label}
              help={section.help}
              annotation={
                section.key === 'gpu' || section.key === 'host' ? (
                  <Typography.Text type="secondary">
                    {section.key === 'gpu'
                      ? `${devices.length} GPU`
                      : `${workers.length} Worker`}
                  </Typography.Text>
                ) : undefined
              }
              expanded={expanded.includes(section.key)}
              onToggle={(open) =>
                changeExpanded((keys) =>
                  open
                    ? [...new Set([...keys, section.key])]
                    : keys.filter((key) => key !== section.key)
                )
              }
            >
              {section.children}
            </MonitoringSection>
          ))}
        </Flex>
      </LatencyStatisticsProvider>
    );
  }
);
export default MonitoringCharts;
