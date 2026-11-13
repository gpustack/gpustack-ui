import type {
  ModelMetric,
  ModelResourceMetrics,
  ResourceDevice
} from '../config/types';
import { finite } from '../utils/metrics';
import { gpuDeviceLabel } from '../utils/resources';

export const resourceWorkerNames = (data?: ModelResourceMetrics) => {
  const workers = new Map<number, string>();
  for (const device of data?.devices || []) {
    workers.set(device.worker_id, device.worker_name);
  }
  for (const worker of data?.workers || []) workers.set(worker.id, worker.name);
  return workers;
};

export const labelHardwareMetric = (
  metric: ModelMetric | undefined,
  data: ModelResourceMetrics | undefined,
  host: boolean,
  chipLabel: string
): ModelMetric | undefined => {
  if (!metric) return metric;
  const workers = resourceWorkerNames(data);
  return {
    ...metric,
    series: metric.series.map((series) => {
      const dimensions = series.dimensions;
      const device = data?.devices.find(
        (item) => item.id === dimensions.device_id
      );
      const workerName =
        dimensions.worker_id != null
          ? workers.get(dimensions.worker_id) ||
            `Worker #${dimensions.worker_id}`
          : undefined;
      return {
        ...series,
        name: host
          ? workerName || series.name
          : device
            ? `${device.worker_name} / ${gpuDeviceLabel(device, chipLabel)}`
            : series.name
      };
    })
  };
};

// Device inspection must never inherit another GPU's history or availability.
// Current inventory readings are separate from these historical observations.
export const selectDeviceMetric = (
  metric: ModelMetric | undefined,
  device: ResourceDevice,
  key: string
): ModelMetric | undefined => {
  if (!metric) return metric;
  const series = metric.series.filter(
    (item) => item.dimensions.device_id === device.id
  );
  const summaries = metric.summaries.filter(
    (item) => item.dimensions.device_id === device.id
  );
  const selected = { ...metric, series, summaries };
  if (
    device.scope === 'partition' &&
    ['gpu_utilization', 'gpu_power', 'gpu_temperature'].includes(key)
  ) {
    return {
      ...selected,
      series: [],
      summaries: [],
      status: 'unsupported',
      reason: 'metric_not_provided'
    };
  }
  const current = summaries.some((item) => finite(item.value) != null);
  const history = series.some((item) =>
    item.points.some(([, value]) => finite(value) != null)
  );
  if (current || history) {
    return {
      ...selected,
      status: current ? 'available' : 'stale',
      reason: current ? null : 'no_recent_samples'
    };
  }
  if (
    ['query_error', 'unsupported', 'restricted', 'not_applicable'].includes(
      metric.status
    )
  ) {
    return selected;
  }
  const reason =
    device.reason === 'device_identity_unresolved' ||
    device.reason === 'legacy_history_unavailable'
      ? device.reason
      : 'no_samples';
  return {
    ...selected,
    status: reason === 'no_samples' ? 'no_data' : 'unsupported',
    reason
  };
};
