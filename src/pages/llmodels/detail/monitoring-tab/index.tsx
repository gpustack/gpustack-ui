import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Typography } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { isPDModel } from '../../config';
import {
  HardwareContent,
  combineMetrics
} from '../components/hardware-content';
import MetricChart from '../components/metric-chart';
import { AvailabilityNotice, RequestNotice } from '../components/metric-state';
import MonitoringViewControl from '../components/monitoring-view-control';
import ObservationNotes from '../components/observation-notes';
import PerformanceStats from '../components/performance-stats';
import ResourceTable from '../components/resource-table';
import ScopeToolbar from '../components/scope-toolbar';
import { useDetail } from '../config/context';
import { LatencyStatisticsProvider } from '../config/latency-statistics-context';
import { useMonitoringExpansion } from '../hooks/use-monitoring-expansion';
import {
  canOmitMetric,
  canOmitMetricGroup,
  compactMetricEmpty
} from '../utils/metric-state';
import { orderMonitoringSections } from '../utils/monitoring-sections';
import { monitoringObservationGroups } from '../utils/observation-visibility';
import { scrollWhenSectionSettles } from '../utils/section-navigation';
import { scopeTimeLabel } from '../utils/time-range';
import { withTokenTotal } from '../utils/token-throughput';
import MonitoringSectionCard from './components/monitoring-section-card';
import PDMonitoringTab from './components/pd-monitoring';
import SectionNavigation from './components/section-navigation';
import navStyles from './components/section-navigation.module.less';

