import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: wrap,
    DropdownButtons: ({ items, onSelect }: any) =>
      createElement('a', {
        href: items[0].props?.href,
        'aria-label': items[0].label,
        onClick: () => onSelect(items[0].key)
      }),
    SectionTitle: wrap,
    Table: ({ loading = true, dataSource, columns }: any) =>
      createElement(
        'div',
        { 'aria-busy': String(loading) },
        loading ? createElement('div', { role: 'status' }, 'Loading') : null,
        ...dataSource.map((row: any) =>
          createElement(
            'div',
            { key: row.id },
            ...columns.map((column: any, index: number) =>
              createElement(
                'div',
                { key: index, 'data-column': column.dataIndex },
                column.render?.(row[column.dataIndex], row) ??
                  row[column.dataIndex]
              )
            )
          )
        )
      )
  }
});
mock.module(
  new URL('../../../../../_components/monitoring/index.ts', import.meta.url)
    .href,
  { namedExports: { HelpTooltip: () => null } }
);
mock.module('antd', {
  namedExports: {
    Flex: wrap,
    Typography: {
      Text: wrap,
      Link: ({ href, children }: any) => createElement('a', { href }, children)
    }
  }
});
mock.module(
  new URL('../../../components/detail.module.less', import.meta.url).href,
  { defaultExport: {} }
);
const { createRoot } = await import('react-dom/client');
const { ResourceContext } = await import('../../../config/context');
const { default: GPUInventory } = await import('../gpu-inventory');
test('a completed inventory request releases the core table loading layer and exposes navigation', async () => {
  const root = createRoot(document.getElementById('root')!);
  const value: any = {
    detail: {
      loading: false,
      data: {
        worker: {
          id: 7,
          status: { gpu_devices: [{ index: 0, memory: { allocated: 0 } }] }
        },
        instances: [],
        devices: [
          {
            id: 'device-a',
            worker_id: 7,
            worker_name: 'worker',
            name: 'GPU name',
            index: 0,
            model_instance_ids: [],
            current: {
              gpu_utilization: 0,
              gpu_memory_used: 0,
              gpu_memory_total: 1000
            }
          }
        ]
      }
    },
    scope: { window: '1h' }
  };
  await act(async () =>
    root.render(
      createElement(
        ResourceContext.Provider,
        { value },
        createElement(GPUInventory)
      )
    )
  );
  assert.equal(
    document.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
    'false'
  );
  assert.equal(document.querySelector('[role=status]'), null);
  assert.match(
    document.querySelector('a')?.getAttribute('href') || '',
    /device_id=device-a/
  );
  assert.ok(document.body.textContent?.includes('0 %'));
  assert.match(
    document
      .querySelector('a[aria-label="resourceDetail.viewMonitoring"]')!
      .getAttribute('href')!,
    /device_id=device-a.*tab=monitoring/
  );
  await act(async () =>
    root.render(
      createElement(
        ResourceContext.Provider,
        { value: { ...value, detail: { ...value.detail, loading: true } } },
        createElement(GPUInventory)
      )
    )
  );
  assert.equal(
    document.querySelector('[aria-busy]')?.getAttribute('aria-busy'),
    'true'
  );
  assert.equal(document.querySelector('[role=status]')?.textContent, 'Loading');
  await act(async () => root.unmount());
});

test('allocated memory is unknown for ambiguous GPU indexes and shown for a unique match', async () => {
  const data = JSON.parse(
    readFileSync(
      new URL(
        '../../../components/__tests__/fixtures/unresolved-device-detail.json',
        import.meta.url
      ),
      'utf8'
    )
  );
  const [first, second] = data.worker.status.gpu_devices;
  first.memory.allocated = 1024 ** 3;
  second.memory.allocated = 2 * 1024 ** 3;
  const root = createRoot(document.getElementById('root')!);
  const render = async () => {
    await act(async () =>
      root.render(
        createElement(
          ResourceContext.Provider,
          {
            value: {
              detail: { data, loading: false },
              scope: { window: '1h' }
            } as any
          },
          createElement(GPUInventory)
        )
      )
    );
    return document.querySelector('[data-column=allocated]')?.textContent;
  };
  try {
    assert.equal(await render(), '—');
    second.index = 1;
    assert.equal(await render(), '—');
    Object.assign(data.devices[0], { index: 1, reason: null });
    assert.equal(await render(), '2 GiB');
  } finally {
    await act(async () => root.unmount());
  }
});
