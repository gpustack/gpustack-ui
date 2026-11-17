import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

mock.module('@gpustack/core-ui', { namedExports: { Table: () => null } });
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({ styles: { card: 'chart-card' } })
  }
});
mock.module(new URL('../../echarts.ts', import.meta.url).href, {
  defaultExport: {}
});
const { default: StageChart } = await import('../stage-chart');

test('report chart explanations live in a title help control and the data toggle uses the shared icon', () => {
  const html = renderToStaticMarkup(
    createElement(StageChart, {
      spec: {
        key: 'latency-composition',
        title: 'Latency composition',
        note: 'Between the lines = everything after the first token',
        yName: 'Latency',
        fmt: String,
        series: []
      },
      points: [],
      loadAxisName: 'Rate',
      loadAxisTitle: 'Rate',
      markerLabels: { primary: 'Primary', peak: 'Peak' },
      dataLabels: { data: 'View data', chart: 'Return to chart' }
    })
  );
  assert.doesNotMatch(html, /Between the lines/);
  assert.match(html, /aria-label="Latency composition"/);
  assert.match(html, /data-icon="profile"/);
  assert.match(html, /aria-label="View data"/);
});
