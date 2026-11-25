import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import messages from '../../../../../locales/en-US/benchmark';

mock.module('@gpustack/core-ui', {
  namedExports: { SectionTitle: () => null }
});
mock.module('@ant-design/icons', {
  namedExports: { QuestionCircleOutlined: () => null }
});
mock.module('antd', { namedExports: { Tooltip: () => null, theme: {} } });
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../echarts.ts', import.meta.url).href, {
  defaultExport: {}
});

const { buildChartSpecs } = await import('../chart-specs');
const { buildStageChartOption } = await import('../stage-chart');
const { buildStagePoints } = await import('../metrics');
const translations = (messages as any).default ?? messages;
const intl = {
  formatMessage: ({ id }: { id: string }) => translations[id] || id
};

test('planned cancellations do not create a failure chart', () => {
  const points = buildStagePoints(
    [
      {
        id: 1,
        sequence: 0,
        rate: 16,
        request_total: 65,
        request_successful: 54,
        request_errored: 0,
        request_incomplete: 11,
        raw_metrics: {
          termination: { reason: 'min_requests', cancelled_at_boundary: 11 }
        }
      }
    ] as any,
    {}
  );
  assert.equal(
    buildChartSpecs(intl, { points, isConcurrency: true }).some(
      (s) => s.key === 'success'
    ),
    false
  );
});

test('success chart uses the same evaluated population when genuine errors exist', () => {
  const points = buildStagePoints(
    [
      {
        id: 1,
        sequence: 0,
        rate: 16,
        request_total: 65,
        request_successful: 50,
        request_errored: 4,
        request_incomplete: 11,
        raw_metrics: {
          termination: { reason: 'min_requests', cancelled_at_boundary: 11 }
        }
      }
    ] as any,
    {}
  );
  const spec = buildChartSpecs(intl, { points, isConcurrency: true }).find(
    (s) => s.key === 'success'
  )!;
  assert.equal(spec.series[0].value(points[0]), (50 / 54) * 100);
});

for (const rate of [0.001, 0.0011, 0.01, 1.2345]) {
  test(`production request-rate comparison preserves ${rate} in its tooltip and axis`, () => {
    const achieved = rate / 2;
    const points = buildStagePoints(
      [
        {
          id: 1,
          sequence: 0,
          rate,
          requests_per_second_mean: achieved,
          request_total: 10,
          request_successful: 10
        }
      ] as any,
      {}
    );
    const spec = buildChartSpecs(intl, { points, isConcurrency: false }).find(
      (item) => item.key === 'rate-shortfall'
    )!;
    const chart: any = buildStageChartOption(
      {
        spec,
        points,
        loadAxisName: 'Target request rate',
        loadAxisTitle: 'Target request rate (req/s)',
        markerLabels: { primary: 'Primary', peak: 'Peak' }
      },
      '#ddd'
    );
    const tooltip = chart.tooltip.formatter([{ dataIndex: 0 }]);
    assert.ok(tooltip.includes(`Target request rate ${rate}`));
    assert.ok(tooltip.includes(`Target  ${rate}`));
    assert.ok(tooltip.includes(`Achieved Avg  ${achieved}`));
    for (const tick of [0, achieved, rate]) {
      assert.equal(chart.yAxis.axisLabel.formatter(tick), String(tick));
    }
  });
}

test('concurrency averages and residuals retain their fractional values in tooltips and on both axes', () => {
  const points = buildStagePoints(
    [
      { id: 1, sequence: 0, rate: 12, request_concurrency_mean: 11.4362 },
      { id: 2, sequence: 1, rate: 16, request_concurrency_mean: 15.3384 }
    ] as any,
    { isConcurrency: true }
  );
  const spec = buildChartSpecs(intl, { points, isConcurrency: true }).find(
    (item) => item.key === 'concurrency-shortfall'
  )!;
  const chart: any = buildStageChartOption(
    {
      spec,
      points,
      loadAxisName: 'Target concurrency',
      loadAxisTitle: 'Target concurrency (requests)',
      markerLabels: { primary: 'Primary', peak: 'Peak' }
    },
    '#ddd'
  );
  const first = chart.tooltip.formatter([{ dataIndex: 0 }]);
  const second = chart.tooltip.formatter([{ dataIndex: 1 }]);
  assert.ok(first.includes('Target  12'));
  assert.ok(first.includes('Achieved Avg  11.44'));
  assert.ok(first.includes('Shortfall  0.56'));
  assert.ok(first.includes('95.3%'));
  assert.ok(second.includes('Achieved Avg  15.34'));
  assert.ok(second.includes('Shortfall  0.66'));
  // Rendering uses the actual residual, never the rounded tooltip text.
  const residual = chart.series.find((series: any) => series.yAxisIndex === 1);
  assert.ok(Math.abs(residual.data[0] - 0.5638) < 1e-10);
  assert.ok(Math.abs(residual.data[1] - 0.6616) < 1e-10);
  assert.equal(chart.yAxis[0].axisLabel.formatter(0.1), '0.1');
  assert.equal(chart.yAxis[1].min, 0);
  for (const ticks of [
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    [0, 0.002, 0.004, 0.006, 0.008, 0.01, 0.012]
  ]) {
    const labels = ticks.map(chart.yAxis[1].axisLabel.formatter);
    assert.equal(new Set(labels).size, ticks.length);
  }
  assert.equal(spec.fmt(0), '0');
  assert.equal(spec.fmt(0.0012), '0.0012');
  assert.equal(spec.y2!.fmt(0.0012), '0.0012');
});
