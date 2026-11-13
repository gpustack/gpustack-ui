import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FALLBACK_MONITORING_CAPABILITIES } from '../../config';
import {
  applyMonitoringScopePatch,
  durationLabel,
  monitoringCapabilities,
  scopeTimeLabel,
  scopeTimeParams,
  validateTimeRange
} from '../time-range';

const base: any = {
  window: '1h',
  role: 'decode',
  instanceIds: [7],
  view: 'instances',
  latencyMetric: 'tpot',
  deviceId: 'gpu-0'
};
const limits = FALLBACK_MONITORING_CAPABILITIES;

test('fixed time validation accepts exact service boundaries without treating retention as a start-time cutoff', () => {
  assert.equal(validateTimeRange(1000, 1300, limits, 2000000), null);
  assert.equal(validateTimeRange(1000, 605800, limits, 2000000), null);
  assert.equal(validateTimeRange(1000, 1299, limits, 2000000), 'tooShort');
  assert.equal(validateTimeRange(1000, 605801, limits, 2000000), 'tooLong');
  assert.equal(validateTimeRange(1300, 1000, limits, 2000000), 'invalid');
  assert.equal(validateTimeRange(1000.5, 1400, limits, 2000000), 'invalid');
  assert.equal(validateTimeRange(NaN, 1400, limits, 2000000), 'invalid');
  assert.equal(validateTimeRange(1000, 1400, limits, 1399), 'future');
  assert.equal(validateTimeRange(undefined, 1400, limits, 2000000), 'missing');
});

test('applying absolute and quick ranges preserves the instance, role and view population and fixed refresh parameters', () => {
  const absolute = applyMonitoringScopePatch(base, { start: 1000, end: 4600 });
  assert.deepEqual(scopeTimeParams(absolute), { start: 1000, end: 4600 });
  assert.deepEqual(scopeTimeParams(absolute), scopeTimeParams({ ...absolute }));
  assert.equal(absolute.window, '1h');
  assert.equal(absolute.view, 'instances');
  assert.deepEqual(absolute.instanceIds, [7]);
  assert.equal(absolute.role, 'decode');
  const relative = applyMonitoringScopePatch(absolute, { window: '24h' });
  assert.equal(relative.start, undefined);
  assert.equal(relative.end, undefined);
  assert.deepEqual(scopeTimeParams(relative), { window: '24h' });
  assert.deepEqual(relative.instanceIds, [7]);
  assert.equal(relative.deviceId, 'gpu-0');
  assert.equal(scopeTimeLabel(base), '1h');
  assert.ok(scopeTimeLabel(absolute).includes(' → '));
});

test('a partial absolute range cannot silently fall back to a moving relative window', () => {
  assert.throws(() => scopeTimeParams({ ...base, start: 1000 }), RangeError);
  assert.throws(() => scopeTimeParams({ ...base, end: 4600 }), RangeError);
});

test('unknown or malformed retention stays unknown while the service query cap remains independent', () => {
  assert.deepEqual(monitoringCapabilities(undefined), limits);
  const known = monitoringCapabilities({
    ...limits,
    retention_seconds: 900,
    retention_known: true,
    retention_source: 'prometheus_runtimeinfo',
    supports_custom_range: true
  });
  assert.equal(known.max_query_seconds, 604800);
  assert.equal(known.retention_seconds, 900);
  assert.equal(known.supports_custom_range, true);
  assert.equal(
    monitoringCapabilities({
      max_query_seconds: Infinity,
      retention_seconds: NaN
    }).retention_seconds,
    null
  );
  assert.equal(durationLabel(604800), '7d');
  assert.equal(durationLabel(900), '15m');
});
