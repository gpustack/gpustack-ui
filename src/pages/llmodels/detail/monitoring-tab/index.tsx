import { ArrowRightOutlined } from '@ant-design/icons';
import {
  CardWrapper,
  Table as SealTable,
  SectionTitle
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Collapse, Flex, Row, Select, Typography } from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { isPDModel } from '../../config';
import {
  HardwareContent,
  ResourceSummary,
  combineMetrics
} from '../components/hardware-content';
import HelpTooltip from '../components/help-tooltip';
import MetricChart from '../components/metric-chart';
import {
  AvailabilityNotice,
  MetricNotice,
  MetricState,
  RequestNotice
} from '../components/metric-state';
import PerformanceStats from '../components/performance-stats';
import ResourceTable from '../components/resource-table';
import ScopeToolbar from '../components/scope-toolbar';
import { useDetail } from '../config/context';
import { selectRoleMetric } from '../utils/metrics';
import { effectiveRequestRole } from '../utils/request-role';
import { scrollWhenSectionSettles } from '../utils/section-navigation';
import { scopeTimeLabel } from '../utils/time-range';
import { withTokenTotal } from '../utils/token-throughput';
import SectionNavigation from './components/section-navigation';
import { routerMemberRows } from './utils/router-members';

export interface MonitoringTabHandle {
  openSection: (section: string) => void;
}
const MonitoringTab = forwardRef<MonitoringTabHandle>((_props, ref) => {
  const intl = useIntl();
  const { model, instances, runtime, resources, scope, changeScope } =
    useDetail();
  const [expanded, setExpanded] = useState<string[]>(['llm', 'gpu']);
  const cancelNavigation = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelNavigation.current?.(), []);
  const openSection = (section: string) => {
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
  const pd = isPDModel(model.data || {});
  const metrics = runtime.data?.metrics || {};
  const colorDomain = (instances.data || []).map(
    (instance) => `instance:${instance.id}`
  );
  const requestRole = effectiveRequestRole(scope, instances.data || []);
  const local = (key: string) =>
    selectRoleMetric(
      metrics[key],
      pd,
      ['tpot', 'itl'].includes(key) ? 'decode' : requestRole
    );
  const roleLabel = pd
    ? `${requestRole[0].toUpperCase() + requestRole.slice(1)} · `
    : '';
  const chart = (
    key: string,
    localRole = false,
    title?: string,
    note?: string
  ) => (
    <Col xs={24} xl={12} key={key}>
      <MetricChart
        colorDomain={colorDomain}
        rateWindowSeconds={runtime.data?.rate_window_seconds}
        metricKey={key}
        title={
          title ||
          `${localRole ? (['tpot', 'itl'].includes(key) && pd ? 'Decode · ' : roleLabel) : ''}${t(`metric.${key}`)}`
        }
        metric={localRole ? local(key) : metrics[key]}
        note={note || (localRole && pd ? t('localLatency') : undefined)}
      />
    </Col>
  );
  const llm = (
    <Flex vertical gap={16}>
      <Row gutter={[16, 16]}>
        {chart('ttft', true)}
        <Col xs={24} xl={12}>
          <MetricChart
            colorDomain={colorDomain}
            rateWindowSeconds={runtime.data?.rate_window_seconds}
            metricKey={scope.latencyMetric}
            title={`${pd ? 'Decode · ' : ''}${t(`metric.${scope.latencyMetric}`)}`}
            metric={local(scope.latencyMetric)}
            note={pd ? t('localLatency') : undefined}
            extra={
              <Select
                size="small"
                aria-label={t('generationView')}
                value={scope.latencyMetric}
                options={['tpot', 'itl'].map((value) => ({
                  value,
                  label: value.toUpperCase()
                }))}
                onChange={(latencyMetric) => changeScope({ latencyMetric })}
                style={{ minWidth: 82 }}
              />
            }
          />
        </Col>
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
            metric={
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
                    pd
                  })
            }
            note={
              [
                pd ? t('pdTokens') : undefined,
                scope.view === 'aggregate'
                  ? t('tokenTotalDefinition')
                  : undefined
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
          />
        </Col>
        <Col xs={24} xl={12}>
          <MetricChart
            colorDomain={colorDomain}
            rateWindowSeconds={runtime.data?.rate_window_seconds}
            metricKey="requests"
            measures={
              scope.view === 'instances'
                ? []
                : [t('metric.running_requests'), t('metric.waiting_requests')]
            }
            title={t(
              scope.view === 'instances'
                ? 'metric.waiting_requests'
                : 'requestQueues'
            )}
            metric={
              scope.view === 'instances'
                ? local('waiting_requests')
                : combineMetrics([
                    [t('metric.running_requests'), local('running_requests')],
                    [t('metric.waiting_requests'), local('waiting_requests')]
                  ])
            }
            note={pd ? roleLabel + t('roleQueues') : t('current')}
          />
        </Col>
      </Row>
    </Flex>
  );
  const stages = (
    <Flex vertical gap={16}>
      <Row gutter={[16, 16]}>
        {chart('e2e', true)}
        {chart('queue', true)}
        {chart('prefill')}
        {chart('decode')}
      </Row>
    </Flex>
  );
  const routerRows = routerMemberRows(
    metrics.router_health,
    instances.data || [],
    t('unresolvedMember')
  );
  const pdContent = (
    <>
      <Row gutter={[16, 16]}>
        {chart(
          'waiting_requests',
          false,
          t('pdQueues'),
          t('separateRoleQueues')
        )}
        {chart('kv_usage', false, t('pdKVUsage'), t('separateRoleKV'))}
        <Col xs={24} xl={12}>
          <MetricChart
            colorDomain={colorDomain}
            rateWindowSeconds={runtime.data?.rate_window_seconds}
            metricKey="pd_kv_transfer"
            title={
              metrics.pd_kv_transfer?.measurement_scope?.includes('bootstrap')
                ? t('bootstrap')
                : t('metric.pd_kv_transfer')
            }
            metric={metrics.pd_kv_transfer}
            note={t('handoffScope')}
          />
        </Col>
        <Col xs={24} xl={12}>
          <CardWrapper style={{ height: '100%' }}>
            <SectionTitle>{t('routerMembers')}</SectionTitle>
            <MetricNotice metric={metrics.router_health} />
            {!routerRows.length && (
              <MetricState metric={metrics.router_health} />
            )}
            <SealTable
              rowKey="id"
              dataSource={routerRows}
              loading={runtime.loading}
              columns={[
                { dataIndex: 'instance', title: t('instance'), minWidth: 160 },
                {
                  dataIndex: 'role',
                  title: t('role'),
                  minWidth: 90,
                  render: (role: string | null) =>
                    !role
                      ? t('unknown')
                      : role === 'inference'
                        ? t('inference')
                        : role[0].toUpperCase() + role.slice(1)
                },
                {
                  dataIndex: 'observer',
                  title: t('observedBy'),
                  minWidth: 160
                },
                {
                  dataIndex: 'value',
                  title: t('routerHealth'),
                  minWidth: 120,
                  render: (value: number | null) =>
                    t(
                      value === 1
                        ? 'healthy'
                        : value === 0
                          ? 'unhealthy'
                          : value === -1
                            ? 'removed'
                            : 'unknown'
                    )
                }
              ]}
              scroll={{ x: true }}
            />
          </CardWrapper>
        </Col>
      </Row>
    </>
  );
  const sections = [
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
    ...(pd ? [{ key: 'pd', label: t('section.pd'), children: pdContent }] : []),
    {
      key: 'gpu',
      label: t('section.gpu'),
      children: (
        <Flex vertical gap={16}>
          <HardwareContent />
          <ResourceTable />
        </Flex>
      )
    },
    {
      key: 'host',
      label: t('section.host'),
      children: <HardwareContent host />
    }
  ];
  const scopeLabel = scope.instanceIds.length
    ? intl.formatMessage(
        { id: 'modelMonitoring.instanceCount' },
        { count: scope.instanceIds.length }
      )
    : scope.role === 'all'
      ? t('allInstances')
      : scope.role;
  const sectionMeta = (section: string) => {
    if (section === 'llm')
      return `${scopeTimeLabel(scope)} · ${scopeLabel} · ${t(scope.view === 'instances' ? 'byInstance' : 'aggregate')}`;
    if (section === 'stages' || section === 'cache') return '';
    if (section === 'pd') return model.data?.disaggregation?.mode || 'PD';
    return scopeTimeLabel(scope);
  };
  const contextNote = `${t(runtime.data?.history_scope === 'current_instances_with_observed_source_history' ? 'runtimeHistory' : 'historyScope')}${resources.data ? ` ${t('hardwareHistory')}` : ''}`;
  const sectionHelp = (section: string) =>
    section === 'pd' ? t('pdNote') : section === 'cache' ? t('cacheScope') : '';
  const roles = [...(model.data?.roles || [])].sort((a, b) => {
    const order: Record<string, number> = { router: 0, prefill: 1, decode: 2 };
    return (order[a.name] ?? 3) - (order[b.name] ?? 3);
  });
  return (
    <Flex vertical gap={16} data-model-monitor-layout>
      <ScopeToolbar />
      <SectionNavigation
        sections={sections}
        expanded={expanded}
        onOpen={openSection}
        onChange={changeExpanded}
        contextNote={contextNote}
      />
      <RequestNotice state={runtime} />
      <AvailabilityNotice
        available={runtime.data?.available}
        reason={runtime.data?.reason}
      />
      {pd && (
        <>
          <Row gutter={[16, 16]}>
            {roles.map((role, index) => {
              const status = model.data?.role_status?.[role.name];
              return (
                <Col key={role.name} flex="1">
                  <Flex align="center" gap={12}>
                    <div
                      style={{
                        border: '1px solid var(--ant-color-border)',
                        borderRadius: 6,
                        padding: 12,
                        flex: 1
                      }}
                    >
                      <Flex justify="space-between">
                        <Flex align="center" gap={4}>
                          <Typography.Text strong>
                            {role.name[0].toUpperCase() + role.name.slice(1)}
                          </Typography.Text>
                          {role.name === 'router' && (
                            <HelpTooltip
                              label="Router"
                              content={`${t('deploymentTotal')} · ${t('notUpstreamHealth')}`}
                            />
                          )}
                        </Flex>
                        <span>
                          {status?.ready ?? '—'} /{' '}
                          {status?.desired ?? role.replicas} {t('ready')}
                        </span>
                      </Flex>
                      {!!status?.draining && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {t('draining')} {status.draining}
                        </Typography.Text>
                      )}
                    </div>
                    {index < roles.length - 1 && (
                      <ArrowRightOutlined
                        aria-hidden
                        style={{ color: 'var(--ant-color-text-tertiary)' }}
                      />
                    )}
                  </Flex>
                </Col>
              );
            })}
          </Row>
        </>
      )}
      <PerformanceStats />
      <ResourceSummary />
      <Collapse
        activeKey={expanded}
        onChange={(keys) =>
          changeExpanded(typeof keys === 'string' ? [keys] : keys)
        }
        items={sections.map((section) => ({
          ...section,
          label: (
            <Flex
              id={`model-monitor-${section.key}`}
              align="center"
              justify="space-between"
              gap={12}
              wrap
              style={{
                scrollMarginTop:
                  'calc(var(--model-monitor-nav-height, 56px) + var(--ant-padding-lg) + var(--ant-padding) + var(--ant-margin-xs))'
              }}
            >
              <Flex align="center" gap={4}>
                <Typography.Text strong>{section.label}</Typography.Text>
                {sectionHelp(section.key) && (
                  <span
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ')
                        event.stopPropagation();
                    }}
                  >
                    <HelpTooltip
                      label={section.label}
                      content={sectionHelp(section.key)}
                    />
                  </span>
                )}
              </Flex>
              {sectionMeta(section.key) && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {sectionMeta(section.key)}
                </Typography.Text>
              )}
            </Flex>
          )
        }))}
      />
    </Flex>
  );
});
export default MonitoringTab;
