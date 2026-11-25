import assert from 'node:assert/strict';
import { test } from 'node:test';

const sampled = {
  request_total: 65,
  request_successful: 54,
  request_errored: 0,
  request_incomplete: 11,
  raw_metrics: {
    termination: {
      reason: 'min_requests',
      requested: 50,
      processed: 50,
      cancelled_at_boundary: 11
    }
  }
};

test('sampling cancellations preserve raw counts while changing the evaluated population', async () => {
  const { requestAccounting } = await import('../request-accounting');
  const counts = requestAccounting(sampled);
  assert.equal(counts.total, 65);
  assert.equal(counts.successful, 54);
  assert.equal(counts.incomplete, 11);
  assert.equal(counts.cancelledAtBoundary, 11);
  assert.equal(counts.evaluatedTotal, 54);
  assert.equal(counts.successRate, 1);
  assert.equal(counts.unplannedIncomplete, 0);
});

test('server errors remain in the evaluated population', async () => {
  const { requestAccounting } = await import('../request-accounting');
  const counts = requestAccounting({
    ...sampled,
    request_successful: 50,
    request_errored: 4
  });
  assert.equal(counts.evaluatedTotal, 54);
  assert.equal(counts.successRate, 50 / 54);
});

for (const cancelled of [-1, true, 11.5, 1000, '11', null]) {
  test(`invalid cancellation evidence ${String(cancelled)} does not improve success`, async () => {
    const { requestAccounting } = await import('../request-accounting');
    const counts = requestAccounting({
      ...sampled,
      raw_metrics: {
        termination: {
          reason: 'min_requests',
          cancelled_at_boundary: cancelled
        }
      }
    });
    assert.equal(counts.cancelledAtBoundary, 0);
    assert.equal(counts.successRate, 54 / 65);
    assert.equal(counts.unplannedIncomplete, 11);
  });
}

test('reports without boundary evidence retain their success denominator', async () => {
  const { requestAccounting } = await import('../request-accounting');
  const counts = requestAccounting({ ...sampled, raw_metrics: {} });
  assert.equal(counts.evaluatedTotal, 65);
  assert.equal(counts.successRate, 54 / 65);
});

test('other stop reasons do not exempt incomplete requests', async () => {
  const { requestAccounting } = await import('../request-accounting');
  const counts = requestAccounting({
    ...sampled,
    raw_metrics: {
      termination: { reason: 'max_duration', cancelled_at_boundary: 11 }
    }
  });
  assert.equal(counts.successRate, 54 / 65);
});

test('legacy raw-only records keep their measured request counts', async () => {
  const { requestAccounting } = await import('../request-accounting');
  const counts = requestAccounting({
    raw_metrics: {
      benchmarks: [
        {
          metrics: {
            request_totals: {
              total: 65,
              successful: 54,
              errored: 0,
              incomplete: 11
            }
          },
          termination: sampled.raw_metrics.termination
        }
      ]
    }
  });
  assert.equal(counts.total, 65);
  assert.equal(counts.successRate, 1);
});

test('missing and zero-sized populations do not imply measured success', async () => {
  const { requestAccounting } = await import('../request-accounting');
  assert.equal(requestAccounting({}).total, null);
  assert.equal(requestAccounting({}).successRate, null);
  assert.equal(
    requestAccounting({ request_total: 0, request_successful: 0 }).successRate,
    null
  );
});

for (const [reason, expected] of [
  ['max_requests', false],
  ['min_requests', false],
  ['max_duration', true],
  ['max_errors', true],
  ['requests_exhausted', true],
  [undefined, false]
] as const) {
  test(`normal sample limits and early stop ${String(reason)} are distinguished`, async () => {
    const { isEarlyTermination } = await import('../request-accounting');
    assert.equal(isEarlyTermination({ reason }), expected);
  });
}
