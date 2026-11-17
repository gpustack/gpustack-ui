import type { ModelMetric } from '../config/types';
import { finite, hasMetricSamples } from './metrics';

export type MonitoringPage = 'deployment' | 'benchmark';

export const defaultMonitoringSections = (
  page: MonitoringPage,
  pd: boolean,
  metrics: Record<string, ModelMetric> = {}
): string[] => {
  const core = pd ? 'pools' : 'llm';
  const ingress = ['ingress_ttft', 'ingress_e2e'].some((key) => {
    const metric = metrics[key];
    if (metric?.measurement_scope !== 'service_ingress') return false;
    // Query failures are not an empty interval: keep their diagnosis visible.
    if (['query_error', 'restricted'].includes(metric.status)) return true;
    return (
      ['available', 'stale'].includes(metric.status) &&
      (hasMetricSamples(metric) ||
        metric.summaries.some((summary) => finite(summary.value) != null))
    );
  });
  return page === 'deployment' && ingress ? [core, 'service'] : [core];
};

export const orderMonitoringSections = <T extends { key: string }>(
  sections: T[]
): T[] => {
  const order = [
    'llm',
    'pools',
    'service',
    'stages',
    'cache',
    'pd',
    'gpu',
    'host'
  ];
  const rank = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? order.length : index;
  };
  return [...sections].sort((a, b) => rank(a.key) - rank(b.key));
};
