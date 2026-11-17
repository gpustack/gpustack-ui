import type { MonitoringCapabilities } from './types';

export const QUICK_TIME_RANGES = [
  ['5m', 300],
  ['15m', 900],
  ['30m', 1800],
  ['1h', 3600],
  ['3h', 10800],
  ['6h', 21600],
  ['12h', 43200],
  ['24h', 86400],
  ['2d', 172800],
  ['7d', 604800]
] as const;

export const FALLBACK_MONITORING_CAPABILITIES: MonitoringCapabilities = {
  min_query_seconds: 300,
  max_query_seconds: 604800,
  retention_seconds: null,
  retention_size_based: false,
  retention_known: false,
  retention_source: 'unknown',
  supports_custom_range: false
};
