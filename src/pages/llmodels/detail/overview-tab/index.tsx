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
  Spin,
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
import {
  combineMetrics,
  ResourceSummary
} from '../components/hardware-content';
import MetricChart from '../components/metric-chart';
import { RequestNotice } from '../components/metric-state';
import PerformanceStats from '../components/performance-stats';
import ResourceTable from '../components/resource-table';
import { useDetail } from '../config/context';
import useDeploymentMetadata from '../hooks/use-deployment-metadata';
import { selectRoleMetric } from '../utils/metrics';
import { effectiveRequestRole } from '../utils/request-role';
import { scopeTimeLabel } from '../utils/time-range';
import { withTokenTotal } from '../utils/token-throughput';
const OverviewTab = () => {
  const intl = useIntl();
  const { model, instances, runtime, scope, setTab } = useDetail();
  const data = model.data;
  const metadata = useDeploymentMetadata(data);
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  if (!data) return null;
  const replicas = modelReplicaCounts(data);
  const pd = isPDModel(data);
  const metrics = runtime.data?.metrics || {};
  const requestRole = effectiveRequestRole(scope, instances.data || []);
  const role = requestRole[0].toUpperCase() + requestRole.slice(1);
  const scopeCount = scope.instanceIds.length
    ? intl.formatMessage(
        { id: 'modelMonitoring.instanceCount' },
        { count: scope.instanceIds.length }
      )
    : t('allInstances');
  const contextNote = `${t('currentScope')}: ${scopeTimeLabel(scope)} · ${scope.role === 'all' ? t('allRoles') : scope.role} · ${scopeCount}. ${t(runtime.data?.history_scope === 'current_instances_with_observed_source_history' ? 'runtimeHistory' : 'historyScope')}`;
  return (
    <Flex vertical gap={16}>
      <SectionTitle>{t('deploymentOverview')}</SectionTitle>
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
                  children: metadata.loading ? (
                    <Spin size="small" />
                  ) : (
                    metadata.data?.target?.route_name ||
                    t('metadataUnavailable')
                  )
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
      <RequestNotice state={runtime} />
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Flex align="center" gap={4} wrap>
          <SectionTitle>{t('performance')}</SectionTitle>
          <Tooltip title={scopeTimeLabel(scope)}>
            <TextAttribute variant="outlined">
              {scope.start != null ? t('customTimeRange') : scope.window}
            </TextAttribute>
          </Tooltip>
          {scope.role !== 'all' && (
            <TextAttribute variant="outlined">{scope.role}</TextAttribute>
          )}
          {!!scope.instanceIds.length && (
            <TextAttribute variant="outlined">{scopeCount}</TextAttribute>
          )}
        </Flex>
        <Space>
          <ChartInteractionHelp contextNote={contextNote} />
          <Button type="link" onClick={() => setTab('monitoring')}>
            {t('viewMonitoring')} →
          </Button>
        </Space>
      </Flex>
      <PerformanceStats />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <MetricChart
            colorDomain={(instances.data || []).map(
              (instance) => `instance:${instance.id}`
            )}
            rateWindowSeconds={runtime.data?.rate_window_seconds}
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
      <ResourceSummary />
      <ResourceTable />
    </Flex>
  );
};
export default OverviewTab;
