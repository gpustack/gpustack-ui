import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let resources: any;
mock.module('@gpustack/core-ui', {
  namedExports: {
    GSDrawer: ({ open, title, children }: any) =>
      open ? createElement('section', null, title, children) : null,
    SectionTitle: ({ children }: any) => createElement('h2', null, children)
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => ({ resources, scope: { window: '1h' } }) }
});
mock.module(new URL('../metric-chart.tsx', import.meta.url).href, {
  defaultExport: () => null
});
const { DeviceDrawer, combineMetrics } = await import('../hardware-content');
const { ScopedResource } = await import('../../services/scoped-resource');
const device: any = {
  id: 'device-a',
  worker_id: 1,
  worker_name: 'visible-worker',
  index: 3,
  name: 'visible-GPU',
  scope: 'physical_gpu',
  model_instance_ids: [7],
  history_available: true,
  reason: null,
  current: {
    gpu_utilization: 73.2,
    gpu_memory_used: 1024 ** 3,
    gpu_memory_total: 80 * 1024 ** 3
  }
};
const response: any = {
  devices: [device],
  selected_device_id: device.id,
  metrics: {}
};
const renderDrawer = () =>
  renderToStaticMarkup(
    createElement(DeviceDrawer, { deviceId: device.id, onClose() {} } as any)
  );

test('resource 403 clears drawer readings and does not revive the clicked device snapshot', async () => {
  const store = new ScopedResource<any>();
  await store.load('scope-a', async () => response);
  resources = store.snapshot;
  assert.ok(renderDrawer().includes('73.2'));
  await store.load('scope-a', async () => {
    throw { response: { status: 403 } };
  });
  resources = store.snapshot;
  const html = renderDrawer();
  assert.ok(!html.includes('73.2'));
  assert.ok(!html.includes('visible-worker'));
  assert.ok(!html.includes('visible-GPU'));
});
test('a new resource scope and removed device association cannot display prior readings', async () => {
  const store = new ScopedResource<any>();
  await store.load('scope-a', async () => response);
  let resolve!: (value: unknown) => void;
  const pending = store.load(
    'scope-b',
    () =>
      new Promise((yes) => {
        resolve = yes;
      })
  );
  resources = store.snapshot;
  assert.ok(!renderDrawer().includes('73.2'));
  resolve({ devices: [], selected_device_id: null, metrics: {} });
  await pending;
  resources = store.snapshot;
  assert.ok(!renderDrawer().includes('visible-worker'));
});
for (const [status, reason] of [
  ['query_error', 'query_failed'],
  ['no_data', 'no_samples'],
  ['unsupported', 'metric_not_provided'],
  ['stale', null],
  ['missing', null]
] as const) {
  test(`combined metrics retain the ${status} Input explanation alongside available Output`, async () => {
    const output: any = {
      kind: 'counter',
      unit: 'tokens_per_second',
      measurement_scope: 'engine',
      status: 'available',
      reason: null,
      series: [
        {
          name: 'Deployment',
          statistic: 'rate',
          dimensions: {},
          points: [[100, 12]]
        }
      ],
      summaries: [{ statistic: 'rate', dimensions: {}, value: 12 }]
    };
    const input: any =
      status === 'missing'
        ? undefined
        : { ...output, status, reason, series: [], summaries: [] };
    const combined = combineMetrics([
      ['Input', input],
      ['Output', output]
    ])!;
    assert.equal(combined.status, 'available');
    assert.equal(combined.reason, 'partial_metric_data');
    assert.equal(
      combined.coverage,
      undefined,
      'component gaps must not invent instance coverage counts'
    );
    assert.deepEqual(combined.series.at(-1)?.points, [[100, 12]]);
    const { MetricNotice } = await import('../metric-state');
    const html = renderToStaticMarkup(
      createElement(MetricNotice, { metric: combined })
    );
    assert.ok(html.includes('Input'));
    const expected = reason || (status === 'missing' ? 'no_samples' : status);
    assert.ok(html.includes(`modelMonitoring.state.${expected}`));
  });
}

test('available Router members retain their partial source identity warning', async () => {
  const { MetricNotice } = await import('../metric-state');
  const html = renderToStaticMarkup(
    createElement(MetricNotice, {
      metric: {
        status: 'available',
        reason: 'source_identity_unresolved',
        series: [],
        summaries: []
      } as any
    })
  );
  assert.ok(html.includes('modelMonitoring.state.source_identity_unresolved'));
});
