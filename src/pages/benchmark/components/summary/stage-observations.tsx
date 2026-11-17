import { displayMetricValue } from '@/pages/llmodels/detail/utils/metrics';
import { Table as SealTable } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Flex, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type {
  BenchmarkMonitoringData,
  BenchmarkTimeRange
} from '../../config/monitoring-types';
import {
  exactRange,
  phaseForPoint,
  phaseObservationSummary
} from '../../utils/monitoring';
import type { StagePoint } from './metrics';
import StageTable from './stage-table';

export const MonitoringNotice = ({
  data,
  hardware = false
}: {
  data: BenchmarkMonitoringData;
  hardware?: boolean;
}) => {
  const intl = useIntl();
  const error =
    data.errors[hardware ? 'resources' : 'runtime'] || data.errors.context;
  const response = hardware ? data.resources : data.runtime;
  const metrics = Object.values(response?.metrics || {});
  const restricted =
    (error as any)?.response?.status === 403 ||
    (hardware && data.context?.resource_status === 'restricted') ||
    response?.reason === 'restricted' ||
    (!!metrics.length &&
      metrics.every((metric) => metric.status === 'restricted'));
  const key =
    (error as any)?.code === 'benchmark_run_changed'
      ? 'runChanged'
      : error
        ? restricted
          ? 'restricted'
          : 'queryFailed'
        : restricted
          ? 'restricted'
          : data.context?.reason === 'historical_association_unavailable'
            ? 'historyNotRecorded'
            : data.context?.reason === 'historical_association_changed'
              ? 'historyAssociationChanged'
              : ['model_not_visible', 'model_instance_not_visible'].includes(
                    data.context?.reason || ''
                  )
                ? 'historyAssociationNotVisible'
                : metrics.some((metric) => metric.status === 'query_error')
                  ? 'queryFailed'
                  : response?.available !== true &&
                      data.context?.available === false &&
                      !data.context?.run_window
                    ? 'timingUnavailable'
                    : response?.available === false ||
                        (response?.available !== true &&
                          data.context?.available === false)
                      ? 'noHistory'
                      : metrics.some(
                            (metric) =>
                              metric.coverage?.partial ||
                              metric.reason === 'partial_metric_data'
                          )
                        ? 'partial'
                        : null;
  return key ? (
    <Alert
      showIcon
      type={key === 'queryFailed' || key === 'partial' ? 'warning' : 'info'}
      title={intl.formatMessage({ id: `benchmark.monitoring.${key}` })}
    />
  ) : null;
};

export const StageResourceDetails = ({
  data,
  range
}: {
  data: BenchmarkMonitoringData;
  range: BenchmarkTimeRange | null;
}) => {
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const rows = (data.context?.instances || []).map((instance) => {
    const devices = (data.resources?.devices || []).filter((device) =>
      device.model_instance_ids.includes(instance.id)
    );
    const gpu = phaseObservationSummary(
      data.resources,
      'gpu_utilization',
      range,
      {
        key: 'device_id',
        values: devices.map((device) => device.id)
      }
    );
    const kv = phaseObservationSummary(data.instances, 'kv_usage', range, {
      key: 'model_instance_id',
      values: [instance.id]
    });
    const cpu = phaseObservationSummary(data.resources, 'host_cpu', range, {
      key: 'worker_id',
      values: [
        ...new Set([
          ...(instance.worker_ids || []),
          ...(instance.worker_id == null ? [] : [instance.worker_id])
        ])
      ]
    });
    return { ...instance, devices, gpu, kv, cpu };
  });
  return (
    <Flex vertical gap={16}>
      <MonitoringNotice data={data} hardware />
      <Typography.Text type="secondary">
        {t('samplingDefinition')}
      </Typography.Text>
      <SealTable
        rowKey="id"
        loading={data.loading}
        dataSource={rows}
        scroll={{ x: true }}
        columns={[
          {
            key: 'name',
            dataIndex: 'name',
            title: t('instanceResources'),
            minWidth: 190,
            render: (_: unknown, row: (typeof rows)[number]) => (
              <Flex vertical gap={4}>
                <strong>
                  {row.name} · {row.role || t('inference')}
                </strong>
                <Typography.Text type="secondary">
                  {row.devices
                    .map(
                      (device) => `${device.worker_name} / GPU ${device.index}`
                    )
                    .join(' · ') || '—'}
                </Typography.Text>
              </Flex>
            )
          },
          {
            key: 'gpu',
            dataIndex: 'gpu',
            title: t('gpuAveragePeak'),
            minWidth: 160,
            render: (_: unknown, row: (typeof rows)[number]) => (
              <Tooltip
                trigger={['hover', 'focus']}
                title={
                  <Flex vertical gap={4}>
                    <span>
                      {t('peakAt')}:{' '}
                      {row.gpu.peakTime == null
                        ? '—'
                        : dayjs(row.gpu.peakTime * 1000).format('HH:mm:ss')}
                    </span>
                    <span>
                      {t('highSamples')}:{' '}
                      {displayMetricValue(row.gpu.highShare, 'percent')}
                    </span>
                    <span>
                      {t('samples')}: {row.gpu.count}
                    </span>
                    <span>
                      {t('samplingCoverage')}:{' '}
                      {row.gpu.expected == null
                        ? '—'
                        : `${row.gpu.count} / ${row.gpu.expected}`}
                    </span>
                    <span>
                      {t('peakDevice')}:{' '}
                      {row.devices.find(
                        (device) =>
                          device.id === row.gpu.peakDimensions?.device_id
                      )?.name || '—'}
                    </span>
                  </Flex>
                }
              >
                <span tabIndex={0}>
                  {displayMetricValue(row.gpu.avg, 'percent')} /{' '}
                  {displayMetricValue(row.gpu.peak, 'percent')}
                </span>
              </Tooltip>
            )
          },
          {
            key: 'kv',
            dataIndex: 'kv',
            title: t('kvPeak'),
            minWidth: 120,
            render: (_: unknown, row: (typeof rows)[number]) =>
              displayMetricValue(row.kv.peak, 'percent')
          },
          {
            key: 'cpu',
            dataIndex: 'cpu',
            title: t('cpuPeak'),
            minWidth: 120,
            render: (_: unknown, row: (typeof rows)[number]) =>
              displayMetricValue(row.cpu.peak, 'percent')
          },
          {
            key: 'memory',
            dataIndex: 'memory',
            title: t('memoryEnd'),
            minWidth: 210,
            render: (_: unknown, row: (typeof rows)[number]) => (
              <Flex vertical gap={4}>
                {row.devices.length
                  ? row.devices.map((device) => (
                      <span key={device.id}>
                        GPU {device.index}:{' '}
                        {displayMetricValue(
                          phaseObservationSummary(
                            data.resources,
                            'gpu_memory_used',
                            range,
                            {
                              key: 'device_id',
                              values: [device.id]
                            }
                          ).end,
                          'bytes'
                        )}{' '}
                        /{' '}
                        {displayMetricValue(
                          phaseObservationSummary(
                            data.resources,
                            'gpu_memory_total',
                            range,
                            {
                              key: 'device_id',
                              values: [device.id]
                            }
                          ).end,
                          'bytes'
                        )}
                      </span>
                    ))
                  : '—'}
              </Flex>
            )
          }
        ]}
      />
    </Flex>
  );
};

