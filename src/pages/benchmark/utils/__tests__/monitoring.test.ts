import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  chronologicalPoints,
  exactRange,
  peakSourceComparison,
  phaseForPoint,
  phaseObservationSummary,
  phaseSamples,
  safeDelta,
  sampledSummary
} from '../monitoring';

const point = (
  id: number,
  sequence: number,
  input_tokens: number | null | undefined = null,
  load = 8
) => ({ id, load, raw: { id, sequence, input_tokens, rate: load } }) as any;
const phase = (
  sequence: number,
  input_tokens: number | null,
  start: number | null,
  end: number | null
) =>
  ({
    id: `${input_tokens || 0}:${sequence}`,
    sequence,
    input_tokens,
    rate: 8,
    start,
    end,
    traffic_start: start,
    traffic_end: end
  }) as any;
const metric = (points: [number, number | null][], status = 'available') =>
  ({
    status,
    series: [
      { statistic: 'current', dimensions: { device_id: 'gpu-a' }, points }
    ]
  }) as any;

test('stage identity uses sequence and input size, preserving duplicate target loads', () => {
  const phases = [
    phase(0, 128, 100, 130),
    phase(0, 256, 200, 260),
    phase(1, null, 300, 340)
  ];
  assert.equal(phaseForPoint(point(1, 0, 256), phases)?.start, 200);
  assert.equal(phaseForPoint(point(2, 0, 128), phases)?.start, 100);
  assert.equal(phaseForPoint(point(3, 1, undefined), phases)?.start, 300);
  assert.equal(phaseForPoint(point(4, 2, 256), phases), undefined);
});

test('timeline and previous-stage comparison follow recorded chronology instead of load order', () => {
  const low = point(1, 2, null, 8),
    high = point(2, 0, null, 64),
    middle = point(3, 1, null, 32);
  assert.deepEqual(
    chronologicalPoints(
      [low, middle, high],
      [
        phase(0, null, 100, 200),
        phase(1, null, 200, 250),
        phase(2, null, 250, 400)
      ]
    ).map((item) => item.id),
    [2, 3, 1]
  );
  assert.deepEqual(
    [low, middle, high].map((item) => item.id),
    [1, 3, 2]
  );
});

test('missing, nonfinite and zero-length stage timing never gets an invented interval', () => {
  for (const range of [
    null,
    { start: null, end: 10 },
    { start: NaN, end: 10 },
    { start: 4, end: 4 },
    { start: 5, end: 4 },
    { start: 5, end: Infinity }
  ])
    assert.equal(exactRange(range as any), null);
  assert.deepEqual(exactRange({ start: 10, end: 10.5 }), {
    start: 10,
    end: 10.5
  });
});

test('stage sampling excludes the next stage boundary, missing values and unauthorized series', () => {
  const data = metric([
    [9, 95],
    [10, 0],
    [11, null],
    [12, 60],
    [13, NaN],
    [20, 100]
  ]);
  const range = { start: 10, end: 20 };
  const summary = sampledSummary(data, range);
  assert.deepEqual(
    [
      summary.count,
      summary.avg,
      summary.peak,
      summary.end,
      summary.peakTime,
      summary.highShare
    ],
    [2, 30, 60, 60, 12, 0]
  );
  assert.equal(
    phaseSamples(data, range, { key: 'device_id', values: [] }).length,
    0
  );
  assert.equal(
    sampledSummary(metric([[12, 0]], 'restricted'), range).peak,
    null
  );
  assert.equal(sampledSummary(data, null).count, 0);
});

test('comparison avoids invalid ratios while resource percentages use percentage points', () => {
  assert.equal(safeDelta(12, 10), 20);
  assert.equal(safeDelta(75, 50, true), 25);
  assert.equal(safeDelta(1, 0), null);
  assert.equal(safeDelta(0, 0), null);
  assert.equal(safeDelta(0, 0, true), 0);
  assert.equal(safeDelta(1e308, 1e-308), null);
  assert.equal(safeDelta(1e308, -1e308, true), null);
  for (const value of [undefined, null, NaN, Infinity, -Infinity]) {
    assert.equal(safeDelta(value, 5), null);
    assert.equal(safeDelta(5, value), null);
  }
});

