import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as metrics from '../stage-detail-metrics';

const values = {
  mean: 40,
  min: 0,
  max: 100,
  p25: 25,
  p50: 50,
  p75: 75,
  p90: 90,
  p95: 95,
  p99: 99
} as const;
const distribution = () => ({
  successful: {
    count: 10,
    mean: 40,
    min: 0,
    max: 100,
    percentiles: { p25: 25, p50: 50, p75: 75, p90: 90, p95: 95, p99: 99 }
  }
});
const stage = (fields: Record<string, unknown>, wrapped = false) => ({
  raw_metrics: wrapped
    ? { benchmarks: [{ metrics: fields }] }
    : { metrics: fields }
});
const rateValue = (...args: any[]) => {
  assert.equal(typeof (metrics as any).stageRateValue, 'function');
  return (metrics as any).stageRateValue(...args);
};
const tokenValue = (...args: any[]) => {
  assert.equal(typeof (metrics as any).stageTokenValue, 'function');
  return (metrics as any).stageTokenValue(...args);
};

for (const wrapped of [false, true]) {
  test(`${wrapped ? 'wrapped' : 'direct'} latency distributions supply every statistic`, () => {
    for (const [metric, field] of [
      ['ttft', 'time_to_first_token_ms'],
      ['itl', 'inter_token_latency_per_chunk_ms'],
      ['latency', 'request_latency']
    ] as const) {
      const data = stage({ [field]: distribution() }, wrapped);
      for (const [stat, expected] of Object.entries(values))
        assert.equal(
          metrics.stageLatencyValue(data, metric, stat as any),
          expected
        );
    }
  });
  test(`${wrapped ? 'wrapped' : 'direct'} token statistics come from measured counts`, () => {
    const output = distribution();
    output.successful.mean = 12;
    const data = {
      ...stage(
        { prompt_token_count: distribution(), output_token_count: output },
        wrapped
      ),
      dataset_input_tokens: 2048,
      dataset_output_tokens: 128,
      prompt_token_count_mean: 999
    };
    for (const [stat, expected] of Object.entries(values)) {
      assert.equal(tokenValue(data, 'input', stat), expected);
      assert.equal(
        tokenValue(data, 'output', stat),
        stat === 'mean' ? 12 : expected
      );
    }
  });
  test(`${wrapped ? 'wrapped' : 'direct'} rate readers use the correct successful distributions`, () => {
    for (const [metric, field] of [
      ['requests', 'requests_per_second'],
      ['concurrency', 'request_concurrency'],
      ['total', 'tokens_per_second'],
      ['input', 'prompt_tokens_per_second'],
      ['output', 'output_tokens_per_second']
    ] as const) {
      const data = stage({ [field]: distribution() }, wrapped);
      for (const stat of ['mean', 'min', 'max'] as const)
        assert.equal(rateValue(data, metric, stat), values[stat]);
    }
  });
}

test('mean and recorded latency tails prefer flat values; middle percentiles and min remain raw-only', () => {
  const data = {
    ...stage({ time_to_first_token_ms: distribution() }, true),
    time_to_first_token_mean: 400,
    time_to_first_token_p95: 950,
    time_to_first_token_p99: 990,
    time_to_first_token_min: 999,
    time_to_first_token_p25: 999,
    time_to_first_token_p50: 999,
    time_to_first_token_p75: 999,
    time_to_first_token_p90: 999
  };
  assert.equal(metrics.stageLatencyValue(data, 'ttft', 'mean'), 400);
  assert.equal(metrics.stageLatencyValue(data, 'ttft', 'p95'), 950);
  assert.equal(metrics.stageLatencyValue(data, 'ttft', 'p99'), 990);
  for (const stat of ['min', 'p25', 'p50', 'p75', 'p90'] as const)
    assert.equal(
      metrics.stageLatencyValue(data, 'ttft', stat as any),
      values[stat]
    );
});

