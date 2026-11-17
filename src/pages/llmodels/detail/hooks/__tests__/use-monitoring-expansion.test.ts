import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ModelMetric } from '../../config/types';
import {
  defaultMonitoringSections,
  orderMonitoringSections
} from '../../utils/monitoring-sections';
import { useMonitoringExpansion } from '../use-monitoring-expansion';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const ingress = (status: ModelMetric['status'] = 'available'): ModelMetric => ({
  kind: 'histogram',
  unit: 'seconds',
  measurement_scope: 'service_ingress',
  status,
  reason: null,
  supported_statistics: ['avg'],
  series: [],
  summaries:
    status === 'available'
      ? [{ statistic: 'avg', dimensions: {}, value: 0 }]
      : []
});

test('deployment defaults include observed ingress, while benchmarks open only their core group', () => {
  for (const pd of [false, true]) {
    const core = pd ? 'pools' : 'llm';
    const metrics = { ingress_ttft: ingress() };
    assert.deepEqual(defaultMonitoringSections('deployment', pd, metrics), [
      core,
      'service'
    ]);
    assert.deepEqual(defaultMonitoringSections('benchmark', pd, metrics), [
      core
    ]);
    for (const status of [
      'no_data',
      'no_observations',
      'unsupported',
      'not_applicable'
    ] as const) {
      assert.deepEqual(
        defaultMonitoringSections('deployment', pd, {
          ingress_ttft: ingress(status)
        }),
        [core]
      );
    }
    assert.deepEqual(
      defaultMonitoringSections('deployment', pd, {
        ingress_ttft: ingress('query_error')
      }),
      [core, 'service']
    );
  }
});

test('navigation and content use a fixed core-first order without dropping sections', () => {
  assert.deepEqual(
    orderMonitoringSections(
      ['gpu', 'service', 'cache', 'llm', 'host', 'stages'].map((key) => ({
        key
      }))
    ).map(({ key }) => key),
    ['llm', 'service', 'stages', 'cache', 'gpu', 'host']
  );
  assert.deepEqual(
    orderMonitoringSections(
      ['service', 'pd', 'host', 'pools', 'gpu'].map((key) => ({
        key
      }))
    ).map(({ key }) => key),
    ['pools', 'service', 'pd', 'gpu', 'host']
  );
});

test('late first data initializes deployment ingress once, and user choices survive scope changes', async (t) => {
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  let state!: ReturnType<typeof useMonitoringExpansion>;
  const Harness = (props: Parameters<typeof useMonitoringExpansion>[0]) => {
    state = useMonitoringExpansion(props);
    return null;
  };
  const render = async (props: Parameters<typeof useMonitoringExpansion>[0]) =>
    act(async () => root.render(createElement(Harness, props)));
  const initial = {
    identity: 'model:1',
    mode: 'deployment',
    pd: false
  } as const;
  await render(initial);
  assert.deepEqual(state.expanded, ['llm']);
  await render({ ...initial, metrics: { ingress_ttft: ingress() } });
  assert.deepEqual(state.expanded, ['llm', 'service']);
  await act(async () => state.setExpanded(['llm', 'gpu']));
  await render({ ...initial, metrics: undefined });
  await render({
    ...initial,
    metrics: { ingress_ttft: ingress('no_observations') }
  });
  assert.deepEqual(state.expanded, ['llm', 'gpu']);
  await act(async () => state.setDetails(['router']));
  await render({ ...initial, identity: 'model:2', metrics: {} });
  assert.deepEqual(state.expanded, ['llm']);
  assert.deepEqual(state.details, []);
});

test('manual choices before data and a sample-free first response are never overridden by later samples', async (t) => {
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  let state!: ReturnType<typeof useMonitoringExpansion>;
  const Harness = (props: Parameters<typeof useMonitoringExpansion>[0]) => {
    state = useMonitoringExpansion(props);
    return null;
  };
  const initial = {
    identity: 'model:1',
    mode: 'deployment',
    pd: true
  } as const;
  const render = async (props: Parameters<typeof useMonitoringExpansion>[0]) =>
    act(async () => root.render(createElement(Harness, props)));
  await render(initial);
  await act(async () => state.setExpanded([]));
  await render({ ...initial, metrics: { ingress_ttft: ingress() } });
  assert.deepEqual(state.expanded, []);
  await render({ ...initial, identity: 'model:2', metrics: {} });
  assert.deepEqual(state.expanded, ['pools']);
  await render({
    ...initial,
    identity: 'model:2',
    metrics: { ingress_ttft: ingress() }
  });
  assert.deepEqual(state.expanded, ['pools']);
});

test('benchmark range loading preserves known PD layout and manual expansion until the same record returns', async (t) => {
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  let state!: ReturnType<typeof useMonitoringExpansion>;
  const Harness = (props: Parameters<typeof useMonitoringExpansion>[0]) => {
    state = useMonitoringExpansion(props);
    return null;
  };
  const render = async (props: Parameters<typeof useMonitoringExpansion>[0]) =>
    act(async () => root.render(createElement(Harness, props)));
  const run = { identity: 58, mode: 'benchmark', pd: true } as const;
  await render(run);
  await act(async () => state.setExpanded(['pools', 'pd', 'router']));
  await act(async () => state.setDetails(['handoff-details']));
  await render({ ...run, pd: undefined });
  assert.deepEqual(state.expanded, ['pools', 'pd', 'router']);
  assert.deepEqual(state.details, ['handoff-details']);
  await render(run);
  assert.deepEqual(state.expanded, ['pools', 'pd', 'router']);
  await render({ ...run, identity: 59, pd: undefined });
  await render({ ...run, identity: 59 });
  assert.deepEqual(state.expanded, ['pools']);
  assert.deepEqual(state.details, []);
  await render({ ...run, identity: 60, pd: undefined });
  await act(async () => state.setExpanded([]));
  await render({ ...run, identity: 60 });
  assert.deepEqual(state.expanded, []);
});