test('phase observation values prefer exact backend gauge statistics over downsampled chart points', () => {
  const response = {
    metrics: {
      gpu_utilization: metric([
        [10, 5],
        [15, 5]
      ])
    },
    sample_statistics: {
      gpu_utilization: [
        {
          dimensions: { device_id: 'gpu-a' },
          average: 70,
          peak: 95,
          peak_at: 17,
          last: 80,
          last_at: 19,
          threshold: 90,
          threshold_fraction: 0.25,
          observed_samples: 4,
          expected_samples: 5,
          coverage: 0.8
        }
      ]
    }
  } as any;
  const summary = phaseObservationSummary(response, 'gpu_utilization', {
    start: 10,
    end: 20
  });
  assert.deepEqual(
    [
      summary.avg,
      summary.peak,
      summary.end,
      summary.highShare,
      summary.count,
      summary.expected,
      summary.coverage
    ],
    [70, 95, 80, 25, 4, 5, 0.8]
  );
  assert.equal(summary.peakDimensions?.device_id, 'gpu-a');
  assert.equal(
    phaseObservationSummary(
      response,
      'gpu_utilization',
      { start: 10, end: 20 },
      { key: 'device_id', values: ['hidden'] }
    ).peak,
    null
  );
});

test('a saturation probe uses only its recorded timing, without inventing a load', () => {
  const probe = {
    ...point(9, 3, 1024),
    load: NaN,
    raw: { id: 9, sequence: 3, input_tokens: 1024, rate: null }
  } as any;
  const recorded = { ...phase(3, 1024, 100, 110), rate: null };
  assert.equal(phaseForPoint(probe, [recorded]), recorded);
  assert.equal(probe.raw.rate, null);
  assert.equal(phaseForPoint(probe, []), undefined);
});

test('role filters use both exact statistics and sampled fallback without borrowing another role', () => {
  const response = {
    metrics: {
      waiting_requests: {
        status: 'available',
        series: [
          { dimensions: { role: 'decode' }, points: [[12, 32]] },
          { dimensions: { role: 'prefill' }, points: [[13, 0]] }
        ]
      }
    }
  } as any;
  const filter = { key: 'role', values: ['prefill'] } as const;
  const summary = phaseObservationSummary(
    response,
    'waiting_requests',
    { start: 10, end: 20 },
    filter as any
  );
  assert.equal(summary.peak, 0);
  assert.equal(summary.peakDimensions?.role, 'prefill');
  assert.equal(
    phaseObservationSummary(
      response,
      'waiting_requests',
      { start: 10, end: 20 },
      { key: 'role', values: ['router'] } as any
    ).peak,
    null
  );
});

test('peak comparison requires the same identifiable source, including worker and engine rank', () => {
  const peak = (dimensions: any, value: number | null = 10) => ({
    peak: value,
    peakDimensions: dimensions
  });
  assert.equal(
    peakSourceComparison(peak({ role: 'prefill' }), peak({ role: 'prefill' })),
    'same'
  );
  assert.equal(
    peakSourceComparison(peak({ device_id: 'a' }), peak({ device_id: 'b' })),
    'changed'
  );
  assert.equal(
    peakSourceComparison(peak({ worker_id: 1 }), peak({ worker_id: 2 })),
    'changed'
  );
  assert.equal(
    peakSourceComparison(
      peak({ role: 'prefill', model_instance_id: 1, dp_rank: '0' }),
      peak({ role: 'prefill', model_instance_id: 1, dp_rank: '1' })
    ),
    'changed'
  );
  assert.equal(
    peakSourceComparison(
      peak({ model_instance_id: 1, model_instance_name: 'new-name' }),
      peak({ model_instance_id: 1, model_instance_name: 'old-name' })
    ),
    'same'
  );
  assert.equal(peakSourceComparison(peak({}), peak({})), 'unavailable');
  assert.equal(
    peakSourceComparison(peak(null), peak({ role: 'prefill' })),
    'unavailable'
  );
  assert.equal(
    peakSourceComparison(
      peak({ role: 'prefill' }, null),
      peak({ role: 'prefill' })
    ),
    'missing'
  );
  assert.equal(
    peakSourceComparison(
      peak({ role: 'prefill' }, 0),
      peak({ role: 'prefill' }, 0)
    ),
    'same'
  );
});

test('phase peaks never reuse a wider-window summary or a peak at the next phase boundary', () => {
  const response = {
    start: 10,
    end: 30,
    metrics: {
      waiting_requests: metric([
        [12, 3],
        [22, 99]
      ])
    },
    sample_statistics: {
      waiting_requests: [
        { dimensions: { device_id: 'gpu-a' }, peak: 99, peak_at: 22 }
      ]
    }
  } as any;
  assert.equal(
    phaseObservationSummary(response, 'waiting_requests', {
      start: 10,
      end: 20
    }).peak,
    3
  );
  assert.equal(
    phaseObservationSummary(response, 'waiting_requests', null).peak,
    null
  );
  const exact = {
    ...response,
    end: 20,
    sample_statistics: {
      waiting_requests: [
        { dimensions: { device_id: 'gpu-a' }, peak: 99, peak_at: 20 }
      ]
    }
  };
  assert.equal(
    phaseObservationSummary(exact, 'waiting_requests', { start: 10, end: 20 })
      .peak,
    null
  );
});