test('TPOT requires positive decode-only values before the same-stage fallback for all statistics', () => {
  for (const stat of Object.keys(values)) {
    const decode = distribution();
    const fallback = distribution();
    fallback.successful.min = 2;
    if (stat.startsWith('p')) (decode.successful.percentiles as any)[stat] = 0;
    else (decode.successful as any)[stat] = 0;
    const data = stage(
      { inter_token_latency_ms: decode, time_per_output_token_ms: fallback },
      true
    );
    assert.equal(
      metrics.stageLatencyValue(data, 'tpot', stat as any),
      stat === 'min' ? 2 : values[stat as keyof typeof values]
    );
  }
  const data = {
    ...stage({
      inter_token_latency_ms: distribution(),
      time_per_output_token_ms: distribution()
    }),
    inter_token_latency_mean: 3,
    time_per_output_token_mean: 5
  };
  assert.equal(metrics.stageLatencyValue(data, 'tpot', 'mean'), 3);
  data.inter_token_latency_mean = 0;
  assert.equal(metrics.stageLatencyValue(data, 'tpot', 'mean'), 40);
});

test('ITL remains independent of TPOT and preserves recorded flat zero and max', () => {
  const empty = distribution();
  empty.successful.count = 0;
  const data = {
    ...stage({
      inter_token_latency_ms: distribution(),
      inter_token_latency_per_chunk_ms: empty
    }),
    inter_token_latency_mean: 99
  };
  assert.equal(metrics.stageLatencyValue(data, 'itl', 'mean'), null);
  const recorded = stage({ inter_token_latency_per_chunk_ms: distribution() });
  assert.equal(
    metrics.stageLatencyValue(
      { ...recorded, itl_per_chunk_mean: 0 },
      'itl',
      'mean'
    ),
    0
  );
  assert.equal(
    metrics.stageLatencyValue(
      { ...recorded, itl_per_chunk_max: 12 },
      'itl',
      'max'
    ),
    12
  );
});

test('rate flat fields are restricted to existing means and concurrency max', () => {
  for (const [metric, prefix, field] of [
    ['requests', 'requests_per_second', 'requests_per_second'],
    ['concurrency', 'request_concurrency', 'request_concurrency'],
    ['total', 'tokens_per_second', 'tokens_per_second'],
    ['input', 'input_tokens_per_second', 'prompt_tokens_per_second'],
    ['output', 'output_tokens_per_second', 'output_tokens_per_second']
  ] as const) {
    const data = {
      ...stage({ [field]: distribution() }, true),
      [`${prefix}_mean`]: 0,
      [`${prefix}_min`]: 999,
      [`${prefix}_max`]: 999
    };
    assert.equal(rateValue(data, metric, 'mean'), 0);
    assert.equal(rateValue(data, metric, 'min'), 0);
    assert.equal(
      rateValue(data, metric, 'max'),
      metric === 'concurrency' ? 999 : 100
    );
  }
});

test('missing total throughput is not summed from input and output', () => {
  const data = {
    ...stage({
      prompt_tokens_per_second: distribution(),
      output_tokens_per_second: distribution()
    }),
    input_tokens_per_second_mean: 100,
    output_tokens_per_second_mean: 200
  };
  for (const stat of ['mean', 'min', 'max'])
    assert.equal(rateValue(data, 'total', stat), null);
});

test('scalar min accepts flat zero and rejects non-finite values before its raw fallback', () => {
  const data = stage({ request_concurrency: distribution() });
  assert.equal(
    metrics.stageScalar(
      { ...data, recorded_min: 0 },
      'recorded_min',
      'request_concurrency',
      'min' as any
    ),
    0
  );
  assert.equal(
    metrics.stageScalar(
      { ...data, recorded_min: Infinity },
      'recorded_min',
      'request_concurrency',
      'min' as any
    ),
    0
  );
});

test('raw count-zero, missing, negative and non-finite statistics remain unknown', () => {
  const empty = distribution();
  empty.successful.count = 0;
  const data = stage(
    { requests_per_second: empty, prompt_token_count: empty },
    true
  );
  assert.equal(rateValue(data, 'requests', 'mean'), null);
  assert.equal(tokenValue(data, 'input', 'mean'), null);
  const invalid = distribution();
  invalid.successful.min = -1;
  invalid.successful.max = Infinity;
  invalid.successful.mean = NaN;
  const invalidData = stage({
    requests_per_second: invalid,
    output_token_count: invalid
  });
  for (const stat of ['mean', 'min', 'max']) {
    assert.equal(rateValue(invalidData, 'requests', stat), null);
    assert.equal(tokenValue(invalidData, 'output', stat), null);
  }
  assert.equal(
    tokenValue({ dataset_input_tokens: 2048 }, 'input', 'mean'),
    null
  );
  assert.equal(
    tokenValue({ dataset_output_tokens: 128 }, 'output', 'mean'),
    null
  );
});

