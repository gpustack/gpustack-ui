import { resourceHref } from '@/pages/resources/detail/utils/navigation';
import { GSDrawer, SectionTitle } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Flex,
  Row,
  Select,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import { useDetail } from '../config/context';
import type {
  MetricComponentWarning,
  MetricView,
  ModelMetric
} from '../config/types';
import { displayValue, finite, seriesIdentity } from '../utils/metrics';
import { gpuDeviceLabel } from '../utils/resources';
import {
  labelHardwareMetric,
  resourceWorkerNames,
  selectDeviceMetric
} from './hardware-metrics';
import HelpTooltip from './help-tooltip';
import MetricChart from './metric-chart';
import { AvailabilityNotice, RequestNotice } from './metric-state';

export const combineMetrics = (
  entries: [string, ModelMetric | undefined][]
): MetricView | undefined => {
  const present = entries.filter(
    (entry): entry is [string, ModelMetric] => !!entry[1]
  );
  if (!present.length) return undefined;
  const available = present.find(([, metric]) => metric.status === 'available');
  const componentWarnings: MetricComponentWarning[] = entries.flatMap(
    ([label, metric]) =>
      !metric
        ? [{ label, status: 'no_data' as const, reason: 'no_samples' }]
        : metric.status !== 'available' || metric.reason
          ? [{ label, status: metric.status, reason: metric.reason }]
          : []
  );
  return {
    ...(available || present[0])[1],
    reason:
      available && componentWarnings.length
        ? 'partial_metric_data'
        : (available || present[0])[1].reason,
    componentWarnings,
    series: present.flatMap(([name, metric]) =>
      metric.series.map((series) => ({
        ...series,
        compositionKey: JSON.stringify([name, seriesIdentity(series)]),
        name: `${name} · ${series.name}`
      }))
    ),
    summaries: present.flatMap(([, metric]) => metric.summaries)
  };
};
export const ResourceSummary = () => {
  const intl = useIntl();
  const { resources, setTab, tab, openMonitoringSection } = useDetail();
  const devices = resources.data?.devices || [];
  const values = devices
    .map((device) => finite(device.current?.gpu_utilization))
    .filter((value): value is number => value != null);
  const memory = devices.flatMap((device) => {
    const used = finite(device.current?.gpu_memory_used),
      total = finite(device.current?.gpu_memory_total);
    return used != null && total != null && total > 0
      ? [(100 * used) / total]
      : [];
  });
  return (
    <Flex
      align="center"
      justify="space-between"
      wrap
      gap={12}
      style={{
        border: '1px solid var(--ant-color-border)',
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 16
      }}
    >
      <Typography.Text>
        {intl.formatMessage({ id: 'modelMonitoring.gpuResources' })} ·{' '}
        {resources.data
          ? `${resources.data.allocated_gpu_count} GPU · ${resources.data.allocated_worker_count} Worker`
          : '—'}
        <HelpTooltip
          label={intl.formatMessage({ id: 'modelMonitoring.gpuResources' })}
          content={
            <Flex vertical gap={8}>
              <span>
                {intl.formatMessage({ id: 'modelMonitoring.sharedHardware' })}
              </span>
              <span>
                {intl.formatMessage({
                  id: 'modelMonitoring.liveResourceSnapshot'
                })}
              </span>
            </Flex>
          }
        />
      </Typography.Text>
      <Typography.Text>
        {intl.formatMessage({ id: 'modelMonitoring.highestGPUUtilization' })}{' '}
        <strong>
          {displayValue(values.length ? Math.max(...values) : null, 'percent')}{' '}
          %
        </strong>
      </Typography.Text>
      <Typography.Text>
        {intl.formatMessage({ id: 'modelMonitoring.highestGPUMemoryUsage' })}{' '}
        <strong>
          {displayValue(memory.length ? Math.max(...memory) : null, 'percent')}{' '}
          %
        </strong>
      </Typography.Text>
      {tab !== 'gpu' && (
        <Button
          type="link"
          onClick={() =>
            tab === 'monitoring' ? openMonitoringSection('gpu') : setTab('gpu')
          }
        >
          {intl.formatMessage({
            id:
              tab === 'monitoring'
                ? 'modelMonitoring.viewGPUTrends'
                : 'modelMonitoring.viewResources'
          })}{' '}
          →
        </Button>
      )}
    </Flex>
  );
};
export const HardwareContent = ({ host = false }: { host?: boolean }) => {
  const { resources } = useDetail();
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const data = resources.data || undefined;
  const metrics = data?.metrics || {};
  const workers = resourceWorkerNames(data);
  const metricFor = (key: string) =>
    labelHardwareMetric(metrics[key], data, host, t('chip'));
  const keys = host
    ? ['host_cpu', 'host_memory_used']
    : ['gpu_utilization', 'gpu_memory_used', 'gpu_power', 'gpu_temperature'];
  return (
    <Flex vertical gap={16}>
      <RequestNotice state={resources} />
      <AvailabilityNotice
        available={resources.data?.available}
        reason={resources.data?.reason}
        history
      />
      <Flex gap={12} align="center" wrap>
        <Typography.Text type="secondary">
          {host ? `${workers.size} Worker` : `${data?.devices.length || 0} GPU`}
        </Typography.Text>
        <HelpTooltip
          label={t(host ? 'allAssociatedWorkers' : 'allAssociatedGPUs')}
          content={
            <Flex vertical gap={8}>
              <span>{t('sharedHardware')}</span>
              <span>{t('hardwareHistory')}</span>
            </Flex>
          }
        />
      </Flex>
      {data && data.all_devices !== true && (
        <Alert
          showIcon
          type="info"
          title={t('allDevicesHistoryRequiresBackend')}
        />
      )}
      <Row gutter={[16, 16]}>
        {keys.map((key) => {
          const memory = key.endsWith('memory_used');
          const metric = memory
            ? combineMetrics([
                [t('usedMemory'), metricFor(key)],
                [t('totalMemory'), metricFor(key.replace('_used', '_total'))]
              ])
            : metricFor(key);
          return (
            <Col xs={24} xl={12} key={key}>
              <MetricChart
                colorDomain={(resources.data?.devices || [])
                  .map((device) => `device:${device.id}`)
                  .concat(
                    (resources.data?.workers || []).map(
                      (worker) => `worker:${worker.id}`
                    )
                  )}
                metricKey={key}
                title={t(`metric.${key}`)}
                metric={metric}
                measures={
                  memory ? [t('usedMemory'), t('totalMemory')] : undefined
                }
                neutralMeasures={memory ? [t('totalMemory')] : undefined}
                note={t('sharedHardware')}
              />
            </Col>
          );
        })}
      </Row>
    </Flex>
  );
};
export const DeviceDrawer = ({
  deviceId,
  onClose
}: {
  deviceId: string | null;
  onClose: () => void;
}) => {
  const intl = useIntl();
  const { resources, instances, scope, inspectDevice, changeScope, setTab } =
    useDetail();
  const currentDevice = resources.data?.devices.find(
    (item) => item.id === deviceId
  );
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const related = currentDevice
    ? (resources.data?.devices || []).filter(
        (device) =>
          device.id === currentDevice.id ||
          device.model_instance_ids.some((id) =>
            currentDevice.model_instance_ids.includes(id)
          )
      )
    : [];
  const associated = (instances?.data || []).filter((instance) =>
    currentDevice?.model_instance_ids.includes(instance.id)
  );
  return (
    <GSDrawer
      extra={
        currentDevice ? (
          <Button
            type="link"
            href={resourceHref(
              {
                kind: 'gpu',
                id: String(currentDevice.worker_id),
                deviceId: currentDevice.id
              },
              scope
            )}
          >
            {intl.formatMessage({ id: 'resourceDetail.fullDetails' })}
          </Button>
        ) : undefined
      }
      title={
        <Flex component="span" align="center" gap={4}>
          <span>
            {currentDevice
              ? `${currentDevice.worker_name} / ${gpuDeviceLabel(currentDevice, t('chip'))}`
              : t('device')}
          </span>
          <HelpTooltip label={t('device')} content={t('sharedHardware')} />
        </Flex>
      }
      open={!!deviceId && (resources.loading || !!currentDevice)}
      onClose={onClose}
      destroyOnHidden
      styles={{
        wrapper: { width: 520 },
        body: { paddingInline: 'var(--ant-padding-lg)' }
      }}
    >
      {!currentDevice && resources.loading && (
        <RequestNotice state={resources} />
      )}
      {currentDevice && (
        <Flex vertical gap={16}>
          <Select
            aria-label={t('device')}
            value={currentDevice.id}
            options={related.map((device) => ({
              value: device.id,
              label: `${device.worker_name} / ${gpuDeviceLabel(device, t('chip'))}`
            }))}
            onChange={(id) => {
              const selected = related.find((device) => device.id === id);
              if (selected) inspectDevice(selected);
            }}
          />
          <Row gutter={[12, 12]} aria-label={t('current')}>
            {[
              {
                key: 'gpu_utilization',
                value: `${displayValue(currentDevice.current?.gpu_utilization, 'percent')} %`
              },
              {
                key: 'gpu_memory_used',
                value: `${displayValue(currentDevice.current?.gpu_memory_used, 'bytes')} GiB`,
                detail: `/ ${displayValue(currentDevice.current?.gpu_memory_total, 'bytes')} GiB`
              },
              {
                key: 'gpu_temperature',
                value: `${displayValue(currentDevice.current?.gpu_temperature, 'celsius')} °C`
              }
            ].map((item) => (
              <Col xs={24} sm={8} key={item.key}>
                <Flex
                  vertical
                  gap={8}
                  style={{
                    height: '100%',
                    padding: 'var(--ant-padding-sm)',
                    background: 'var(--ant-color-fill-quaternary)',
                    borderRadius: 'var(--ant-border-radius)'
                  }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t(`metric.${item.key}`)}
                  </Typography.Text>
                  <Typography.Text
                    strong
                    style={{ fontSize: 24, lineHeight: 1.2 }}
                  >
                    {item.value}
                  </Typography.Text>
                  {item.detail && (
                    <Typography.Text type="secondary">
                      {item.detail}
                    </Typography.Text>
                  )}
                </Flex>
              </Col>
            ))}
          </Row>
          <Descriptions
            column={1}
            items={[
              { key: 'name', label: t('device'), children: currentDevice.name },
              {
                key: 'worker',
                label: 'Worker',
                children: currentDevice.worker_name
              },
              {
                key: 'scope',
                label: t('scope'),
                children:
                  currentDevice.scope === 'partition'
                    ? t('partition')
                    : t('physicalGPU')
              },
              {
                key: 'power',
                label: t('metric.gpu_power'),
                children: `${displayValue(currentDevice.current?.gpu_power, 'watts')} W`
              },
              {
                key: 'instances',
                label: `${t('instance')} / ${t('role')}`,
                children: (
                  <Flex vertical gap={4}>
                    {currentDevice.model_instance_ids.map((id) => {
                      const instance = associated.find(
                        (item) => item.id === id
                      );
                      return (
                        <span key={id}>
                          {instance?.name || `#${id}`} ·{' '}
                          {instance
                            ? instance.role || t('inference')
                            : t('unknown')}
                        </span>
                      );
                    })}
                  </Flex>
                )
              },
              { key: 'window', label: t('window'), children: scope.window },
              {
                key: 'reported',
                label: t('reportedAt'),
                children: currentDevice.last_reported_at
                  ? dayjs(currentDevice.last_reported_at * 1000).format(
                      'YYYY-MM-DD HH:mm:ss'
                    )
                  : '—'
              },
              {
                key: 'history',
                label: t('history'),
                children: t(
                  currentDevice.history_available
                    ? 'historyAvailable'
                    : 'historyUnavailable'
                )
              }
            ]}
          />
          <SectionTitle>{t('selectedDeviceHistory')}</SectionTitle>
          <RequestNotice state={resources} />
          <MetricChart
            colorDomain={(resources.data?.devices || [])
              .map((device) => `device:${device.id}`)
              .concat(
                (resources.data?.workers || []).map(
                  (worker) => `worker:${worker.id}`
                )
              )}
            metricKey="gpu_utilization"
            title={t('metric.gpu_utilization')}
            note={t('sharedHardware')}
            metric={selectDeviceMetric(
              resources.data?.metrics.gpu_utilization,
              currentDevice,
              'gpu_utilization'
            )}
          />
          <Button
            type="primary"
            disabled={!currentDevice.model_instance_ids.length}
            onClick={() => {
              onClose();
              changeScope({ instanceIds: currentDevice.model_instance_ids });
              setTab('instances');
            }}
          >
            {t('viewRelatedInstances')}
          </Button>
        </Flex>
      )}
    </GSDrawer>
  );
};
