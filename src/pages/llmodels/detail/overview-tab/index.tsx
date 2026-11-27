import { TextAttribute } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Col, Flex, Row, Tooltip, Typography } from 'antd';
import { isPDModel } from '../../config';
import ChartInteractionHelp from '../components/chart-interaction-help';
import { combineMetrics } from '../components/hardware-content';
import MetricChart from '../components/metric-chart';
import { RequestNotice } from '../components/metric-state';
import PDPerformanceStats from '../components/pd-performance-stats';
import PDRoleOverview from '../components/pd-role-overview';
import PerformanceStats from '../components/performance-stats';
import ResourceTable from '../components/resource-table';
import { useDetail } from '../config/context';
import { hasMetricSamples, selectRoleMetric } from '../utils/metrics';
import { pdIngressMetric, pdRoleMetric } from '../utils/pd-metrics';
import { effectiveRequestRole } from '../utils/request-role';
import { scopeTimeLabel } from '../utils/time-range';
import { withTokenTotal } from '../utils/token-throughput';
const OverviewTab = () => {
  const intl = useIntl();
  const { model, instances, runtime, scope, changeScope, setTab } = useDetail();
  const data = model.data;
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  if (!data) return null;
  const pd = isPDModel(data);
  const metrics = runtime.data?.metrics || {};
  const requestRole = effectiveRequestRole(scope, instances.data || []);
  const ingress = pdIngressMetric(metrics.ingress_ttft);
  const showIngress = hasMetricSamples(ingress);
  const role = requestRole[0].toUpperCase() + requestRole.slice(1);
  const scopeCount = scope.instanceIds.length
    ? intl.formatMessage(
        { id: 'modelMonitoring.instanceCount' },
        { count: scope.instanceIds.length }
      )
    : t('allInstances');
  const contextNote = `${t('currentScope')}: ${scopeTimeLabel(scope)} · ${pd || scope.role === 'all' ? t('allRoles') : scope.role} · ${pd ? t('allInstances') : scopeCount}. ${t(runtime.data?.history_scope === 'current_instances_with_observed_source_history' ? 'runtimeHistory' : 'historyScope')}`;
  return (
    <Flex vertical gap={16} aria-busy={runtime.loading}>
      {pd && <PDRoleOverview />}
      <RequestNotice state={runtime} showLoading={false} />
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Flex align="center" gap={6} wrap>
          <Typography.Text type="secondary">
            {t('currentScope')} ·{' '}
            <Tooltip title={scopeTimeLabel(scope)}>
              <span>
                {scope.start != null ? t('customTimeRange') : scope.window}
              </span>
            </Tooltip>
            {pd || (!scope.instanceIds.length && scope.role === 'all')
              ? ` · ${t('allInstances')}`
              : ''}
          </Typography.Text>
          {!pd && scope.role !== 'all' && (
            <TextAttribute variant="outlined">{scope.role}</TextAttribute>
          )}
          {!pd && !!scope.instanceIds.length && (
            <TextAttribute variant="outlined">{scopeCount}</TextAttribute>
          )}
          {!pd && (scope.role !== 'all' || !!scope.instanceIds.length) && (
            <Button
              type="link"
              size="small"
              aria-label={t('clearInstances')}
              onClick={() => changeScope({ role: 'all', instanceIds: [] })}
              style={{ paddingInline: 4 }}
            >
              {t('allInstances')}
            </Button>
          )}
          <ChartInteractionHelp
            contextNote={contextNote}
            additionalContent={
              pd ? (
                <Flex vertical gap={8}>
                  <span>{t('pd.scopeHelp')}</span>
                </Flex>
              ) : undefined
            }
          />
        </Flex>
        <Button
          type="link"
          size="small"
          style={{ paddingInline: 0 }}
          onClick={() => setTab('monitoring')}
        >
          {t('viewMonitoring')} →
        </Button>
      </Flex>
      {pd ? <PDPerformanceStats /> : <PerformanceStats />}
      {pd ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <MetricChart
              colorDomain={(instances.data || []).map(
                (instance) => `instance:${instance.id}`
              )}
              showSummary={false}
              rateWindowSeconds={runtime.data?.rate_window_seconds}
              source={
                showIngress
                  ? t('pd.serviceObservation')
                  : `Prefill · ${t('pd.engineObservation')}`
              }
              metricKey={showIngress ? 'ingress_ttft' : 'input_tokens'}
              title={
                showIngress
                  ? t('pd.ingressTTFT')
                  : `Prefill · ${t('metric.input_tokens')}`
              }
              metric={
                showIngress
                  ? ingress
                  : pdRoleMetric(metrics.input_tokens, 'prefill')
              }
              note={
                showIngress
                  ? t('pd.ingressHelp')
                  : t('pd.prefillResponsibility')
              }
            />
          </Col>
          <Col xs={24} xl={12}>
            <MetricChart
              colorDomain={(instances.data || []).map(
                (instance) => `instance:${instance.id}`
              )}
              showSummary={false}
              rateWindowSeconds={runtime.data?.rate_window_seconds}
              source={`Decode · ${t('pd.engineObservation')}`}
              metricKey="output_tokens"
              title={t('pd.output')}
              metric={pdRoleMetric(metrics.output_tokens, 'decode')}
              note={t('pd.decodeResponsibility')}
            />
          </Col>
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <MetricChart
              colorDomain={(instances.data || []).map(
                (instance) => `instance:${instance.id}`
              )}
              rateWindowSeconds={runtime.data?.rate_window_seconds}
              showSummary={false}
              metricKey="ttft"
              title={`${pd ? `${role} · ` : ''}${t('metric.ttft')}`}
              metric={selectRoleMetric(metrics.ttft, pd, requestRole)}
              note={pd ? t('localLatency') : undefined}
            />
          </Col>
          <Col xs={24} xl={12}>
            <MetricChart
              colorDomain={(instances.data || []).map(
                (instance) => `instance:${instance.id}`
              )}
              metricKey="tokens"
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
              measures={
                scope.view === 'instances'
                  ? []
                  : [
                      t('metric.input_tokens'),
                      t('metric.output_tokens'),
                      t('metric.total_tokens')
                    ]
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
        </Row>
      )}
      {pd ? <PDRoleOverview variant="table" /> : <ResourceTable />}
    </Flex>
  );
};
export default OverviewTab;