test('missing statistics never borrow values from another stage in the wrapper', () => {
  const data = {
    dataset_input_tokens: 2048,
    raw_metrics: {
      benchmarks: [
        {
          metrics: {
            time_to_first_token_ms: { successful: { count: 10, mean: 12 } }
          }
        },
        {
          metrics: {
            time_to_first_token_ms: distribution(),
            requests_per_second: distribution(),
            prompt_token_count: distribution()
          }
        }
      ]
    }
  };
  assert.equal(metrics.stageLatencyValue(data, 'ttft', 'mean'), 12);
  assert.equal(metrics.stageLatencyValue(data, 'ttft', 'p25' as any), null);
  assert.equal(rateValue(data, 'requests', 'max'), null);
  assert.equal(tokenValue(data, 'input', 'mean'), null);
});

for (const wrapped of [false, true]) {
  test(`${wrapped ? 'wrapped' : 'direct'} empty latency sources invalidate flat zero and positive values`, () => {
    for (const [metric, prefix, field] of [
      ['ttft', 'time_to_first_token', 'time_to_first_token_ms'],
      ['itl', 'itl_per_chunk', 'inter_token_latency_per_chunk_ms'],
      ['latency', 'request_latency', 'request_latency']
    ] as const) {
      const empty = distribution();
      empty.successful.count = 0;
      for (const value of [0, 99]) {
        for (const stat of ['mean', 'p95', 'p99', 'max'] as const) {
          const data = {
            ...stage({ [field]: empty }, wrapped),
            [`${prefix}_${stat}`]: value
          };
          assert.equal(metrics.stageLatencyValue(data, metric, stat), null);
        }
      }
    }
  });
}

test('latency flat values survive absent raw data and positive sample counts', () => {
  assert.equal(
    metrics.stageLatencyValue({ time_to_first_token_mean: 0 }, 'ttft', 'mean'),
    0
  );
  assert.equal(
    metrics.stageLatencyValue({ time_to_first_token_p95: 12 }, 'ttft', 'p95'),
    12
  );
  assert.equal(
    metrics.stageLatencyValue(
      {
        ...stage({ time_to_first_token_ms: distribution() }),
        time_to_first_token_mean: 0
      },
      'ttft',
      'mean'
    ),
    0
  );
});

test('TPOT validates decode and fallback sample counts independently', () => {
  const decode = distribution();
  decode.successful.count = 0;
  const fallback = distribution();
  const data = {
    ...stage(
      { inter_token_latency_ms: decode, time_per_output_token_ms: fallback },
      true
    ),
    inter_token_latency_mean: 3,
    time_per_output_token_mean: 5
  };
  assert.equal(metrics.stageLatencyValue(data, 'tpot', 'mean'), 5);
  fallback.successful.count = 0;
  assert.equal(metrics.stageLatencyValue(data, 'tpot', 'mean'), null);
  decode.successful.count = 10;
  assert.equal(metrics.stageLatencyValue(data, 'tpot', 'mean'), 3);
  assert.equal(
    metrics.stageLatencyValue(
      {
        ...stage({ inter_token_latency_ms: { successful: { count: 0 } } }),
        time_per_output_token_mean: 7
      },
      'tpot',
      'mean'
    ),
    7
  );
});

test('empty raw rate distributions do not invalidate measured flat zero rates', () => {
  const empty = distribution();
  empty.successful.count = 0;
  const data = {
    ...stage({ requests_per_second: empty, tokens_per_second: empty }),
    requests_per_second_mean: 0,
    tokens_per_second_mean: 0
  };
  assert.equal(rateValue(data, 'requests', 'mean'), 0);
  assert.equal(rateValue(data, 'total', 'mean'), 0);
});
