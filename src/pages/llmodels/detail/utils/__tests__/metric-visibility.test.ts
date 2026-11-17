import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ModelMetric } from '../../config/types';
import {
  canOmitMetric,
  canOmitMetricGroup,
  compactMetricEmpty,
  metricStateMessageId
} from '../metric-state';

const unavailable = (status: ModelMetric['status']): ModelMetric => ({
  status,
  reason: null,
  kind: 'gauge',
  unit: 'requests',
  measurement_scope: 'engine_local',
  supported_statistics: [],
  series: [],
  summaries: []
});

test('missing gateway samples explain the request population without masking failures', () => {
  const metric = {
    ...unavailable('no_data'),
    measurement_scope: 'service_ingress',
    reason: 'no_samples'
  };
  assert.equal(
    metricStateMessageId(metric),
    'modelMonitoring.state.no_gateway_samples'
  );
  assert.equal(
    metricStateMessageId({
      ...metric,
      status: 'query_error',
      reason: 'query_failed'
    }),
    'modelMonitoring.state.query_failed'
  );
});

test('only explicit unsupported and not-applicable observations can be omitted', () => {
  for (const status of ['unsupported', 'not_applicable'] as const)
    assert.equal(canOmitMetric(unavailable(status)), true);
  for (const status of [
    'available',
    'no_data',
    'no_observations',
    'query_error',
    'restricted',
    'stale'
  ] as const)
    assert.equal(canOmitMetric(unavailable(status)), false);
  assert.equal(canOmitMetric(undefined), false);
  assert.equal(
    canOmitMetricGroup(['a', 'b'], { a: unavailable('unsupported') }),
    false
  );
});

test('observed zeros, partial failures and permissions cannot disappear behind a capability status', () => {
  const metric = unavailable('unsupported');
  assert.equal(
    canOmitMetric({
      ...metric,
      series: [
        { name: 'idle', statistic: 'current', dimensions: {}, points: [[1, 0]] }
      ]
    }),
    false
  );
  assert.equal(
    canOmitMetric({
      ...metric,
      summaries: [{ statistic: 'current', dimensions: {}, value: 0 }]
    }),
    false
  );
  assert.equal(
    canOmitMetric({
      ...metric,
      componentWarnings: [
        { label: 'B', status: 'query_error', reason: 'query_failed' }
      ]
    }),
    false
  );
  assert.equal(
    canOmitMetric({ ...metric, reason: 'resource_not_visible' }),
    false
  );
});

test('capability warnings with query or visibility failures cannot hide a combined metric', () => {
  for (const reason of ['query_failed', 'resource_not_visible', 'restricted'])
    assert.equal(
      canOmitMetric({
        ...unavailable('unsupported'),
        componentWarnings: [
          { label: 'partial component', status: 'unsupported', reason }
        ]
      }),
      false
    );
});

test('supported observations without samples are compact while valid zero series and failures stay chart states', () => {
  for (const status of ['no_data', 'no_observations', 'available'] as const)
    assert.equal(compactMetricEmpty(unavailable(status)), true);
  for (const status of ['query_error', 'restricted', 'stale'] as const)
    assert.equal(compactMetricEmpty(unavailable(status)), false);
  assert.equal(
    compactMetricEmpty({
      ...unavailable('available'),
      series: [
        { name: 'idle', statistic: 'current', dimensions: {}, points: [[1, 0]] }
      ]
    }),
    false
  );
});
