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
