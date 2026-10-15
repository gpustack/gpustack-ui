import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';

const empty = () => null;
const childrenOnly = ({ children }: any) => children;
mock.module('@ant-design/icons', { namedExports: { SettingOutlined: empty } });
mock.module('@gpustack/core-ui', {
  namedExports: {
    useBodyScroll: () => ({ saveScrollHeight() {}, restoreScrollHeight() {} }),
    FormDrawer: ({ open, children }: any) => (open ? children : null),
    IconFont: empty,
    SegmentLine: empty,
    TextAttribute: childrenOnly
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useAccess: () => ({ canSeeAdmin: true }),
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ onClick, children }: any) =>
      createElement('button', { onClick }, children),
    Tooltip: childrenOnly,
    Tabs: empty
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('ahooks', { namedExports: { useMemoizedFn: (fn: any) => fn } });
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: { providerSourceTemplate: '' }
});
mock.module(new URL('../../../../utils/localize.ts', import.meta.url).href, {
  namedExports: { localize: (value: string) => value }
});
mock.module(
  new URL('../../../_components/source-config/probe.ts', import.meta.url).href,
  {
    namedExports: { querySourceProbe: async () => ({}) }
  }
);
mock.module(
  new URL(
    '../../../_components/source-config/use-source-config.ts',
    import.meta.url
  ).href,
  {
    namedExports: {
      useProbeStatus: () => ({ probeStatus: {}, loadProbe() {} })
    }
  }
);
// Model the slot's successful-write event while exercising the real entry and
// drawer, including the drawer's cleanup of page-owned refresh timers.
mock.module(
  new URL('../../../_components/source-config/slot-form.tsx', import.meta.url)
    .href,
  {
    defaultExport: ({ onSourceSaved, onSaved }: any) =>
      createElement(
        'button',
        {
          'data-action': 'save',
          onClick: () => {
            onSourceSaved?.();
            onSaved();
          }
        },
        'Save'
      )
  }
);

let catalog = 'old';
const queryProviders = mock.fn(async () => ({ items: [{ name: catalog }] }));
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: { queryCacheProviders: queryProviders }
});
const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
const { createRoot } = await import('react-dom/client');
const { default: ProviderSourceEntry } =
  await import('../provider-source-entry.tsx');
const { default: useCacheProviders } =
  await import('../../hooks/use-cache-providers.ts');
const { invalidateCacheProviders } =
  await import('../../services/provider-catalog.ts');

const Consumer = () => {
  const { providers } = useCacheProviders();
  return createElement('output', null, providers.map((p) => p.name).join(','));
};
const pageRefresh = mock.fn();
const Page = () =>
  createElement(
    Fragment,
    null,
    createElement(ProviderSourceEntry, { onSaved: pageRefresh }),
    createElement(Consumer)
  );
const click = async (selector: string) => {
  await act(async () => {
    document.querySelector<HTMLButtonElement>(selector)!.click();
  });
};
const openPage = async () => {
  invalidateCacheProviders();
  catalog = 'old';
  queryProviders.mock.resetCalls();
  pageRefresh.mock.resetCalls();
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Page)));
  await click('button');
  assert.equal(document.querySelector('output')!.textContent, 'old');
  return root;
};

test('saving then leaving before one second refreshes the catalog when returning', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let root = await openPage();
  t.after(async () => {
    await act(async () => root.unmount());
  });
  await click('[data-action="save"]');
  assert.equal(queryProviders.mock.callCount(), 1);
  await act(async () => t.mock.timers.tick(500));
  await act(async () => root.unmount());
  catalog = 'new';
  await act(async () => t.mock.timers.tick(2500));
  assert.equal(pageRefresh.mock.callCount(), 0);
  assert.equal(queryProviders.mock.callCount(), 1);

  root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Page)));
  assert.equal(document.querySelector('output')!.textContent, 'new');
  assert.equal(queryProviders.mock.callCount(), 2);
});

test('the second delayed refresh replaces a catalog still rebuilding at one second', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const root = await openPage();
  t.after(async () => {
    await act(async () => root.unmount());
  });
  await click('[data-action="save"]');
  await act(async () => t.mock.timers.tick(1000));
  assert.equal(queryProviders.mock.callCount(), 2);
  assert.equal(document.querySelector('output')!.textContent, 'old');
  catalog = 'new';
  await act(async () => t.mock.timers.tick(2000));
  assert.equal(queryProviders.mock.callCount(), 3);
  assert.equal(document.querySelector('output')!.textContent, 'new');
  assert.equal(pageRefresh.mock.callCount(), 2);
});

test('another successful save replaces both pending catalog refresh timers', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const root = await openPage();
  t.after(async () => {
    await act(async () => root.unmount());
  });
  await click('[data-action="save"]');
  await act(async () => t.mock.timers.tick(500));
  await click('[data-action="save"]');
  await act(async () => t.mock.timers.tick(500));
  assert.equal(queryProviders.mock.callCount(), 1);
  await act(async () => t.mock.timers.tick(500));
  assert.equal(queryProviders.mock.callCount(), 2);
  await act(async () => t.mock.timers.tick(1500));
  assert.equal(queryProviders.mock.callCount(), 2);
  catalog = 'latest';
  await act(async () => t.mock.timers.tick(500));
  assert.equal(queryProviders.mock.callCount(), 3);
  assert.equal(document.querySelector('output')!.textContent, 'latest');
});
