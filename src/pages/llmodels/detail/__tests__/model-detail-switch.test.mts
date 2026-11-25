import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, beforeEach, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const wrap = ({ children }: any) => createElement('div', {}, children);
const resultRenders: string[] = [];
let selectedId = 7;
let tenant = 'org-a';
let finishMetrics: (() => void) | undefined;
const options = [
  { id: 7, value: 7, label: 'Model A' },
  { id: 8, value: 8, label: 'Model B' },
  { id: 9, value: 9, label: 'Model C' }
];
const requests = new Map<
  number,
  {
    resolve: (model: { id: number; name: string }) => void;
    reject: (error: unknown) => void;
  }
>();
beforeEach(() => {
  resultRenders.length = 0;
  requests.clear();
  selectedId = 7;
  tenant = 'org-a';
  finishMetrics = undefined;
});

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id }),
    useSearchParams: () => {
      const [, setRevision] = useState(0);
      return [
        new URLSearchParams({ id: String(selectedId) }),
        (params: { id: string }, options: { replace: boolean }) => {
          assert.equal(options.replace, true);
          selectedId = Number(params.id);
          setRevision((revision) => revision + 1);
        }
      ];
    },
    request: async (path: string) => {
      if (path === '/models/9/metrics') {
        await new Promise<void>((resolve) => {
          finishMetrics = resolve;
        });
      }
      return { metrics: {} };
    }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    HeaderLeft: wrap,
    PageBreadcrumb: ({ items }: any) =>
      createElement(
        'nav',
        {},
        items.map((item: any, i: number) =>
          createElement('span', { key: i }, item.title)
        )
      ),
    AutoTooltip: wrap,
    BaseSelect: ({ options, value, onSelect }: any) =>
      createElement(
        'select',
        {
          value,
          onChange: (event: { target: HTMLSelectElement }) =>
            onSelect(Number(event.target.value))
        },
        options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      )
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ children, onClick }: any) =>
      createElement('button', { onClick }, children),
    Flex: wrap,
    Spin: () => null,
    Result: ({ status, extra }: any) => {
      resultRenders.push(status);
      return createElement('div', { 'data-status': status }, extra);
    },
    Tabs: ({ activeKey, items, onChange }: any) =>
      createElement(
        'section',
        {},
        createElement(
          'div',
          { role: 'tablist' },
          items.map(({ key, label }: any) =>
            createElement(
              'button',
              {
                key,
                role: 'tab',
                'aria-selected': key === activeKey,
                onClick: () => onChange(key)
              },
              label
            )
          )
        ),
        createElement(
          'div',
          { role: 'tabpanel', 'aria-hidden': false },
          items.find(({ key }: any) => key === activeKey)?.children
        )
      )
  }
});
mock.module(
  new URL(
    '../../../_components/page-breadcrumb/index.module.less',
    import.meta.url
  ).href,
  { defaultExport: { breadcrumb: 'breadcrumb' } }
);
mock.module(
  new URL('../../../../request.extensions.ts', import.meta.url).href,
  {
    namedExports: { getTenantHeaders: () => ({ 'X-Tenant': tenant }) }
  }
);
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryModelDetail: (id: number) =>
      new Promise((resolve, reject) => requests.set(id, { resolve, reject })),
    queryModelInstancesList: async () => ({ items: [] })
  }
});
mock.module(
  new URL('../../services/use-query-model-list.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      dataList: tenant === 'org-a' ? options : [],
      loading: false
    })
  }
);
mock.module(new URL('../components/detail-header.tsx', import.meta.url).href, {
  defaultExport: ({ model }: any) => createElement('h1', {}, model.name)
});
mock.module(
  new URL('../components/hardware-content.tsx', import.meta.url).href,
  {
    namedExports: { DeviceDrawer: () => null }
  }
);
mock.module(new URL('../components/metric-state.tsx', import.meta.url).href, {
  namedExports: { RequestNotice: () => null }
});
mock.module(
  new URL('../hooks/use-deployment-metadata.ts', import.meta.url).href,
  {
    defaultExport: () => ({ loading: false, data: null })
  }
);
for (const tab of [
  'configuration',
  'gpu-resources',
  'instances',
  'monitoring'
]) {
  mock.module(new URL(`../${tab}-tab/index.tsx`, import.meta.url).href, {
    defaultExport: () => createElement('div', {}, `${tab} contents`)
  });
}

mock.module(new URL('../overview-tab/index.tsx', import.meta.url).href, {
  defaultExport: () => createElement('div', {}, 'overview contents')
});

