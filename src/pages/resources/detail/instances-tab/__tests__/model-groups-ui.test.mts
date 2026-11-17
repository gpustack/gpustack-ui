import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
let searchProps: any;
let openedLogs: any;
const wrap = ({ children, className }: any) =>
  createElement('div', { className }, children);
mock.module(new URL('../instance-placement-cell.tsx', import.meta.url).href, {
  defaultExport: ({ instance }: any) =>
    createElement('span', { 'data-placement': instance.id })
});
mock.module('@ant-design/icons', {
  namedExports: { RightOutlined: () => null }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any) =>
        id.endsWith('.instanceCount')
          ? `${values.count} instances`
          : id.endsWith('.modelsInstancesCount')
            ? `${values.models} models · ${values.instances} instances`
            : id
    })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: wrap,
    IconFont: () => null,
    DropdownButtons: ({ items, onSelect }: any) =>
      createElement('button', {
        'aria-label': items[0].label,
        onClick: () => onSelect(items[0].key)
      }),
    StatusTag: ({ statusValue }: any) =>
      createElement('span', {}, statusValue.text),
    TextAttribute: wrap,
    Table: ({ columns, dataSource, loading }: any) =>
      createElement(
        'table',
        { 'aria-busy': String(loading) },
        createElement(
          'thead',
          {},
          createElement(
            'tr',
            {},
            ...columns.map((c: any) =>
              createElement('th', { key: c.dataIndex }, c.title)
            )
          )
        ),
        createElement(
          'tbody',
          {},
          ...dataSource.map((r: any) =>
            createElement(
              'tr',
              { key: r.id, 'data-kind': r.kind },
              ...columns.map((c: any) =>
                createElement(
                  'td',
                  { key: c.dataIndex },
                  c.render?.(r[c.dataIndex], r)
                )
              )
            )
          )
        )
      )
  }
});
mock.module('antd', {
  namedExports: {
    Flex: wrap,
    Input: {
      Search: (props: any) => {
        searchProps = props;
        return createElement('input');
      }
    },
    Typography: {
      Text: wrap,
      Link: ({ href, onClick, children }: any) =>
        createElement('a', { href, onClick }, children)
    },
    Button: ({ children, onClick, ...props }: any) =>
      createElement(
        'button',
        {
          onClick,
          'aria-label': props['aria-label'],
          'aria-expanded': props['aria-expanded']
        },
        children
      )
  }
});
mock.module(
  new URL('../../../../_components/monitoring/index.ts', import.meta.url).href,
  { namedExports: { HelpTooltip: () => null } }
);
mock.module(
  new URL(
    '../../../../llmodels/components/view-logs-modal.tsx',
    import.meta.url
  ).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../../../llmodels/config/index.ts', import.meta.url).href,
  {
    namedExports: {
      status: { running: 'success' },
      InstanceStatusMapValue: { running: 'Running' }
    }
  }
);
mock.module(
  new URL(
    '../../../../llmodels/hooks/use-view-instance-logs.ts',
    import.meta.url
  ).href,
  {
    defaultExport: () => ({
      openViewLogsModal: (instance: any) => {
        openedLogs = instance;
      },
      closeViewLogsModal: () => {},
      openViewLogsModalStatus: { open: false, currentData: {} }
    })
  }
);
mock.module(
  new URL('../../components/detail.module.less', import.meta.url).href,
  { defaultExport: {} }
);
mock.module(new URL('../model-groups.module.less', import.meta.url).href, {
  defaultExport: { grouped: 'grouped', modelGroup: 'modelGroup' }
});
const { createRoot } = await import('react-dom/client');
const { ResourceContext } = await import('../../config/context');
const { default: InstancesTab } = await import('../index');
const instance = (id: number, model_id: number, model_name: string) => ({
  id,
  model_id,
  model_name,
  name: `instance-${id}`,
  state: 'running',
  gpu_device_ids: ['gpu-a', 'gpu-b'],
  spans_workers: false
});
const context = (kind: string) => ({
  target: { kind, id: '7' },
  scope: { window: '1h' },
  detail: {
    loading: false,
    data: {
      worker: { id: 7 },
      devices: [
        { id: 'gpu-a', index: 0 },
        { id: 'gpu-b', index: 1 }
      ],
      instances: [
        instance(1, 10, 'Model A'),
        instance(2, 10, 'Model A'),
        instance(3, 20, 'Model B')
      ]
    }
  }
});
test('Worker shows one linked model header, nested instances and all assigned GPUs, without repeated model actions', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(
        ResourceContext.Provider,
        { value: context('worker') as any },
        createElement(InstancesTab)
      )
    )
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=model]').length,
    2
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=instance]').length,
    3
  );
  assert.equal(document.querySelectorAll('a[href*=deployments]').length, 2);
  assert.equal(
    document
      .querySelectorAll('tbody tr[data-kind=instance]')[0]
      .querySelectorAll('a[href*=device_id]').length,
    2
  );
  assert.equal(document.querySelectorAll('thead th').length, 5);
  await act(async () =>
    (
      document.querySelector(
        'button[aria-label="common.button.viewlog"]'
      ) as HTMLButtonElement
    ).click()
  );
  assert.equal(openedLogs.id, 1);
  assert.equal(openedLogs.model_id, 10);
  assert.equal(
    document.querySelector('table')?.getAttribute('aria-busy'),
    'false'
  );
  await act(async () =>
    (
      document.querySelector('button[aria-expanded]') as HTMLButtonElement
    ).click()
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=instance]').length,
    1
  );
  assert.equal(document.querySelectorAll('a[href*=deployments]').length, 2);
  await act(async () =>
    searchProps.onChange({ target: { value: 'instance-1' } })
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=model]').length,
    1
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=instance]').length,
    1
  );
  assert.ok(
    document.querySelector('tbody')?.textContent?.includes('instance-1')
  );
  await act(async () => root.unmount());
});
test('GPU uses the same model groups, scoped counts and search, without redundant device or model action columns', async () => {
  const root = createRoot(document.getElementById('root')!);
  const data = context('gpu');
  data.detail.data.instances = [
    data.detail.data.instances[0],
    data.detail.data.instances[2]
  ];
  await act(async () =>
    root.render(
      createElement(
        ResourceContext.Provider,
        { value: data as any },
        createElement(InstancesTab)
      )
    )
  );
  assert.equal(document.querySelectorAll('thead th').length, 4);
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=model]').length,
    2
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=instance]').length,
    2
  );
  assert.equal(document.querySelectorAll('a[href*=deployments]').length, 2);
  assert.equal(document.querySelectorAll('a[href*=device_id]').length, 0);
  assert.equal(document.querySelectorAll('[data-placement]').length, 2);
  assert.equal(document.querySelectorAll('.modelGroup').length, 2);
  assert.match(document.body.textContent!, /2 models · 2 instances/);
  assert.doesNotMatch(
    document.querySelector('thead')!.textContent!,
    /devices|model_name/
  );
  await act(async () =>
    (
      document.querySelector('button[aria-expanded]') as HTMLButtonElement
    ).click()
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=instance]').length,
    1
  );
  await act(async () =>
    searchProps.onChange({ target: { value: 'instance-1' } })
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=model]').length,
    1
  );
  assert.equal(
    document.querySelectorAll('tbody tr[data-kind=instance]').length,
    1
  );
  assert.match(document.body.textContent!, /1 models · 1 instances/);
  assert.equal(
    document
      .querySelector('button[aria-expanded]')!
      .getAttribute('aria-expanded'),
    'true'
  );
  await act(async () => searchProps.onChange({ target: { value: 'missing' } }));
  assert.equal(document.querySelectorAll('tbody tr').length, 0);
  assert.match(document.body.textContent!, /0 models · 0 instances/);
  await act(async () => root.unmount());
});
test('GPU overview keeps its compact related-instance preview without a GPU column', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(
        ResourceContext.Provider,
        { value: context('gpu') as any },
        createElement(InstancesTab, { compact: true })
      )
    )
  );
  assert.equal(document.querySelectorAll('thead th').length, 5);
  assert.equal(document.querySelectorAll('tbody tr').length, 3);
  assert.equal(document.querySelectorAll('a[href*=device_id]').length, 0);
  assert.equal(document.querySelectorAll('a[href*=deployments]').length, 3);
  assert.equal(
    document.querySelectorAll('button[aria-label="common.button.viewlog"]')
      .length,
    3
  );
  assert.equal(document.querySelector('button[aria-expanded]'), null);
  await act(async () => root.unmount());
});
