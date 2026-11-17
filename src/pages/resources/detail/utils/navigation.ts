import { FALLBACK_MONITORING_CAPABILITIES } from '@/pages/llmodels/detail/config';
import type { ResourceTab, ResourceTarget, TimeScope } from '../config/types';

export const validResourceRange = (start: unknown, end: unknown) => {
  if (
    typeof start !== 'number' ||
    !Number.isFinite(start) ||
    start < 0 ||
    typeof end !== 'number' ||
    !Number.isFinite(end) ||
    end <= start ||
    end > Date.now() / 1000
  )
    return false;
  // Match the API's decimal boundary comparison even for one-millisecond
  // phases at Unix-epoch magnitudes; binary subtraction can fall below 0.001.
  const decimal = (value: number) => {
    const [coefficient, power = '0'] = String(value).toLowerCase().split('e');
    const [whole, fraction = ''] = coefficient.split('.');
    return {
      integer: BigInt(whole + fraction),
      power: Number(power) - fraction.length
    };
  };
  const left = decimal(start),
    right = decimal(end);
  const power = Math.min(left.power, right.power, -3);
  // Avoid exponent syntax: the browser build targets ES2015 and lowers ** to
  // Math.pow, which cannot accept BigInt operands.
  const powerOfTen = (exponent: number) => BigInt('1' + '0'.repeat(exponent));
  const scale = powerOfTen(-power);
  const span =
    right.integer * powerOfTen(right.power - power) -
    left.integer * powerOfTen(left.power - power);
  return (
    span >= scale / BigInt(1000) &&
    span <= BigInt(FALLBACK_MONITORING_CAPABILITIES.max_query_seconds) * scale
  );
};

export const resourceTimeParams = (scope: TimeScope) => {
  if (scope.start == null && scope.end == null) return { window: scope.window };
  if (!validResourceRange(scope.start, scope.end))
    throw new RangeError('Invalid fixed resource monitoring time range');
  return { start: scope.start!, end: scope.end! };
};

export const timeScopeFromParams = (params: URLSearchParams): TimeScope => {
  const start = params.has('start') ? Number(params.get('start')) : undefined;
  const end = params.has('end') ? Number(params.get('end')) : undefined;
  if (start != null || end != null) {
    if (validResourceRange(start, end)) return { window: '1h', start, end };
  }
  const window = params.get('window') || '1h';
  return {
    window: /^(5m|15m|30m|1h|3h|6h|12h|24h|2d|7d)$/.test(window) ? window : '1h'
  };
};
export const targetPath = (target: ResourceTarget) =>
  `/${target.kind === 'gpu' && !target.deviceId ? 'gpu-devices' : 'workers'}/${encodeURIComponent(target.id)}`;
export const targetParams = (target: ResourceTarget) =>
  target.deviceId ? { device_id: target.deviceId } : {};
export const resourceHref = (
  target: ResourceTarget,
  scope?: TimeScope,
  tab?: ResourceTab
) => {
  const params = new URLSearchParams();
  params.set(target.deviceId ? 'worker_id' : 'id', target.id);
  if (target.deviceId) params.set('device_id', target.deviceId);
  if (scope)
    Object.entries(resourceTimeParams(scope)).forEach(([key, value]) =>
      params.set(key, String(value))
    );
  if (tab && tab !== 'overview') params.set('tab', tab);
  return `#/resources/${target.kind === 'gpu' ? 'gpus' : 'workers'}/detail?${params}`;
};
