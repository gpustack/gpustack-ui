import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { HardwareContent } from '../../components/hardware-content';
import MetricChart from '../../components/metric-chart';
import {
  AvailabilityNotice,
  RequestNotice
} from '../../components/metric-state';
import MonitoringSection from '../../components/monitoring-section';
import ObservationNotes from '../../components/observation-notes';
import PDMonitoringContent from '../../components/pd-monitoring-content';
import PDRoleOverview from '../../components/pd-role-overview';
import ResourceTable from '../../components/resource-table';
import ScopeToolbar from '../../components/scope-toolbar';
import { useDetail } from '../../config/context';
import { useMonitoringExpansion } from '../../hooks/use-monitoring-expansion';
import type { ChartCursor } from '../../utils/chart-context';
import {
  canOmitMetricGroup,
  compactMetricEmpty
} from '../../utils/metric-state';
import { orderMonitoringSections } from '../../utils/monitoring-sections';
import { monitoringObservationGroups } from '../../utils/observation-visibility';
import { pdCacheFeaturesFromModel } from '../../utils/pd-cache-features';
import { scrollWhenSectionSettles } from '../../utils/section-navigation';
import type { MonitoringTabHandle } from '../index';
import styles from './pd-monitoring.module.less';
import SectionNavigation from './section-navigation';

const PDMonitoringTab = forwardRef<MonitoringTabHandle>((_props, ref) => {
  const { id, model, instances, runtime, resources, scope, changeScope } =
    useDetail();
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const { expanded, setExpanded, details, setDetails } = useMonitoringExpansion(
    {
      identity: id,
      mode: 'deployment',
      pd: true,
      metrics: runtime.data?.metrics
    }
  );
  const scopeKey = JSON.stringify([
    scope.window,
    scope.start,
    scope.end,
    scope.view
  ]);
  const [inspection, setInspection] = useState<ChartCursor & { scope: string }>(
    {
      scope: scopeKey,
      timestamp: null,
      pinned: false
    }
  );
  const interaction = {
    ...(inspection.scope === scopeKey
      ? inspection
      : { timestamp: null, pinned: false }),
    onChange: (next: ChartCursor) => setInspection({ ...next, scope: scopeKey })
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const cancelNavigation = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelNavigation.current?.(), []);
  const openSection = (section: string) => {
    const target =
      (
        {
          llm: 'pools',
          stages: 'pools',
          cache: 'pools',
          router: 'pools'
        } as Record<string, string>
      )[section] || section;
    if (!visible(target)) return;
    setExpanded((keys) => [...new Set([...keys, target])]);
    cancelNavigation.current?.();
    cancelNavigation.current = scrollWhenSectionSettles(
      `model-monitor-${target}`
    );
  };
  useImperativeHandle(ref, () => ({ openSection }));
  const changeView = (view: 'aggregate' | 'instances') => {
    changeScope({ view });
  };
  const metrics = runtime.data?.metrics || {};
  const cacheFeatures = pdCacheFeaturesFromModel(model.data);
  const allMetrics = { ...metrics, ...resources.data?.metrics };
  const groups = monitoringObservationGroups(
    metrics,
    true,
    model.data?.backend,
    cacheFeatures
  );
  const visible = (key: string) =>
    !canOmitMetricGroup(groups[key] || [], allMetrics);
  const sections = orderMonitoringSections(
    [
      { key: 'service', label: t('pd.serviceExperience') },
      { key: 'pools', label: t('pd.rolePools') },
      { key: 'pd', label: t('pd.handoff') },
      { key: 'gpu', label: t('section.gpu') },
      { key: 'host', label: t('section.host') }
    ].filter((section) => visible(section.key))
  );
  const colorDomain = (instances.data || [])
    .map((instance) => `instance:${instance.id}`)
    .concat(
      (resources.data?.devices || []).map((device) => `device:${device.id}`),
      (resources.data?.workers || []).map((worker) => `worker:${worker.id}`)
    );
  return (
    <Flex
      ref={rootRef}
      className={styles.root}
      vertical
      gap={24}
      data-model-monitor-layout
      data-pd-model-monitoring
    >
      <ScopeToolbar
        onViewChange={changeView}
        extra={<ObservationNotes metrics={allMetrics} groups={groups} />}
      />
      <PDRoleOverview variant="monitoring" />
      <SectionNavigation
        sections={sections}
        expanded={expanded}
        onOpen={openSection}
        onChange={setExpanded}
        contextNote={t('runtimeHistory') + ' ' + t('hardwareHistory')}
      />
      <RequestNotice state={runtime} />
      <AvailabilityNotice
        available={runtime.data?.available}
        reason={runtime.data?.reason}
      />
      {runtime.data && (
        <PDMonitoringContent
          expandedSections={expanded}
          onExpandedSectionsChange={setExpanded}
          expandedDetails={details}
          onExpandedDetailsChange={setDetails}
          metrics={runtime.data?.metrics || {}}
          instances={instances.data || []}
          backend={model.data?.backend}
          cacheFeatures={cacheFeatures}
          mode={model.data?.disaggregation?.mode}
          view={scope.view}
          onViewChange={changeView}
          showViewControl={false}
          omitUnavailable
          sectionIds={{
            service: 'model-monitor-service',
            pools: 'model-monitor-pools',
            handoff: 'model-monitor-pd'
          }}
          renderChart={(spec) => (
            <MetricChart
              key={spec.key}
              metricKey={spec.metricKey}
              title={spec.title}
              metric={spec.metric}
              note={spec.help}
              source={spec.source}
              measures={spec.measures}
              extra={spec.extra}
              colorDomain={colorDomain}
              rateWindowSeconds={runtime.data?.rate_window_seconds}
              showSummary={false}
              compactEmpty={compactMetricEmpty(spec.metric)}
              interaction={interaction}
            />
          )}
        />
      )}
      {['gpu', 'host'].filter(visible).map((key) => (
        <MonitoringSection
          key={key}
          sectionKey={key}
          id={`model-monitor-${key}`}
          title={t(`section.${key}`)}
          help={`${t('sharedHardware')} ${t('hardwareHistory')}`}
          expanded={expanded.includes(key)}
          onToggle={(open) =>
            setExpanded(
              open
                ? [...new Set([...expanded, key])]
                : expanded.filter((item) => item !== key)
            )
          }
        >
          <Flex vertical gap={16}>
            <HardwareContent host={key === 'host'} interaction={interaction} />
            {key === 'gpu' && <ResourceTable showNotices={false} />}
          </Flex>
        </MonitoringSection>
      ))}
    </Flex>
  );
});

export default PDMonitoringTab;
