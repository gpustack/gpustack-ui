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
const handleQueryChange = mock.fn();
const fetchLabelOptions = mock.fn(async (_scope?: number) => undefined);
const labelOptions = [{ value: 'arch=amd64', label: 'arch: amd64' }];
const clearSelections = mock.fn(() => {
  table.rowSelection.selectedRowKeys = [];
});
let table: any;
let labelsModal: any;
let columnActions: any;
let batchActions: any;
let workerFilters: any;
const queryWorker = mock.fn(async (_id: number) => ({}));
const updateWorker = mock.fn(async (_id: number, _data: any) => ({}));
let writeLabels = async (_data: any) => {};
const updateWorkerLabels = mock.fn((data: any) => writeLabels(data));

mock.module('@ant-design/icons', {
  namedExports: {
    DeleteOutlined: empty,
    PlusOutlined: empty,
    TagsOutlined: empty
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: empty,
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
    FilterBar: ({ left, right }: any) =>
      createElement(Fragment, null, left, right),
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
    queryWorker,
    updateWorker,
    updateWorkerLabels
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
mock.module(new URL('../worker-filters.tsx', import.meta.url).href, {
  defaultExport: (props: any) => {
    workerFilters = props;
    return null;
  }
});
mock.module(
  new URL('../../hooks/use-worker-label-options.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      labelOptions,
      labelOptionsLoading: false,
      fetchLabelOptions
    })
  }
);
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
    queryWorker,
    updateWorker,
    updateWorkerLabels,
    success,
    warning,
    fetchData,
    handleDeleteBatch,
    handleQueryChange,
    fetchLabelOptions,
    clearSelections
  ]) {
    fn.mock.resetCalls();
  }
  writeLabels = async () => {};
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
    handleQueryChange,
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
const batches = () =>
  updateWorkerLabels.mock.calls.map((call) => call.arguments);

test('exact label filters and clearing reset pagination', async (t) => {
  await mount(t, [worker(1, { region: 'beijing' })]);
  for (const label of [
    ['region=beijing'],
    ['region=beijing', 'env=production'],
    ['Region=Beijing'],
    ['region='],
    ['city=New York'],
    []
  ]) {
    await act(async () => workerFilters.onLabelChange(label));
  }
  assert.deepEqual(
    handleQueryChange.mock.calls.map((call) => call.arguments),
    [
      ['region=beijing'],
      ['region=beijing', 'env=production'],
      ['Region=Beijing'],
      ['region='],
      ['city=New York'],
      []
    ].map((label) => [{ page: 1, label }])
  );
  assert.equal(workerFilters.showCluster, true);
  assert.deepEqual(workerFilters.labelOptions, labelOptions);
  assert.deepEqual(
    fetchLabelOptions.mock.calls.map((call) => call.arguments),
    [[undefined]]
  );
});

test('cluster changes and manual refresh reload the candidate scope, but label changes do not', async (t) => {
  await mount(t, [worker(1, {})]);
  await act(async () => workerFilters.onClusterChange(7));
  table.queryParams.cluster_id = 7;
  await act(async () => workerFilters.onRefresh());
  await act(async () => workerFilters.onLabelChange(['arch=amd64']));
  assert.deepEqual(
    fetchLabelOptions.mock.calls.map((call) => call.arguments),
    [[undefined], [7], [7]]
  );
  assert.deepEqual(handleQueryChange.mock.calls[0].arguments, [
    { page: 1, cluster_id: 7 }
  ]);
});

test('row label shortcuts add conditions without toggling or duplicating selected labels', async (t) => {
  const root = await mount(t, [worker(1, { arch: 'amd64' })]);
  table.queryParams.label = ['region=beijing'];
  await act(async () => root.render(createElement(Workers)));
  await act(async () => columnActions.onLabelFilter('region=beijing'));
  assert.equal(handleQueryChange.mock.callCount(), 0);
  await act(async () => columnActions.onLabelFilter('arch=amd64'));
  assert.deepEqual(handleQueryChange.mock.calls[0].arguments, [
    { page: 1, label: ['region=beijing', 'arch=amd64'] }
  ]);
  assert.equal(fetchLabelOptions.mock.callCount(), 1);
});

