import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const success = mock.fn();
const warning = mock.fn();
const fetchData = mock.fn();
const handleDeleteBatch = mock.fn();
const clearSelections = mock.fn(() => {
  table.rowSelection.selectedRowKeys = [];
});
let table: any;
let labelsModal: any;
let columnActions: any;
let batchActions: any;
let locationPopover: any;
let writeWorker = async (_id: number, _data: any) => ({});
const updateWorker = mock.fn((id: number, data: any) => writeWorker(id, data));

mock.module('@ant-design/icons', {
  namedExports: {
    DeleteOutlined: empty,
    EnvironmentOutlined: empty,
    PlusOutlined: empty,
    TagsOutlined: empty
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    DeleteModal: forwardRef(empty),
    DropdownButtons: (props: any) => {
      batchActions = props;
      return createElement(
        'div',
        { role: 'group', 'aria-label': 'Batch actions' },
        props.items.map((item: any, index: number) =>
          createElement(
            'button',
            {
              key: item.key,
              'data-batch-action': item.key,
              disabled: props.disabled || item.disabled,
              onClick: () => props.onSelect(item.key, item)
            },
            item.label,
            index === 0 ? props.extra : null
          )
        )
      );
    },
    FilterBar: ({ right }: any) => right,
    Table: empty
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) =>
        values ? `${id} ${JSON.stringify(values)}` : id
    })
  }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (callback: any) => callback }
});
mock.module('antd', {
  namedExports: {
    Button: ({ children, disabled, onClick }: any) =>
      createElement('button', { disabled, onClick }, children),
    Space: passChildren,
    message: { success, warning, info: empty }
  }
});
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: {
    PaginationKey: { Workers: 'workers' },
    TABLE_SORT_DIRECTIONS: []
  }
});
mock.module(
  new URL('../../../../hooks/use-table-fetch.ts', import.meta.url).href,
  {
    defaultExport: () => table
  }
);
mock.module(
  new URL('../../../_components/page-box.tsx', import.meta.url).href,
  {
    defaultExport: passChildren
  }
);
mock.module(
  new URL('../../../cluster-management/apis/index.ts', import.meta.url).href,
  {
    namedExports: { queryClusterTopology: async () => ({}) }
  }
);
mock.module(
  new URL(
    '../../../cluster-management/components/add-worker/config.ts',
    import.meta.url
  ).href,
  {
    namedExports: { DockerStepsFromWorker: [] }
  }
);
mock.module(
  new URL(
    '../../../cluster-management/components/topology/index.tsx',
    import.meta.url
  ).href,
  {
    defaultExport: empty
  }
);
mock.module(
  new URL(
    '../../../cluster-management/components/topology/set-location.tsx',
    import.meta.url
  ).href,
  {
    namedExports: {
      SetLocationForWorkers: (props: any) => {
        locationPopover = props;
        return passChildren(props);
      }
    }
  }
);
mock.module(
  new URL(
    '../../../cluster-management/hooks/use-add-worker.tsx',
    import.meta.url
  ).href,
  {
    defaultExport: () => ({
      handleAddWorker: empty,
      checkDefaultCluster: empty,
      AddWorkerModal: null,
      setStepList: empty
    })
  }
);
mock.module(
  new URL(
    '../../../cluster-management/services/use-query-cluster-list.tsx',
    import.meta.url
  ).href,
  {
    namedExports: {
      useQueryClusterList: () => ({ fetchClusterList: async () => [] })
    }
  }
);
mock.module(
  new URL('../../../llmodels/hooks/use-no-resource-result.tsx', import.meta.url)
    .href,
  {
    defaultExport: () => ({ noResourceResult: null })
  }
);
mock.module(new URL('../../hooks/use-grafana-link.tsx', import.meta.url).href, {
  defaultExport: () => ({ goToGrafana: empty, ActionButton: empty })
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    WORKERS_API: '/workers',
    deleteWorker: empty,
    queryWorkersList: empty,
    updateWorker
  }
});
mock.module(
  new URL('../../hooks/use-worker-columns.tsx', import.meta.url).href,
  {
    defaultExport: (props: any) => {
      columnActions = props;
      return [];
    }
  }
);
mock.module(
  new URL('../../hooks/use-worker-maintenance.tsx', import.meta.url).href,
  {
    defaultExport: () => ({
      MaintenanceModal: null,
      handleStopMaintenance: empty,
      setOpenStatus: empty
    })
  }
);
mock.module(new URL('../update-labels.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    labelsModal = props;
    return props.open ? createElement('div', { role: 'dialog' }) : null;
  }
});
for (const name of ['worker-detail-modal', 'worker-ssh-modal']) {
  mock.module(new URL(`../${name}.tsx`, import.meta.url).href, {
    defaultExport: empty
  });
}

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

