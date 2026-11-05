import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
mock.module('@gpustack/core-ui', {
  namedExports: { SectionTitle: () => null }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {}, cx: () => '' }) }
});
mock.module('antd', { namedExports: { theme: {} } });
mock.module(new URL('../../echarts.ts', import.meta.url).href, {
  defaultExport: {}
});
mock.module(new URL('../stage-chart.tsx', import.meta.url).href, {
  namedExports: {
    C: {},
    tooltipRows: (_rows: unknown, header: string) => header
  }
});

const { getStageStatus } = await import('../ui');
const { buildStagePoints, isSloCapacityPoint } = await import('../metrics');
const { buildLoadSweepOption } = await import('../load-sweep');

const row = (rate: number, tps: number | null, failed = 0) =>
  ({
    id: rate,
    sequence: rate,
    rate,
    tokens_per_second_mean: tps,
    request_total: 100,
    request_successful: 100 - failed,
    request_errored: failed,
    request_incomplete: 0,
    time_to_first_token_mean: 100
  }) as any;

const chart = (points: ReturnType<typeof buildStagePoints>): any =>
  buildLoadSweepOption(
    {
      points,
      latencyValue: (point) => point.ttft,
      loadAxisName: 'Concurrency',
      loadAxisTitle: 'Concurrency',
      labels: {
        concurrency: 'Concurrency',
        primary: 'SLO Capacity',
        peak: 'Peak Throughput',
        throughput: 'Total',
        throughputAxis: 'Total (tok/s)',
        ttftP99: 'TTFT Avg',
        overloaded: 'Overloaded',
        declining: 'Throughput decline',
        sloBreached: 'SLO breached'
      }
    },
    '#ddd'
  );

test('100%-successful benchmark 14 keeps its SLO capacity when total throughput falls 10.6% past the peak', () => {
  const points = buildStagePoints(
    [
      row(128, 36988.27457352783),
      {
        ...row(256, 33067.60433737254),
        time_to_first_token_mean: 305.9800841845572,
        time_to_first_token_p99: 1782.3247909545898
      }
    ],
    {
      recommendedRate: 256,
      peakRate: 128,
      sloTargets: { slo_avg_ttft_ms: 1000 }
    }
  );
  const capacity = points[1];
  assert.equal(capacity.status, 'declining');
  assert.equal(capacity.isDeclining, true);
  assert.equal(capacity.isOverloaded, false);
  assert.equal(capacity.sloPass, true);
  assert.equal(isSloCapacityPoint(capacity), true);
  assert.equal(points[0].isPeak, true);

  const option = chart(points);
  assert.match(
    option.series[0].data[1].label.formatter,
    /SLO Capacity.*Throughput decline/
  );
  assert.match(
    option.tooltip.formatter([{ dataIndex: 1 }]),
    /SLO Capacity.*Throughput decline/
  );
  assert.doesNotMatch(
    option.tooltip.formatter([{ dataIndex: 1 }]),
    /Overloaded|SLO breached/
  );
  assert.match(translations['benchmark.detail.validity.notSaturated'], /95%/);
  assert.doesNotMatch(
    translations['benchmark.detail.validity.notSaturated'],
    /nothing overloaded|no point overloaded/
  );
});

test('request failures above 5% remain overloaded even when throughput also declines', () => {
  assert.equal(
    getStageStatus(row(256, 900, 6), { peak_rate: 128 }, 1000),
    'overloaded'
  );
  assert.equal(
    getStageStatus(row(256, 1000, 5), { peak_rate: 128 }, 1000),
    'ok'
  );
  assert.equal(
    getStageStatus(row(256, 900, 5), { peak_rate: 128 }, 1000),
    'declining'
  );
});

test('a throughput drop must exceed 5% and occur beyond the peak load', () => {
  assert.equal(getStageStatus(row(16, 950), { peak_rate: 8 }, 1000), 'ok');
  assert.equal(
    getStageStatus(row(16, 949.99), { peak_rate: 8 }, 1000),
    'declining'
  );
  assert.equal(getStageStatus(row(4, 900), { peak_rate: 8 }, 1000), 'ok');
});

