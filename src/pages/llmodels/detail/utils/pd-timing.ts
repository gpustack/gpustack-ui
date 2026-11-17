import type { ModelMetric } from '../config/types';
import { pdRoleMetric, type PDRole } from './pd-metrics';

// The global monitoring control selects statistics after composing measures.
// Preserve role-local samples and censoring bounds without recomputing quantiles.
export const pdTimingMetric = (
  metric: ModelMetric | undefined,
  role: PDRole
): ModelMetric | undefined => {
  const selected = pdRoleMetric(metric, role);
  if (!selected) return undefined;
  return {
    ...selected,
    series: selected.series.map((item) => ({
      ...item,
      comparisonMeasure: true
    }))
  };
};
