import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
let tenant = 'tenant-a';
mock.module(new URL('../use-monitoring-data.ts', import.meta.url).href, {
  namedExports: {
    tenantKey: () => tenant,
    useMonitoringTenant: () => tenant
  }
});
let respond: (model: any) => Promise<any>;
mock.module(
  new URL('../../services/deployment-metadata.ts', import.meta.url).href,
  {
    namedExports: {
      deploymentCacheBindings: () => [],
      queryDeploymentMetadata: (model: any) => respond(model)
    }
  }
);
const { createRoot } = await import('react-dom/client');
const { default: useDeploymentMetadata } =
  await import('../use-deployment-metadata');
const Probe = ({ model }: any) => {
  const result = useDeploymentMetadata(model);
  return createElement(
    'div',
    null,
    result.loading
      ? 'Loading metadata'
      : result.data?.target?.route_name || 'Unavailable'
  );
};
test('loading metadata does not claim that no route exists, and stale tenant responses remain hidden', async () => {
  let resolve!: (value: any) => void;
  respond = async (model) =>
    model.id === 7
      ? new Promise((done) => {
          resolve = done;
        })
      : { target: { route_name: 'new-route' } };
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () =>
      root.render(createElement(Probe, { model: { id: 7, cluster_id: 9 } }))
    );
    assert.equal(document.body.textContent, 'Loading metadata');
    tenant = 'tenant-b';
    await act(async () =>
      root.render(createElement(Probe, { model: { id: 8, cluster_id: 10 } }))
    );
    await act(async () =>
      resolve({ target: { route_name: 'private-old-route' } })
    );
    assert.equal(document.body.textContent, 'new-route');
  } finally {
    await act(async () => root.unmount());
  }
});