test('missing or non-finite throughput and load values do not invent a decline', () => {
  for (const tps of [null, undefined, NaN, Infinity, -Infinity, -1]) {
    const points = buildStagePoints([row(8, 1000), row(16, tps as any)], {
      peakRate: 8
    });
    assert.equal(points[1].status, 'ok');
  }
  for (const tps of [NaN, Infinity, -Infinity]) {
    const points = buildStagePoints([row(8, tps), row(16, 900)], {
      peakRate: 8
    });
    assert.equal(points[1].status, 'ok');
  }
  for (const rate of [NaN, Infinity, -Infinity]) {
    assert.equal(getStageStatus(row(rate, 900), { peak_rate: 8 }, 1000), 'ok');
    assert.equal(getStageStatus(row(16, 900), { peak_rate: rate }, 1000), 'ok');
  }
});

test('a recovered point is never included in a previous decline or overload region', () => {
  for (const failed of [0, 10]) {
    const points = buildStagePoints(
      [row(8, 1000), row(16, 900, failed), row(32, 980)],
      { peakRate: 8 }
    );
    const option = chart(points);
    assert.equal(option.series[0].markArea, undefined);
    assert.equal(
      option.series[0].data[1].label.formatter,
      failed ? 'Overloaded' : 'Throughput decline'
    );
    assert.doesNotMatch(
      option.tooltip.formatter([{ dataIndex: 2 }]),
      /Throughput decline|Overloaded/
    );
  }
});

test('a continuous throughput plateau has one decline label and keeps every marker and tooltip', () => {
  const points = buildStagePoints(
    [1000, 900, 900, 900, 900, 900].map((tps, index) =>
      row(8 * 2 ** index, tps)
    ),
    {
      recommendedRate: 64,
      peakRate: 8,
      sloTargets: { slo_avg_ttft_ms: 1000 }
    }
  );
  const option = chart(points);
  const throughput = option.series[0];
  assert.deepEqual(
    throughput.markArea.data.map(([start, end]: any[]) => [
      start.xAxis,
      end.xAxis,
      start.label.formatter
    ]),
    [[1, 5, 'Throughput decline']]
  );
  assert.deepEqual(
    throughput.data.map((point: any) => point.label?.formatter ?? ''),
    ['Peak Throughput', '', '', '★ SLO Capacity', '', '']
  );
  assert.equal(option.tooltip.trigger, 'axis');
  for (let index = 1; index < points.length; index++) {
    const point = throughput.data[index];
    assert.equal(point.value, 900);
    assert.equal(point.symbol, index === 3 ? 'circle' : 'triangle');
    assert.equal(point.symbolRotate, index === 3 ? 0 : 180);
    assert.ok(point.symbolSize >= 8);
    const tooltip = option.tooltip.formatter([{ dataIndex: index }]);
    assert.match(tooltip, new RegExp(`Concurrency ${points[index].load}`));
    assert.match(tooltip, /Throughput decline/);
    assert.doesNotMatch(tooltip, /Overloaded|SLO breached/);
  }
  assert.match(
    option.tooltip.formatter([{ dataIndex: 3 }]),
    /SLO Capacity.*Throughput decline/
  );
});

test('decline regions stop at the last affected measurement and resume only for a new contiguous run', () => {
  const points = buildStagePoints(
    [1000, 900, 890, 980, 900, 890, 980, 900].map((tps, index) =>
      row(8 * 2 ** index, tps)
    ),
    { peakRate: 8 }
  );
  const option = chart(points);
  assert.deepEqual(
    option.series[0].markArea.data.map(([start, end]: any[]) => [
      start.xAxis,
      end.xAxis,
      start.label.formatter
    ]),
    [
      [1, 2, 'Throughput decline'],
      [4, 5, 'Throughput decline']
    ]
  );
  for (const index of [1, 2, 4, 5]) {
    assert.equal(option.series[0].data[index].label.formatter, '');
    assert.match(
      option.tooltip.formatter([{ dataIndex: index }]),
      /Throughput decline/
    );
  }
  for (const index of [3, 6]) {
    assert.doesNotMatch(
      option.tooltip.formatter([{ dataIndex: index }]),
      /Throughput decline|Overloaded/
    );
  }
  assert.equal(option.series[0].data[7].label.formatter, 'Throughput decline');
});