export default function StageObservations({
  points,
  selectedId,
  onSelect,
  data,
  dataForPoint
}: {
  points: StagePoint[];
  selectedId?: number | null;
  onSelect: (point: StagePoint) => void;
  data: BenchmarkMonitoringData;
  dataForPoint: (point: StagePoint) => BenchmarkMonitoringData;
}) {
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const rows = points.map((point, index) => {
    const range = exactRange(phaseForPoint(point, data.context?.stages || []));
    return { id: point.id, point, index, range, source: dataForPoint(point) };
  });
  return (
    <Flex vertical gap={16}>
      <MonitoringNotice data={data} hardware />
      <StageTable
        rowKey="id"
        dataSource={rows}
        loading={data.loading}
        scroll={{ x: true }}
        selectedId={selectedId}
        onSelect={(row) => onSelect(row.point)}
        columns={[
          {
            key: 'stage',
            dataIndex: 'stage',
            title: t('stage'),
            minWidth: 120,
            render: (_: unknown, row: (typeof rows)[number]) =>
              `${row.index + 1} · ${row.point.load}`
          },
          ...[
            ['gpu_utilization', 'gpuPeak', 'percent'],
            ['kv_usage', 'kvPeak', 'percent'],
            ['waiting_requests', 'waitingPeak', 'requests'],
            ['host_cpu', 'cpuPeak', 'percent']
          ].map(([key, label, unit]) => ({
            key,
            dataIndex: key,
            title: t(label),
            minWidth: 140,
            render: (_: unknown, row: (typeof rows)[number]) =>
              displayMetricValue(
                phaseObservationSummary(
                  key === 'gpu_utilization' || key === 'host_cpu'
                    ? row.source.resources
                    : row.source.runtime,
                  key,
                  row.range
                ).peak,
                unit
              )
          })),
          {
            key: 'state',
            dataIndex: 'state',
            title: t('sampling'),
            minWidth: 160,
            render: (_: unknown, row: (typeof rows)[number]) =>
              t(
                !row.range
                  ? 'timingUnavailable'
                  : row.source.loading
                    ? 'loading'
                    : !row.source.resources && !row.source.errors.resources
                      ? 'notLoaded'
                      : row.source.context?.resource_status === 'restricted' ||
                          (row.source.errors.resources as any)?.response
                            ?.status === 403
                        ? 'restricted'
                        : row.source.errors.resources
                          ? 'queryFailed'
                          : row.source.resources?.available === false
                            ? 'noHistory'
                            : Object.values({
                                  ...row.source.runtime?.metrics,
                                  ...row.source.resources?.metrics
                                }).some((metric) => metric.coverage?.partial)
                              ? 'partial'
                              : phaseObservationSummary(
                                    row.source.resources,
                                    'gpu_utilization',
                                    row.range
                                  ).count
                                ? 'sampled'
                                : 'noHistory'
              )
          }
        ]}
      />
    </Flex>
  );
}