const { default: ModelDetail } = await import('../index');
const { createRoot } = await import('react-dom/client');
const switcher = () => document.querySelector('select')!;
const selectedName = () => switcher().selectedOptions[0].textContent;
const heading = () => document.querySelector('h1')?.textContent;
const activeTab = () =>
  document.querySelector('[role="tab"][aria-selected="true"]')?.textContent;
const tabButton = (tab: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(
    (button) => button.textContent === `modelMonitoring.${tab}`
  )!;
const pending = () => document.querySelector('[aria-busy="true"]');
const status = () =>
  document.querySelector('[data-status]')?.getAttribute('data-status');

test('model switching keeps the current detail visible until the latest target is ready', async () => {
  const root = createRoot(document.getElementById('root')!);
  const render = () => root.render(createElement(ModelDetail));
  const select = (id: number) =>
    act(async () => {
      switcher().value = String(id);
      switcher().dispatchEvent(
        new dom.window.Event('change', { bubbles: true })
      );
      render();
    });
  try {
    await act(async () => render());
    const element = switcher();
    assert.ok(pending());
    assert.equal(resultRenders.length, 0);
    await act(async () =>
      requests.get(7)!.resolve({ id: 7, name: 'API model A' })
    );
    assert.equal(selectedName(), 'API model A');
    assert.equal(heading(), 'API model A');
    assert.equal(activeTab(), 'modelMonitoring.overview');
    await act(async () => tabButton('monitoring').click());
    assert.equal(activeTab(), 'modelMonitoring.monitoring');
    await select(8);
    assert.equal(switcher(), element);
    assert.equal(selectedName(), 'API model A');
    assert.equal(heading(), 'API model A');
    assert.equal(selectedId, 7);
    assert.ok(document.querySelector('[role="tablist"]'));
    assert.ok(pending()?.hasAttribute('inert'));
    assert.equal(activeTab(), 'modelMonitoring.monitoring');

    await select(9);
    await act(async () =>
      requests.get(8)!.resolve({ id: 8, name: 'API model B' })
    );
    assert.equal(selectedName(), 'API model A');
    assert.equal(heading(), 'API model A');
    assert.equal(selectedId, 7);
    await act(async () =>
      requests.get(9)!.resolve({ id: 9, name: 'API model C' })
    );
    assert.equal(heading(), 'API model A');
    assert.equal(selectedId, 7);
    assert.ok(pending()?.hasAttribute('inert'));
    await act(async () => finishMetrics!());
    assert.equal(selectedName(), 'API model C');
    assert.equal(heading(), 'API model C');
    assert.equal(selectedId, 9);
    assert.equal(activeTab(), 'modelMonitoring.monitoring');
    assert.equal(
      document.querySelector('[role="tabpanel"]')?.textContent,
      'monitoring contents'
    );
    assert.equal(pending(), null);
    assert.equal(resultRenders.length, 0);

    await select(8);
    await select(9);
    await act(async () =>
      requests.get(8)!.resolve({ id: 8, name: 'Cancelled model' })
    );
    assert.equal(heading(), 'API model C');
    assert.equal(pending(), null);

    await select(8);
    tenant = 'org-b';
    await act(async () => render());
    await act(async () =>
      requests.get(8)!.resolve({ id: 8, name: 'Other tenant model' })
    );
    assert.notEqual(switcher(), element);
    assert.equal(heading(), undefined);
    assert.equal(selectedName(), '#9');
    assert.equal(activeTab(), 'modelMonitoring.overview');
  } finally {
    await act(async () => root.unmount());
  }
});

test('a failed detail request shows its unavailable state and can be retried', async () => {
  const root = createRoot(document.getElementById('root')!);
  const retry = () =>
    act(async () =>
      document.querySelector<HTMLButtonElement>('[data-status] button')!.click()
    );
  try {
    await act(async () => root.render(createElement(ModelDetail)));
    await act(async () =>
      requests.get(selectedId)!.reject({ response: { status: 403 } })
    );
    assert.equal(status(), '403');
    await retry();
    assert.ok(pending());
    await act(async () =>
      requests.get(selectedId)!.reject({ response: { status: 404 } })
    );
    assert.equal(status(), '404');
    await retry();
    assert.ok(pending());
    await act(async () =>
      requests
        .get(selectedId)!
        .resolve({ id: selectedId, name: 'Recovered model' })
    );
    assert.equal(heading(), 'Recovered model');
    assert.equal(status(), undefined);
  } finally {
    await act(async () => root.unmount());
  }
});