test('batch actions use labels by default and open the batch label editor', async (t) => {
  const selected = worker(1, { rack: 'rack-a' });
  await mount(t, [selected], [1]);
  assert.deepEqual(
    batchActions.items.map((item: any) => item.key),
    ['labels', 'delete']
  );
  assert.equal(batchActions.disabled, false);
  assert.equal(batchActions.size, 'large');
  assert.equal(batchActions.showText, true);
  const primary = document.querySelector<HTMLButtonElement>(
    '[data-batch-action="labels"]'
  )!;
  assert.match(primary.textContent!, /\(1\)/);
  await act(async () => primary.click());

  assert.equal(labelsModal.open, true);
  assert.equal(labelsModal.batch, true);
  assert.equal(labelsModal.count, 1);
  assert.equal(updateWorker.mock.callCount(), 0);
  assert.equal(handleDeleteBatch.mock.callCount(), 0);
});

test('the entire batch action group is disabled without a worker selection', async (t) => {
  await mount(t, [worker(1, { rack: 'rack-a' })]);
  assert.equal(batchActions.disabled, true);
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-batch-action]')
  ];
  assert.equal(buttons.length, 2);
  for (const button of buttons) {
    assert.equal(button.disabled, true);
    await act(async () => button.click());
  }
  assert.equal(labelsModal.open, false);
  assert.equal(handleDeleteBatch.mock.callCount(), 0);
  assert.equal(updateWorker.mock.callCount(), 0);
});

test('labels and delete invoke their own actions and preserve batch deletion', async (t) => {
  await mount(t, [worker(1, { rack: 'rack-a' })], [1]);
  await openBatch(1);
  assert.equal(handleDeleteBatch.mock.callCount(), 0);
  await act(async () => labelsModal.onCancel());
  const button = document.querySelector<HTMLButtonElement>(
    '[data-batch-action="delete"]'
  )!;
  await act(async () => button.click());

  assert.equal(handleDeleteBatch.mock.callCount(), 1);
  assert.equal(labelsModal.open, false);
  assert.equal(updateWorker.mock.callCount(), 0);
});

for (const ids of [[1], [1, 2]]) {
  test(`selection ${ids} sends only the label patch in one batch request`, async (t) => {
    const rows = [
      worker(1, { rack: 'old-a', owner: 'alice' }),
      worker(2, { rack: 'old-b', pool: 'gpu' })
    ];
    await mount(t, rows, ids);
    await openBatch(ids.length);
    const labels = { rack: 'new-rack', shared: 'yes' };
    await submit(labels);

    assert.deepEqual(batches(), [[{ worker_ids: ids, labels }]]);
    assert.equal(queryWorker.mock.callCount(), 0);
    assert.deepEqual(writes(), []);
    assert.deepEqual(rows[0].labels, { rack: 'old-a', owner: 'alice' });
    assert.deepEqual(rows[1].labels, { rack: 'old-b', pool: 'gpu' });
    assert.equal(labelsModal.open, false);
    assert.equal(clearSelections.mock.callCount(), 1);
    assert.equal(fetchData.mock.callCount(), 1);
    assert.equal(success.mock.callCount(), 1);
  });
}

test('empty batch makes no request and retains the selection and form', async (t) => {
  await mount(
    t,
    [worker(1, { rack: 'rack-a' }), worker(2, null), worker(3, undefined)],
    [1, 2, 3]
  );
  await openBatch(3);
  await submit({});

  assert.deepEqual(batches(), []);
  assert.deepEqual(writes(), []);
  assert.equal(queryWorker.mock.callCount(), 0);
  assert.equal(clearSelections.mock.callCount(), 0);
  assert.equal(fetchData.mock.callCount(), 0);
  assert.equal(success.mock.callCount(), 0);
  assert.equal(labelsModal.open, true);
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
    assert.deepEqual(batches(), []);
    assert.equal(queryWorker.mock.callCount(), 0);
    assert.equal(clearSelections.mock.callCount(), 0);
    assert.equal(fetchData.mock.callCount(), 1);
    assert.equal(labelsModal.open, false);
  });
}

