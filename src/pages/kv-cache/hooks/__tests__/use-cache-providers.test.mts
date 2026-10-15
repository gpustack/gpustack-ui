import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement } from 'react';

mock.module('ahooks', { namedExports: { useMemoizedFn: (fn: any) => fn } });

const requests: {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
}[] = [];
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryCacheProviders: () =>
      new Promise((resolve, reject) => requests.push({ resolve, reject }))
  }
});
mock.module(new URL('../../../../utils/localize.ts', import.meta.url).href, {
  namedExports: { localize: (value: string) => value }
});
const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
const { createRoot } = await import('react-dom/client');
const { default: useCacheProviders } =
  await import('../use-cache-providers.ts');
const { invalidateCacheProviders } =
  await import('../../services/provider-catalog.ts');
const Consumer = () => {
  const { providers } = useCacheProviders();
  return createElement('span', null, providers.map((p) => p.name).join(','));
};
const result = (name: string) => ({ items: [{ name }] });

test('saving refreshes all mounted consumers and new forms share the refreshed catalog', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(
        'div',
        null,
        createElement(Consumer),
        createElement(Consumer)
      )
    )
  );
  assert.equal(requests.length, 1);
  await act(async () => requests[0].resolve(result('old')));
  assert.equal(document.body.textContent, 'oldold');
  await act(async () => invalidateCacheProviders());
  assert.equal(requests.length, 2);
  await act(async () => requests[1].resolve(result('new')));
  assert.equal(document.body.textContent, 'newnew');
  await act(async () =>
    root.render(
      createElement(
        'div',
        null,
        createElement(Consumer),
        createElement(Consumer),
        createElement(Consumer)
      )
    )
  );
  assert.equal(requests.length, 2);
  assert.equal(document.body.textContent, 'newnewnew');
  await act(async () => root.unmount());
});

test('a response from before invalidation cannot overwrite the new catalog', async () => {
  invalidateCacheProviders();
  const start = requests.length;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Consumer)));
  await act(async () => invalidateCacheProviders());
  await act(async () => requests[start + 1].resolve(result('latest')));
  await act(async () => requests[start].resolve(result('stale')));
  assert.equal(document.body.textContent, 'latest');
  await act(async () => root.unmount());
});

test('an obsolete failure cannot invalidate a newer successful request', async () => {
  invalidateCacheProviders();
  const start = requests.length;
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Consumer)));
  await act(async () => invalidateCacheProviders());
  await act(async () => requests[start + 1].resolve(result('latest')));
  await act(async () => requests[start].reject(new Error('obsolete')));
  assert.equal(document.body.textContent, 'latest');
  await act(async () =>
    root.render(createElement('div', null, createElement(Consumer)))
  );
  assert.equal(requests.length, start + 2);
  assert.equal(document.body.textContent, 'latest');
  await act(async () => root.unmount());
});
