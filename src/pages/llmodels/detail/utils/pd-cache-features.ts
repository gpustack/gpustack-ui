import type { ModelMetric } from '../config/types';
import { finite, hasMetricSamples } from './metrics';

type EngineRole = 'prefill' | 'decode';

export const pdCacheHasObservations = (
  metric?: ModelMetric,
  role?: EngineRole
) => {
  if (!metric) return false;
  const selected = role
    ? {
        series: metric.series.filter((item) => item.dimensions.role === role),
        summaries: metric.summaries.filter(
          (item) => item.dimensions.role === role
        )
      }
    : metric;
  return (
    hasMetricSamples(selected) ||
    selected.summaries.some((item) => finite(item.value) != null)
  );
};
interface CacheSource {
  backend_parameters?: unknown;
  config_source?: string | null;
  extended_kv_cache?: { enabled?: unknown } | null;
}
export type PDCacheFeatures = Partial<
  Record<
    EngineRole,
    {
      prefix?: boolean;
      external?: boolean;
    }
  >
>;

const prefixFeature = (parameters: unknown): boolean | undefined => {
  if (
    !Array.isArray(parameters) ||
    !parameters.every((item) => typeof item === 'string')
  )
    return undefined;
  const states = new Set<boolean>();
  for (const [index, parameter] of parameters.entries()) {
    const match = parameter
      .trim()
      .match(
        /^(--(?:no-)?enable-prefix-caching|--disable-radix-cache|--disaggregation-decode-enable-radix-cache)(?:[=\s]+(true|false|0|1))?$/i
      );
    if (!match) continue;
    const next = parameters[index + 1]?.trim();
    const value =
      match[2] || (/^(true|false|0|1)$/i.test(next || '') ? next : 'true');
    const positive = /^(true|1)$/i.test(value);
    states.add(
      /--no-enable|--disable-radix/i.test(match[1]) ? !positive : positive
    );
  }
  // Unknown defaults, conflicting flags and heterogeneous snapshots never
  // justify hiding a cache observation.
  return states.size === 1 ? [...states][0] : undefined;
};

const sourceFeatures = (source: CacheSource) => {
  if (source.config_source === 'current_model')
    return { prefix: undefined, external: undefined };
  return {
    prefix: prefixFeature(source.backend_parameters),
    // PD connector lookups also count as external KV. Turning the managed
    // offload cache off does not disable this native observation family.
    external: source.extended_kv_cache?.enabled === true ? true : undefined
  };
};

export const pdCacheFeaturesFromModel = (
  model?:
    | (CacheSource & {
        roles?: (CacheSource & { name: string })[] | null;
      })
    | null
): PDCacheFeatures => {
  if (!model) return {};
  return Object.fromEntries(
    (['prefill', 'decode'] as const).map((role) => {
      const override = model.roles?.find((item) => item.name === role);
      return [
        role,
        sourceFeatures({
          backend_parameters:
            override?.backend_parameters ?? model.backend_parameters,
          extended_kv_cache:
            override?.extended_kv_cache ?? model.extended_kv_cache
        })
      ];
    })
  );
};

export const pdCacheFeaturesFromInstances = (
  instances: (CacheSource & { role?: string | null })[]
): PDCacheFeatures =>
  Object.fromEntries(
    (['prefill', 'decode'] as const).map((role) => {
      const members = instances
        .filter((item) => item.role === role)
        .map(sourceFeatures);
      const feature = (key: 'prefix' | 'external') => {
        const values = members.map((item) => item[key]);
        return values.length &&
          values.every((value) => value !== undefined && value === values[0])
          ? values[0]
          : undefined;
      };
      return [
        role,
        { prefix: feature('prefix'), external: feature('external') }
      ];
    })
  );