test('list refreshes do not add stale labels or non-label fields to the batch payload', async (t) => {
  const original = worker(1, {
    rack: 'before-open',
    deleted: 'do-not-restore'
  });
  const root = await mount(t, [original], [1]);
  await openBatch(1);
  const refreshed = {
    ...worker(1, { rack: 'refreshed', discovered: 'new-label' }),
    name: 'renamed',
    maintenance: { enabled: true }
  };
  table.dataSource = { ...table.dataSource, dataList: [refreshed] };
  await act(async () => root.render(createElement(Workers)));
  await submit({ owner: 'alice' });

  assert.deepEqual(batches(), [
    [{ worker_ids: [1], labels: { owner: 'alice' } }]
  ]);
  assert.deepEqual(writes(), []);
  assert.equal(queryWorker.mock.callCount(), 0);
  assert.deepEqual(refreshed.labels, {
    rack: 'refreshed',
    discovered: 'new-label'
  });
});

test('a failed batch retains all targets and the modal for retry without reporting success', async (t) => {
  await mount(t, [worker(1, { rack: 'rack-a' })], [1, 2]);
  writeLabels = async () => {
    throw new Error('batch failed');
  };
  await openBatch(2);
  const labels = { owner: 'alice' };
  await submit(labels);

  assert.deepEqual(batches(), [[{ worker_ids: [1, 2], labels }]]);
  assert.deepEqual(writes(), []);
  assert.equal(success.mock.callCount(), 0);
  assert.equal(warning.mock.callCount(), 0);
  assert.equal(fetchData.mock.callCount(), 0);
  assert.equal(clearSelections.mock.callCount(), 0);
  assert.deepEqual(table.rowSelection.selectedRowKeys, [1, 2]);
  assert.equal(labelsModal.open, true);
  assert.equal(labelsModal.count, 2);

  writeLabels = async () => {};
  await submit(labels);
  assert.deepEqual(batches()[1], [{ worker_ids: [1, 2], labels }]);
  assert.equal(success.mock.callCount(), 1);
  assert.equal(fetchData.mock.callCount(), 1);
  assert.equal(clearSelections.mock.callCount(), 1);
  assert.equal(labelsModal.open, false);
});

test('a worker selected on an earlier page is included after navigating away', async (t) => {
  const root = await mount(t, [worker(1, { rack: 'rack-a' })], [1]);
  table.dataSource = {
    ...table.dataSource,
    dataList: [worker(2, { rack: 'rack-b' })]
  };
  await act(async () => root.render(createElement(Workers)));
  await openBatch(1);
  await submit({ pool: 'gpu' });

  assert.deepEqual(batches(), [[{ worker_ids: [1], labels: { pool: 'gpu' } }]]);
  assert.equal(queryWorker.mock.callCount(), 0);
  assert.deepEqual(writes(), []);
});

test('a cross-page selection includes every selected ID and excludes unselected visible workers', async (t) => {
  const unselected = worker(3, { rack: 'rack-c', untouched: 'yes' });
  await mount(t, [worker(2, { rack: 'rack-b' }), unselected], [1, 2]);
  await openBatch(2);
  await submit({ rack: 'shared-rack' });

  assert.deepEqual(batches(), [
    [{ worker_ids: [1, 2], labels: { rack: 'shared-rack' } }]
  ]);
  assert.equal(queryWorker.mock.callCount(), 0);
  assert.deepEqual(writes(), []);
  assert.deepEqual(unselected.labels, { rack: 'rack-c', untouched: 'yes' });
});

test('selection clearing and refresh wait for the batch request to succeed', async (t) => {
  await mount(t, [worker(1, {})], [1]);
  let resolveRequest!: () => void;
  writeLabels = () =>
    new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });
  await openBatch(1);
  let pending!: Promise<void>;
  await act(async () => {
    pending = labelsModal.onOk({ labels: { env: 'prod' } });
  });
  assert.equal(labelsModal.open, true);
  assert.equal(clearSelections.mock.callCount(), 0);
  assert.equal(fetchData.mock.callCount(), 0);
  assert.equal(success.mock.callCount(), 0);
  await act(async () => {
    resolveRequest();
    await pending;
  });
  assert.equal(labelsModal.open, false);
  assert.equal(clearSelections.mock.callCount(), 1);
  assert.equal(fetchData.mock.callCount(), 1);
  assert.equal(success.mock.callCount(), 1);
});
