import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const wrap = ({ children }: any) => createElement('div', {}, children);
const requestNotice = ({ state }: any) =>
  state.error
    ? createElement('p', {}, `Request failed: ${state.error.response.status}`)
    : null;
mock.module('@gpustack/core-ui', { namedExports: { HeaderLeft: wrap } });
mock.module('@umijs/max', {
  namedExports: {
    useSearchParams: () => [new URLSearchParams({ id: '7' })],
    useLocation: () => ({ pathname: '/resources/workers/detail' }),
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ onClick, children }: any) =>
      createElement('button', { onClick }, children),
    Flex: wrap,
    Result: ({ title, extra }: any) => createElement('div', {}, title, extra),
    Skeleton: () => null,
    Tabs: ({ activeKey, items, onChange }: any) =>
      createElement(
        'div',
        {},
        ...items.map(({ key, label }: any) =>
          createElement('button', { key, onClick: () => onChange(key) }, label)
        ),
        items.find(({ key }: any) => key === activeKey)?.children
      )
  }
});
mock.module(
  new URL('../../../_components/monitoring/index.ts', import.meta.url).href,
  {
    namedExports: { RequestNotice: requestNotice }
  }
);
mock.module(
  new URL(
    '../../../llmodels/detail/hooks/use-monitoring-data.ts',
    import.meta.url
  ).href,
  {
    namedExports: {
      tenantKey: () => 'tenant',
      useMonitoringTenant: () => 'tenant'
    }
  }
);
mock.module(new URL('../components/detail.module.less', import.meta.url).href, {
  defaultExport: {}
});
for (const [path, text] of [
  ['../../../_components/page-breadcrumb/index.tsx', 'Breadcrumb'],
  ['../components/resource-header.tsx', 'Resource header'],
  ['../configuration-tab/index.tsx', 'Configuration'],
  ['../instances-tab/index.tsx', 'Instances'],
  ['../overview-tab/index.tsx', 'GPU inventory']
]) {
  mock.module(new URL(path, import.meta.url).href, {
    defaultExport: () => createElement('div', {}, text)
  });
}
mock.module(new URL('../monitoring-tab/index.tsx', import.meta.url).href, {
  defaultExport: () => {
    const { metrics, capabilities } = useResource();
    return createElement(
      'div',
      {},
      createElement(requestNotice, { state: metrics }),
      createElement(requestNotice, { state: capabilities })
    );
  }
});

let detailStatus: number | null = null;
mock.module(new URL('../services/requests.ts', import.meta.url).href, {
  namedExports: {
    queryResourceDetail: async () => {
      if (detailStatus) throw { response: { status: detailStatus } };
      return {
        worker: { id: 7, name: 'worker-7' },
        selected_device_id: null,
        devices: [],
        instances: []
      };
    },
    queryHardwareMetrics: async () => {
      throw { response: { status: 403 } };
    },
    queryResourceCapabilities: async () => {
      throw { response: { status: 404 } };
    }
  }
});

const { useResource } = await import('../config/context');
const { default: ResourceDetailPage } = await import('../index');
const { createRoot } = await import('react-dom/client');
const click = (key: string) =>
  act(async () =>
    [...document.querySelectorAll('button')]
      .find((el) => el.textContent === `resourceDetail.${key}`)!
      .click()
  );

test('monitoring authorization and capability errors leave inventory and configuration accessible', async () => {
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(createElement(ResourceDetailPage)));
    assert.match(document.body.textContent!, /Resource header.*GPU inventory/);
    assert.doesNotMatch(
      document.body.textContent!,
      /Request failed|resourceDetail.unavailable/
    );
    await click('configuration');
    assert.match(document.body.textContent!, /Configuration/);
    await click('monitoring');
    assert.match(document.body.textContent!, /Request failed: 403/);
    assert.match(document.body.textContent!, /Request failed: 404/);
  } finally {
    await act(async () => root.unmount());
  }
});

for (const status of [403, 404]) {
  test(`detail status ${status} makes the resource page unavailable`, async () => {
    const root = createRoot(document.getElementById('root')!);
    try {
      detailStatus = status;
      await act(async () => root.render(createElement(ResourceDetailPage)));
      assert.match(document.body.textContent!, /resourceDetail.unavailable/);
      assert.doesNotMatch(
        document.body.textContent!,
        /Resource header|GPU inventory/
      );
    } finally {
      detailStatus = null;
      await act(async () => root.unmount());
    }
  });
}