export interface MonitoringTabHandle {
  openSection: (section: string) => void;
}
const OrdinaryMonitoringTab = forwardRef<MonitoringTabHandle>((_props, ref) => {
  const intl = useIntl();
  const { id, instances, runtime, resources, scope } = useDetail();
  const { expanded, setExpanded } = useMonitoringExpansion({
    identity: id,
    mode: 'deployment',
    pd: false,
    metrics: runtime.data?.metrics
  });
  const cancelNavigation = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelNavigation.current?.(), []);
  const openSection = (section: string) => {
    if (!visible(section)) return;
    setExpanded((keys) => [...new Set([...keys, section])]);
    cancelNavigation.current?.();
    cancelNavigation.current = scrollWhenSectionSettles(
      `model-monitor-${section}`
    );
  };
  const changeExpanded = (keys: string[]) => {
    cancelNavigation.current?.();
    cancelNavigation.current = null;
    setExpanded(keys);
  };
  useImperativeHandle(ref, () => ({ openSection }));
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const metrics = runtime.data?.metrics || {};
  const colorDomain = (instances.data || []).map(
    (instance) => `instance:${instance.id}`
  );
  const groups = monitoringObservationGroups(metrics, false);
  const allMetrics = { ...metrics, ...resources.data?.metrics };
  const visible = (key: string) =>
    (key !== 'service' || !!groups.service) &&
    !canOmitMetricGroup(groups[key] || [], allMetrics);
  const local = (key: string) => metrics[key];
  const latencyMetrics = ['ttft', 'tpot', 'itl'].filter(
    (key) => !canOmitMetric(metrics[key])
  );
  const latencySpan =
    latencyMetrics.length === 3 ? 8 : latencyMetrics.length === 2 ? 12 : 24;
  const chart = (
    key: string,
    title?: string,
    note?: string,
    span: 8 | 12 | 24 = 12
  ) =>
    canOmitMetric(metrics[key]) ? null : (
      <Col xs={24} xl={span} key={key}>
        <MetricChart
          colorDomain={colorDomain}
          rateWindowSeconds={runtime.data?.rate_window_seconds}
          showSummary={false}
          metricKey={key}
          title={title || t(`metric.${key}`)}
          compactEmpty={compactMetricEmpty(metrics[key])}
          metric={metrics[key]}
          note={note}
        />
      </Col>
    );
  const tokenMetric =
    scope.view === 'instances'
      ? metrics.output_tokens
      : withTokenTotal({
          metric: combineMetrics([
            [t('metric.input_tokens'), metrics.input_tokens],
            [t('metric.output_tokens'), metrics.output_tokens]
          ]),
          input: metrics.input_tokens,
          output: metrics.output_tokens,
          totalLabel: t('metric.total_tokens'),
          pd: false
        });
  const requestMetric = combineMetrics([
    [t('metric.running_requests'), local('running_requests')],
    [t('metric.waiting_requests'), local('waiting_requests')]
  ]);
  const llm = (
    <Flex vertical gap={16}>
      <Row gutter={[16, 16]}>
        {latencyMetrics.map((key) =>
          chart(key, undefined, t(`help.${key}`), latencySpan)
        )}
        {!canOmitMetric(tokenMetric) && (
          <Col xs={24} xl={12}>
            <MetricChart
              colorDomain={colorDomain}
              rateWindowSeconds={runtime.data?.rate_window_seconds}
              metricKey="tokens"
              measures={
                scope.view === 'instances'
                  ? []
                  : [
                      t('metric.input_tokens'),
                      t('metric.output_tokens'),
                      t('metric.total_tokens')
                    ]
              }
              title={t(
                scope.view === 'instances'
                  ? 'outputThroughput'
                  : 'tokenThroughput'
              )}
              metric={tokenMetric}
              compactEmpty={compactMetricEmpty(tokenMetric)}
              note={
                [
                  scope.view === 'aggregate'
                    ? t('tokenTotalDefinition')
                    : undefined
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
            />
          </Col>
        )}
        {!canOmitMetric(requestMetric) && (
          <Col xs={24} xl={12}>
            <MetricChart
              colorDomain={colorDomain}
              rateWindowSeconds={runtime.data?.rate_window_seconds}
              metricKey="requests"
              measures={[
                t('metric.running_requests'),
                t('metric.waiting_requests')
              ]}
              title={t('requestQueues')}
              metric={requestMetric}
              compactEmpty={compactMetricEmpty(requestMetric)}
              note={t('current')}
            />
          </Col>
        )}
      </Row>
    </Flex>
  );
  const stages = (
    <Flex vertical gap={16}>
      <Row gutter={[16, 16]}>
        {chart('e2e')}
        {chart('queue')}
        {chart('prefill')}
        {chart('decode')}
      </Row>
    </Flex>
  );
  const sections = orderMonitoringSections(
    [
      {
        key: 'service',
        label: t('pd.serviceExperience'),
        children: (
          <Row gutter={[16, 16]}>
            {chart('ingress_ttft', t('pd.ingressTTFT'), t('pd.ingressHelp'))}
            {chart('ingress_e2e', t('pd.ingressE2E'), t('pd.ingressHelp'))}
          </Row>
        )
      },
      { key: 'llm', label: t('section.llm'), children: llm },
      { key: 'stages', label: t('section.stages'), children: stages },
      {
        key: 'cache',
        label: t('section.cache'),
        children: (
          <Row gutter={[16, 16]}>
            {chart('kv_usage')}
            {chart('prefix_cache_hit_rate')}
            {chart('external_cache_hit_rate')}
          </Row>
        )
      },
      {
        key: 'gpu',
        label: t('section.gpu'),
        children: (
          <Flex vertical gap={16}>
            <HardwareContent />
            <ResourceTable showNotices={false} />
          </Flex>
        )
      },
      {
        key: 'host',
        label: t('section.host'),
        children: <HardwareContent host />
      }
    ].filter((section) => visible(section.key))
  );
  const sectionMeta = (section: string) => {
    if (section === 'llm')
      return `${scopeTimeLabel(scope)} · ${t('allInstances')} · ${t(scope.view === 'instances' ? 'byInstance' : 'aggregate')}`;
    if (section === 'stages' || section === 'cache') return '';
    return scopeTimeLabel(scope);
  };
  const contextNote = `${t(runtime.data?.history_scope === 'current_instances_with_observed_source_history' ? 'runtimeHistory' : 'historyScope')}${resources.data ? ` ${t('hardwareHistory')}` : ''}`;
  const sectionHelp = (section: string) =>
    section === 'cache'
      ? t('cacheScope')
      : ['gpu', 'host'].includes(section)
        ? `${t('sharedHardware')} ${t('hardwareHistory')}`
        : '';
  return (
    <Flex
      vertical
      gap={16}
      data-model-monitor-layout
      aria-busy={runtime.loading}
    >
      <div className={navStyles.panel} data-model-monitor-panel>
        <ScopeToolbar
          embedded
          extra={
            <ObservationNotes
              metrics={allMetrics}
              groups={groups}
              size="middle"
            />
          }
        />
        <SectionNavigation
          embedded
          sections={sections}
          expanded={expanded}
          onOpen={openSection}
          onChange={changeExpanded}
          contextNote={contextNote}
          extra={<MonitoringViewControl compact />}
        />
      </div>
      <RequestNotice state={runtime} showLoading={false} />
      <AvailabilityNotice
        available={runtime.data?.available}
        reason={runtime.data?.reason}
      />
      <PerformanceStats />
      {sections.map((section) => (
        <MonitoringSectionCard
          key={section.key}
          sectionKey={section.key}
          id={`model-monitor-${section.key}`}
          title={section.label}
          help={sectionHelp(section.key)}
          expanded={expanded.includes(section.key)}
          onToggle={(open) =>
            changeExpanded(
              open
                ? [...new Set([...expanded, section.key])]
                : expanded.filter((key) => key !== section.key)
            )
          }
          extra={
            sectionMeta(section.key) && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {sectionMeta(section.key)}
              </Typography.Text>
            )
          }
        >
          {section.children}
        </MonitoringSectionCard>
      ))}
    </Flex>
  );
});
const MonitoringTab = forwardRef<MonitoringTabHandle>((_props, ref) => {
  const { id, model } = useDetail();
  return (
    <LatencyStatisticsProvider key={id}>
      {isPDModel(model.data || {}) ? (
        <PDMonitoringTab ref={ref} />
      ) : (
        <OrdinaryMonitoringTab ref={ref} />
      )}
    </LatencyStatisticsProvider>
  );
});
export default MonitoringTab;