// Exercise the real Workers handlers and real toolbar. Only their external
// widgets, data hook and HTTP boundary are replaced; payloads come from Workers.
const { default: Workers } = await import('../workers.tsx');
const worker = (id: number, labels: any) => ({
  id,
  name: `worker-${id}`,
  cluster_id: 7,
  labels,
  maintenance: { enabled: false }
});
const mount = async (t: any, rows: any[], selected: number[] = []) => {
  for (const fn of [
    updateWorker,
    success,
    warning,
    fetchData,
    handleDeleteBatch,
    clearSelections
  ]) {
    fn.mock.resetCalls();
  }
  writeWorker = async () => ({});
  table = {
    dataSource: {
      dataList: rows,
      total: rows.length,
      loading: false,
      loadend: true
    },
    rowSelection: { selectedRowKeys: selected, clearSelections },
    queryParams: { page: 1, perPage: 10 },
    modalRef: { current: null },
    extraStatus: { firstLoad: false },
    sortOrder: {},
    fetchData,
    handleDelete: empty,
    handleDeleteBatch,
    handlePageChange: empty,
    handleTableChange: empty,
    handleSearch: empty,
    handleQueryChange: empty,
    handleNameChange: empty
  };
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  await act(async () => root.render(createElement(Workers)));
  return root;
};
const openBatch = async (count: number) => {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-batch-action="labels"]'
  );
  assert.ok(button, 'the real worker toolbar exposes batch label editing');
  assert.equal(button.disabled, false);
  await act(async () => button.click());
  assert.equal(labelsModal.open, true);
  assert.equal(labelsModal.batch, true);
  assert.equal(labelsModal.count, count);
};
const submit = async (labels: any) => {
  await act(async () => labelsModal.onOk({ labels }));
};
const writes = () => updateWorker.mock.calls.map((call) => call.arguments);

test('batch actions use location by default and open only its location popover', async (t) => {
  const selected = worker(1, { rack: 'rack-a' });
  await mount(t, [selected], [1]);
  assert.deepEqual(
    batchActions.items.map((item: any) => item.key),
    ['location', 'labels', 'delete']
  );
  assert.equal(batchActions.disabled, false);
  assert.equal(batchActions.size, 'large');
  assert.equal(batchActions.showText, true);
  const primary = document.querySelector<HTMLButtonElement>(
    '[data-batch-action="location"]'
  )!;
  assert.match(primary.textContent!, /\(1\)/);
  await act(async () => primary.click());

  assert.equal(locationPopover.open, true);
  assert.deepEqual(locationPopover.workers, [selected]);
  assert.equal(labelsModal.open, false);
  assert.equal(updateWorker.mock.callCount(), 0);
  assert.equal(handleDeleteBatch.mock.callCount(), 0);
  await act(async () => locationPopover.onOpenChange(false));
  assert.equal(locationPopover.open, false);
});

test('the entire batch action group is disabled without a worker selection', async (t) => {
  await mount(t, [worker(1, { rack: 'rack-a' })]);
  assert.equal(batchActions.disabled, true);
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-batch-action]')
  ];
  assert.equal(buttons.length, 3);
  for (const button of buttons) {
    assert.equal(button.disabled, true);
    await act(async () => button.click());
  }
  assert.equal(locationPopover.open, false);
  assert.equal(labelsModal.open, false);
  assert.equal(handleDeleteBatch.mock.callCount(), 0);
  assert.equal(updateWorker.mock.callCount(), 0);
});

test('labels and delete keep the location popover closed and preserve batch deletion', async (t) => {
  await mount(t, [worker(1, { rack: 'rack-a' })], [1]);
  await openBatch(1);
  // A Popover wrapping the group can receive a click from a non-location
  // action. Its trigger must not independently open the location editor.
  await act(async () => locationPopover.onOpenChange(true));
  assert.equal(locationPopover.open, false);
  assert.equal(handleDeleteBatch.mock.callCount(), 0);
  await act(async () => labelsModal.onCancel());
  const button = document.querySelector<HTMLButtonElement>(
    '[data-batch-action="delete"]'
  )!;
  await act(async () => button.click());
  await act(async () => locationPopover.onOpenChange(true));

  assert.equal(handleDeleteBatch.mock.callCount(), 1);
  assert.equal(locationPopover.open, false);
  assert.equal(labelsModal.open, false);
  assert.equal(updateWorker.mock.callCount(), 0);
});

