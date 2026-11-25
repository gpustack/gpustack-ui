import type { StatusType } from '@/config/types';
import { DeploymentUnitOutlined } from '@ant-design/icons';
import {
  CardWrapper,
  SectionTitle,
  StatusDot,
  TextAttribute
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Descriptions,
  Flex,
  Row,
  Space,
  Tooltip,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import {
  isPDModel,
  modelReplicaCounts,
  ModelStateLabelMap,
  ModelStateMap
} from '../../config';
import ChartInteractionHelp from '../components/chart-interaction-help';
import DeploymentCacheSummary from '../components/deployment-cache-summary';
import { combineMetrics } from '../components/hardware-content';
import MetricChart from '../components/metric-chart';
import { RequestNotice } from '../components/metric-state';
import PDPerformanceStats from '../components/pd-performance-stats';
import PDRoleOverview from '../components/pd-role-overview';
import PerformanceStats from '../components/performance-stats';
import ResourceTable from '../components/resource-table';
import { useDetail } from '../config/context';
import type { DeploymentMetadata } from '../services/deployment-metadata';
import type { ResourceSnapshot } from '../services/scoped-resource';
import { hasMetricSamples, selectRoleMetric } from '../utils/metrics';
import { pdIngressMetric, pdRoleMetric } from '../utils/pd-metrics';
import { effectiveRequestRole } from '../utils/request-role';
import { scopeTimeLabel } from '../utils/time-range';
import { withTokenTotal } from '../utils/token-throughput';
const OverviewTab = ({
  metadata
}: {
  metadata: ResourceSnapshot<DeploymentMetadata>;
}) => {
  const intl = useIntl();
  const { model, instances, runtime, scope, setTab } = useDetail();
  const data = model.data;
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  if (!data) return null;
  const replicas = modelReplicaCounts(data);
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
    <Flex vertical gap={16} aria-busy={runtime.loading || metadata.loading}>
      <Flex align="center" justify="space-between" gap={8} wrap>
        <SectionTitle>{t('deploymentOverview')}</SectionTitle>
        {pd &&
          metadata.data?.target?.route_name &&
          metadata.data.target.route_name !== data.name && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('modelRoute')}: {metadata.data.target.route_name}
            </Typography.Text>
          )}
      </Flex>
      {!pd && (
        <CardWrapper>
          <Flex align="flex-start" gap={24} wrap>
            <Flex vertical align="center" gap={12} style={{ minWidth: 80 }}>
              <DeploymentUnitOutlined
                style={{
                  fontSize: 42,
                  color: 'var(--ant-color-primary)',
                  padding: 12
                }}
              />
              <StatusDot
                statusValue={{
                  status:
                    (ModelStateMap as Record<string, StatusType>)[
                      data.state || ''
                    ] || 'inactive',
                  text: intl.formatMessage({
                    id:
                      (ModelStateLabelMap as Record<string, string>)[
                        data.state || ''
                      ] || 'modelMonitoring.unknown'
                  })
                }}
              />
            </Flex>
            <Flex vertical gap={16} style={{ flex: '1 1 480px', minWidth: 0 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {data.name}
              </Typography.Title>
              <Descriptions
                column={{ xs: 1, sm: 2, xl: 3 }}
                items={[
                  {
                    key: 'backend',
                    label: t('backend'),
                    children: [data.backend, data.backend_version]
                      .filter(Boolean)
                      .join(' ')
                  },
                  {
                    key: 'source',
                    label: t('source'),
                    children:
                      data.huggingface_repo_id ||
                      data.model_scope_model_id ||
                      data.local_path ||
                      data.ollama_library_model_name ||
                      data.source
                  },
                  {
                    key: 'replicas',
                    label: t('instances'),
                    children: data.role_status
                      ? Object.entries(data.role_status)
                          .map(
                            ([name, status]) =>
                              `${name}: ${status.ready} / ${status.desired}`
                          )
                          .join(' · ')
                      : `${replicas.ready} / ${replicas.total}`
                  },
                  {
                    key: 'cluster',
                    label: t('cluster'),
                    children:
                      metadata.data?.clusterName ||
                      intl.formatMessage(
                        { id: 'modelMonitoring.clusterFallback' },
                        { id: data.cluster_id }
                      )
                  },
                  {
                    key: 'route',
                    label: t('modelRoute'),
                    children:
                      metadata.data?.target?.route_name ||
                      (metadata.loading ? '—' : t('metadataUnavailable'))
                  },
                  {
                    key: 'cache',
                    label: t('cacheConfiguration'),
                    children: (
                      <DeploymentCacheSummary
                        model={data}
                        metadata={metadata.data}
                      />
                    )
                  },
                  {
                    key: 'created',
                    label: t('created'),
                    children: data.created_at
                      ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')
                      : '—'
                  },
                  {
                    key: 'access',
                    label: t('access'),
                    children: data.access_policy
                  }
                ]}
              />
            </Flex>
          </Flex>
        </CardWrapper>
      )}
      {pd && <PDRoleOverview />}
      <RequestNotice state={runtime} showLoading={false} />
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Flex align="center" gap={4} wrap>
          <SectionTitle style={{ marginBlockEnd: 0 }}>
            {t('performance')}
          </SectionTitle>
          <Tooltip title={scopeTimeLabel(scope)}>
            <TextAttribute variant="outlined">
              {scope.start != null ? t('customTimeRange') : scope.window}
            </TextAttribute>
          </Tooltip>
          {!pd && scope.role !== 'all' && (
            <TextAttribute variant="outlined">{scope.role}</TextAttribute>
          )}
          {!pd && !!scope.instanceIds.length && (
            <TextAttribute variant="outlined">{scopeCount}</TextAttribute>
          )}
        </Flex>
        <Space>
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
          <Button type="link" onClick={() => setTab('monitoring')}>
            {t('viewMonitoring')} →
          </Button>
        </Space>
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
