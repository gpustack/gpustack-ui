import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let data: any;
let scope: any = { window: '1h' };
let chart: any;
mock.module('@gpustack/core-ui', {
  namedExports: { GrafanaIcon: () => null }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) =>
        id + (values?.seconds != null ? `: ${values.seconds}` : '')
    })
  }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: {
    useResource: () => ({
      target: { kind: 'worker', id: '1' },
      scope,
      changeScope() {},
      refresh() {},
      capabilities: {},
      detail: { data: { devices: [] } },
      metrics: { data }
    })
  }
});
let timeRangeProps: any;
mock.module(
  new URL('../../../../_components/monitoring/index.ts', import.meta.url).href,
  {
    namedExports: {
      TimeRangeControl: (props: any) => {
        timeRangeProps = props;
        return null;
      },
      HelpTooltip: (props: any) => createElement('span', null, props.content),
      MetricChart: (props: any) => {
        chart = props;
        return null;
      }
    }
  }
);
mock.module(
  new URL('../../../hooks/use-grafana-link.tsx', import.meta.url).href,
  { defaultExport: () => ({ showMonitoring: false }) }
);
mock.module(new URL('../../services/requests.ts', import.meta.url).href, {
  namedExports: { resourceGrafanaHref: () => '' }
});
mock.module(new URL('../detail.module.less', import.meta.url).href, {
  defaultExport: {}
});
const { default: ScopeToolbar } = await import('../scope-toolbar');
const { default: MetricGrid } = await import('../metric-grid');

test('resource inspection shows its actual returned query step with an explanation', () => {
  data = { step: 2, last_refreshed_at: 100, metrics: {} };
  const html = renderToStaticMarkup(createElement(ScopeToolbar));
  assert.match(html, /resourceDetail.queryStep: 2/);
  assert.match(html, /resourceDetail.queryStepHelp/);
});

test('no returned metrics means no invented query resolution', () => {
  data = null;
  const html = renderToStaticMarkup(createElement(ScopeToolbar));
  assert.doesNotMatch(html, /resourceDetail.queryStep/);
});

test('fixed hardware inspection uses the requested real-time domain', () => {
  scope = { window: '1h', start: 100, end: 110 };
  data = { start: 100, end: 110, step: 1, metrics: {} };
  renderToStaticMarkup(
    createElement(MetricGrid, {
      charts: [{ key: 'host_cpu', title: 'CPU' }]
    })
  );
  assert.deepEqual(chart.timeRange, { start: 100, end: 110 });
});

test('relative inventory monitoring retains its existing sampled domain', () => {
  scope = { window: '1h' };
  data = { start: 100, end: 110, step: 1, metrics: {} };
  renderToStaticMarkup(
    createElement(MetricGrid, {
      charts: [{ key: 'host_cpu', title: 'CPU' }]
    })
  );
  assert.equal(chart.timeRange, undefined);
});

test('embedded resource toolbar uses preset time ranges and renders optional extra controls', () => {
  data = { step: 5, last_refreshed_at: 100, metrics: {} };
  const html = renderToStaticMarkup(
    createElement(ScopeToolbar, {
      embedded: true,
      extra: createElement('span', { 'data-extra': true }, 'help')
    })
  );
  assert.equal(timeRangeProps.variant, 'presets');
  assert.ok(html.includes('data-extra="true"'));
});