test('the toolbar selection of one adds labels without clearing existing ones', async (t) => {
  const original = worker(1, { zone: 'zone-a', owner: 'alice' });
  await mount(t, [original], [1]);
  await openBatch(1);
  await submit({ a: 'value-a', b: 'value-b' });

  assert.deepEqual(writes(), [
    [
      1,
      {
        ...original,
        labels: { zone: 'zone-a', owner: 'alice', a: 'value-a', b: 'value-b' }
      }
    ]
  ]);
  assert.deepEqual(original.labels, { zone: 'zone-a', owner: 'alice' });
  assert.equal(labelsModal.open, false);
  assert.equal(clearSelections.mock.callCount(), 1);
});

test('a batch preserves each worker own labels and overwrites matching keys', async (t) => {
  const first = worker(1, { rack: 'old-a', owner: 'alice' });
  const second = worker(2, { rack: 'old-b', pool: 'gpu' });
  await mount(t, [first, second], [1, 2]);
  await openBatch(2);
  await submit({ rack: 'new-rack', shared: 'yes' });

  assert.deepEqual(writes(), [
    [
      1,
      { ...first, labels: { rack: 'new-rack', owner: 'alice', shared: 'yes' } }
    ],
    [2, { ...second, labels: { rack: 'new-rack', pool: 'gpu', shared: 'yes' } }]
  ]);
  assert.deepEqual(first.labels, { rack: 'old-a', owner: 'alice' });
  assert.deepEqual(second.labels, { rack: 'old-b', pool: 'gpu' });
});

test('empty batch input preserves labels, including workers with no label map', async (t) => {
  const rows = [
    worker(1, { rack: 'rack-a' }),
    worker(2, null),
    worker(3, undefined)
  ];
  await mount(t, rows, [1, 2, 3]);
  await openBatch(3);
  await submit({});

  assert.deepEqual(
    writes().map(([id, data]) => [id, data.labels]),
    [
      [1, { rack: 'rack-a' }],
      [2, {}],
      [3, {}]
    ]
  );
});

for (const labels of [{ keep: 'yes' }, {}]) {
  test(`single-row editing can ${Object.keys(labels).length ? 'remove one label' : 'clear every label'}`, async (t) => {
    const original = worker(1, { keep: 'yes', remove: 'old' });
    await mount(t, [original]);
    await act(async () => columnActions.handleSelect('edit', original));
    assert.equal(labelsModal.batch, false);
    assert.deepEqual(labelsModal.data.labels, original.labels);
    await submit(labels);

    assert.deepEqual(writes(), [[1, { ...original, labels }]]);
    assert.equal(clearSelections.mock.callCount(), 0);
  });
}

test('a batch uses the latest worker labels when the list refreshes after opening', async (t) => {
  const original = worker(1, { rack: 'before-open' });
  const root = await mount(t, [original], [1]);
  await openBatch(1);
  const refreshed = worker(1, { rack: 'refreshed', discovered: 'new-label' });
  table.dataSource = { ...table.dataSource, dataList: [refreshed] };
  await act(async () => root.render(createElement(Workers)));
  await submit({ owner: 'alice' });

  assert.deepEqual(writes(), [
    [
      1,
      {
        ...refreshed,
        labels: { rack: 'refreshed', discovered: 'new-label', owner: 'alice' }
      }
    ]
  ]);
});

test('a failed worker does not prevent other selected workers receiving merged labels', async (t) => {
  const rows = [worker(1, { rack: 'rack-a' }), worker(2, { rack: 'rack-b' })];
  await mount(t, rows, [1, 2]);
  writeWorker = async (id) => {
    if (id === 1) throw new Error('first worker failed');
    return {};
  };
  await openBatch(2);
  await submit({ owner: 'alice' });

  assert.deepEqual(
    writes().map(([id, data]) => [id, data.labels]),
    [
      [1, { rack: 'rack-a', owner: 'alice' }],
      [2, { rack: 'rack-b', owner: 'alice' }]
    ]
  );
  assert.equal(success.mock.callCount(), 0);
  assert.equal(warning.mock.callCount(), 1);
  assert.match(warning.mock.calls[0].arguments[0], /"done":1,"failed":1/);
  assert.equal(fetchData.mock.callCount(), 1);
  assert.equal(clearSelections.mock.callCount(), 1);
  assert.equal(labelsModal.open, false);
});
