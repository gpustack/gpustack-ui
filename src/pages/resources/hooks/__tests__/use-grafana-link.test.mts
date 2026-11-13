import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

mock.module(new URL('../../../../atoms/system.ts', import.meta.url).href, {
  namedExports: { systemConfigAtom: {} }
});
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: { GPUSTACK_API_BASE_URL: 'v2' }
});
mock.module('@gpustack/core-ui', { namedExports: { GrafanaIcon: () => null } });
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('antd', { namedExports: { Button: () => null } });
mock.module('jotai', {
  namedExports: { useAtomValue: () => ({ showMonitoring: true }) }
});
const { default: useGrafanaLink } = await import('../use-grafana-link');
let api: ReturnType<typeof useGrafanaLink>;
const opened: string[] = [];
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { open: (url: string) => opened.push(url) }
});
const Harness = () => {
  api = useGrafanaLink({ type: 'model' });
  return null;
};

test('native monitoring Grafana link preserves only supported selection fields', () => {
  renderToStaticMarkup(createElement(Harness));
  api.goToModelMonitoringGrafana(
    { id: 9 },
    { window: '6h', instanceIds: [12, 13], role: 'all' }
  );
  const url = new URL(opened.pop()!, 'http://localhost');
  assert.equal(url.pathname, '/v2/models/9/dashboard');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    window: '6h',
    instance_ids: '12,13',
    role: 'all'
  });
});

test('all-instance role selection omits the instance filter and keeps old links compatible', () => {
  renderToStaticMarkup(createElement(Harness));
  api.goToModelMonitoringGrafana(
    { id: 9 },
    { window: '24h', instanceIds: [], role: 'prefill' }
  );
  const url = new URL(opened.pop()!, 'http://localhost');
  assert.equal(url.searchParams.get('role'), 'prefill');
  assert.equal(url.searchParams.has('instance_ids'), false);
  api.goToGrafana({ id: 9 });
  assert.equal(opened.pop(), '/v2/models/9/dashboard');
});

test('a fixed monitoring interval reaches the guarded dashboard endpoint without a moving window', () => {
  renderToStaticMarkup(createElement(Harness));
  api.goToModelMonitoringGrafana(
    { id: 9 },
    { window: '1h', start: 1000, end: 4600, instanceIds: [12], role: 'decode' }
  );
  const url = new URL(opened.pop()!, 'http://localhost');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    role: 'decode',
    start: '1000',
    end: '4600',
    instance_ids: '12'
  });
  assert.equal(url.searchParams.has('window'), false);
});
