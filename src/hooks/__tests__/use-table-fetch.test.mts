import { JSDOM } from 'jsdom';
import _ from 'lodash';
import assert from 'node:assert/strict';
import { mock, test, type TestContext } from 'node:test';
import { act, createElement, useEffect, useRef, useState } from 'react';

// Exercise the shipped list merger without importing browser-only UI components.
const { default: useUpdateChunkedList } = await import(
  new URL(
    './lib/hooks/use-update-chunk-list.es.js',
    import.meta.resolve('@gpustack/core-ui')
  ).href
);
const EventType = { CREATE: 1, UPDATE: 2, DELETE: 3 };
type Worker = {
  id: number;
  name: string;
  created_at: string;
  state?: string;
  status?: any;
};
type Subscription = {
  url: string;
  handler: (events: any) => void;
  contentType?: string;
  beforeReconnect?: () => void;
  response?: string;
  cancel: ReturnType<typeof mock.fn>;
};
const subscriptions: Subscription[] = [];
const visibility: { current: any }[] = [];
let seedWorkers: Worker[] = [];

function useLatestCallback(fn: (...args: any[]) => any) {
  const latest = useRef(fn);
  latest.current = fn;
  const [callback] = useState(
    () =>
      (...args: any[]) =>
        latest.current(...args)
  );
  return callback;
}
mock.module('ahooks', {
  namedExports: {
    useMemoizedFn: useLatestCallback,
    useDebounceFn: (fn: (...args: any[]) => any, options: any) => {
      const callback = useLatestCallback(fn);
      const [run] = useState(() => _.debounce(callback, options.wait, options));
      useEffect(() => () => run.cancel(), [run]);
      return { run, cancel: run.cancel };
    }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    useUpdateChunkedList,
    createAxiosToken: () => ({ token: {}, cancel: mock.fn() }),
    useChunkRequest: () => {
      const current = useRef<any>(null);
      return {
        setChunkRequest: (config: any) => {
          const subscription = { ...config, cancel: mock.fn() };
          current.current = subscription;
          subscriptions.push(subscription);
          return current;
        }
      };
    },
    usePageVisibility: (options: any) => {
      const current = useRef(options);
      current.current = options;
      useEffect(() => {
        visibility.push(current);
      }, []);
    },
    useTableMultiSort: () => ({
      sortOrder: {},
      handleMultiSortChange: (sorter: any) =>
        sorter.order
          ? [`${sorter.order === 'descend' ? '-' : ''}${sorter.field}`]
          : []
    }),
    useTableRowSelection: () => ({ removeSelectedKeys() {} })
  }
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: { WatchEventType: EventType }
});
mock.module(new URL('../../utils/index.ts', import.meta.url).href, {
  namedExports: { handleBatchRequest() {} }
});
mock.module(new URL('../use-pagination-status.ts', import.meta.url).href, {
  namedExports: {
    usePaginationStatus: () => ({
      pagination: { perPage: 3 },
      setPagination() {}
    })
  }
});
mock.module(
  new URL(
    '../../pages/resources/services/use-query-worker-list.ts',
    import.meta.url
  ).href,
  {
    defaultExport: () => ({
      fetchData: async () => seedWorkers,
      cancelRequest() {}
    })
  }
);
mock.module(
  new URL('../../pages/resources/apis/index.ts', import.meta.url).href,
  {
    namedExports: { WORKERS_API: '/workers' }
  }
);

const { createRoot } = await import('react-dom/client');
const { default: useTableFetch } = await import('../use-table-fetch.ts');
const { default: useAddWorkerMessage } =
  await import('../../pages/cluster-management/hooks/use-add-worker-message.ts');

const worker = (id: number): Worker => ({
  id,
  name: `worker-${id}`,
  created_at: '2025-01-01T00:00:00Z'
});
const response = (ids: number[], total = 200, page = 1, perPage = 3) => ({
  items: ids.map(worker),
  pagination: { total, totalPage: Math.ceil(total / perPage), page, perPage }
});
const event = (type: number, item: Worker) => ({
  type,
  data: item,
  collection: [item],
  ids: type === EventType.DELETE ? [item.id] : []
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function mount(
  t: TestContext,
  options: { manual?: boolean; drawer?: boolean; seed?: number[] } = {}
) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() });
  subscriptions.length = 0;
  visibility.length = 0;
  seedWorkers = (options.seed || []).map(worker);
  const dom = new JSDOM('<div id="root"></div>');
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
  });
  let respond: (params: any) => any = () => response([200, 197, 198]);
  const fetchPage = mock.fn(async (params: any) => respond(params));
  let table!: ReturnType<typeof useTableFetch<Worker>>;
  let drawer!: ReturnType<typeof useAddWorkerMessage>;
  function Drawer() {
    drawer = useAddWorkerMessage();
    return null;
  }
  function Harness() {
    table = useTableFetch<Worker>({
      key: 'Workers',
      API: '/workers',
      watch: true,
      events: ['CREATE', 'UPDATE', 'DELETE'],
      updateManually: options.manual !== false,
      fetchAPI: fetchPage,
      defaultQueryParams: { cluster_id: 1 }
    });
    return options.drawer ? createElement(Drawer) : null;
  }
  const root = createRoot(document.getElementById('root')!);
  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    await act(async () => root.unmount());
    dom.window.close();
  };
  t.after(dispose);
  const advance = async (milliseconds: number) => {
    await act(async () => t.mock.timers.tick(milliseconds));
  };
  await act(async () => root.render(createElement(Harness)));
  await advance(200);
  await advance(200);
  return {
    get table() {
      return table;
    },
    get drawer() {
      return drawer;
    },
    get ids() {
      return table.dataSource.dataList.map((item) => item.id);
    },
    fetchPage,
    respond: (next: typeof respond) => {
      respond = next;
    },
    advance,
    dispose,
    async raw(subscription: Subscription, chunk: string) {
      subscription.response = (subscription.response || '') + chunk;
      await act(async () => subscription.handler(subscription.response));
    },
    async emit(subscription: Subscription, events: any[]) {
      await act(async () => {
        if (subscription.contentType === 'text') {
          subscription.response =
            (subscription.response || '') +
            events.map((event) => JSON.stringify(event) + '\n\n').join('');
          subscription.handler(subscription.response);
        } else {
          subscription.handler(events);
        }
      });
    }
  };
}

test('cluster replay preserves the fetched page and coalesces refreshes across renders', async (t) => {
  const h = await mount(t);
  const oldWatch = subscriptions[0];
  await act(async () => h.table.handleQueryChange({ cluster_id: 2, page: 1 }));
  assert.ok(oldWatch.cancel.mock.callCount() > 0);
  const watch = subscriptions.at(-1)!;
  assert.equal(watch.url, '/workers?cluster_id=2');
  const replay = Array.from({ length: 200 }, (_, i) =>
    event(EventType.CREATE, worker(i + 1))
  );
  for (let i = 0; i < replay.length; i += 25) {
    await h.emit(watch, replay.slice(i, i + 25));
  }
  assert.deepEqual(h.ids, [200, 197, 198]);
  await h.advance(200);
  assert.deepEqual(h.ids, [200, 197, 198]);
  await h.advance(800);
  assert.equal(h.fetchPage.mock.callCount(), 3);
  assert.equal(h.fetchPage.mock.calls.at(-1)!.arguments[0].cluster_id, 2);
  assert.deepEqual(h.ids, [200, 197, 198]);
});

test('new rows use the current page and sort, regardless of their creation timestamp', async (t) => {
  const h = await mount(t);
  await act(async () =>
    h.table.handleTableChange(
      {},
      {},
      { field: 'name', order: 'ascend' },
      { action: 'sort' }
    )
  );
  h.respond(() => response([197, 198, 199], 201, 2));
  await act(async () =>
    h.table.handleQueryChange({ page: 2 }, { paginate: true })
  );
  const before = h.fetchPage.mock.callCount();
  await h.emit(subscriptions[0], [event(EventType.CREATE, worker(201))]);
  assert.deepEqual(h.ids, [197, 198, 199]);
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), before + 1);
  assert.deepEqual(h.fetchPage.mock.calls.at(-1)!.arguments[0], {
    page: 2,
    perPage: 3,
    cluster_id: 1,
    sort_by: 'name'
  });
  assert.equal(h.table.dataSource.total, 201);
  assert.deepEqual(h.ids, [197, 198, 199]);
});

test('watch updates replace visible rows without inserting off-page rows or querying', async (t) => {
  const h = await mount(t);
  await h.emit(subscriptions[0], [
    event(EventType.UPDATE, { ...worker(197), state: 'ready' }),
    {
      ...event(EventType.UPDATE, worker(1)),
      changed_fields: { state: [['not_ready'], ['ready']] }
    },
    event(EventType.CREATE, { ...worker(198), state: 'ready' })
  ]);
  assert.deepEqual(h.ids, [200, 197, 198]);
  assert.equal(h.table.dataSource.dataList[1].state, 'ready');
  assert.equal(h.table.dataSource.dataList[2].state, 'ready');
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 1);
});

test('deletions inside and outside the page refresh its membership and totals', async (t) => {
  const h = await mount(t);
  h.respond(() => response([200, 198, 196], 198));
  await h.emit(subscriptions[0], [
    event(EventType.DELETE, worker(1)),
    event(EventType.DELETE, worker(197))
  ]);
  assert.deepEqual(h.ids, [200, 198]);
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 2);
  assert.deepEqual(h.ids, [200, 198, 196]);
  assert.equal(h.table.dataSource.total, 198);
});

test('an off-page deletion alone refreshes the total', async (t) => {
  const h = await mount(t);
  h.respond(() => response([200, 197, 198], 199));
  await h.emit(subscriptions[0], [event(EventType.DELETE, worker(1))]);
  assert.deepEqual(h.ids, [200, 197, 198]);
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 2);
  assert.equal(h.table.dataSource.total, 199);
});

test('deleting the final row on the final page updates the selected page', async (t) => {
  const h = await mount(t);
  h.respond(() => response([7], 7, 3));
  await act(async () =>
    h.table.handleQueryChange({ page: 3 }, { paginate: true })
  );
  h.respond((params) =>
    response(params.page === 3 ? [] : [4, 5, 6], 6, params.page)
  );
  await h.emit(subscriptions[0], [event(EventType.DELETE, worker(7))]);
  await h.advance(1000);
  assert.equal(h.table.queryParams.page, 2);
  assert.deepEqual(h.ids, [4, 5, 6]);
});

test('page and page-size changes keep the watch alive and use the new page cache', async (t) => {
  const h = await mount(t);
  const watch = subscriptions[0];
  h.respond(() => response([6, 5, 4, 3, 2], 200, 2, 5));
  await act(async () => h.table.handlePageChange(2, 5));
  assert.equal(watch.cancel.mock.callCount(), 0);
  assert.equal(subscriptions.length, 1);
  await h.emit(watch, [
    event(EventType.UPDATE, { ...worker(4), state: 'ready' })
  ]);
  await h.advance(200);
  assert.deepEqual(h.ids, [6, 5, 4, 3, 2]);
  assert.equal(h.table.dataSource.dataList[2].state, 'ready');
});

test('older requests and parser callbacks cannot replace a newer cluster', async (t) => {
  const h = await mount(t);
  const oldWatch = subscriptions[0];
  const slow = deferred<ReturnType<typeof response>>();
  h.respond((params) =>
    params.cluster_id === 2 ? slow.promise : response([30, 29, 28])
  );
  let pending!: Promise<void>;
  await act(async () => {
    pending = h.table.handleQueryChange({ cluster_id: 2 });
  });
  await act(async () => h.table.handleQueryChange({ cluster_id: 3 }));
  await act(async () => {
    slow.resolve(response([20, 19, 18]));
    await pending;
  });
  await h.emit(oldWatch, [
    event(EventType.UPDATE, worker(200)),
    event(EventType.CREATE, worker(999))
  ]);
  await h.advance(1000);
  assert.deepEqual(h.ids, [30, 29, 28]);
  assert.equal(h.table.queryParams.cluster_id, 3);
  assert.equal(subscriptions.length, 2);
  assert.equal(subscriptions[1].url, '/workers?cluster_id=3');
  assert.equal(h.fetchPage.mock.callCount(), 3);
});

test('switching filters and hiding the page cancel pending background refreshes', async (t) => {
  const h = await mount(t);
  await h.emit(subscriptions[0], [event(EventType.CREATE, worker(201))]);
  await act(async () => h.table.handleQueryChange({ cluster_id: 2 }));
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 2);
  await h.emit(subscriptions[1], [event(EventType.CREATE, worker(202))]);
  await act(async () => h.table.cancelRequestsOnPageInactive());
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 2);
  await act(async () => h.table.resumeRequestsOnPageActive());
  await h.emit(subscriptions[2], [event(EventType.CREATE, worker(203))]);
  await h.dispose();
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 3);
});

test('continuous replay has a bounded refresh delay', async (t) => {
  const h = await mount(t);
  for (let i = 0; i < 4; i++) {
    await h.emit(subscriptions[0], [event(EventType.CREATE, worker(i + 1))]);
    await h.advance(800);
  }
  assert.equal(h.fetchPage.mock.callCount(), 2);
  assert.deepEqual(h.ids, [200, 197, 198]);
});

test('ordinary lists retain the shared CREATE insertion behavior', async (t) => {
  const h = await mount(t, { manual: false });
  await h.emit(subscriptions[0], [event(EventType.CREATE, worker(201))]);
  assert.deepEqual(h.ids, [201, 200, 197]);
  await h.advance(200);
});

for (const seed of [[], [1, 2, 3, 4]]) {
  test(`drawer success count stays independent of pagination and deduplicates replay (${seed.length} existing workers)`, async (t) => {
    const h = await mount(t, { drawer: true, seed });
    await act(async () => {
      await h.drawer.createModelsChunkRequest({ cluster_id: 1 });
    });
    const drawerWatch = subscriptions.at(-1)!;
    await h.emit(
      drawerWatch,
      seed.map((id) => event(EventType.CREATE, worker(id)))
    );
    assert.equal(h.drawer.addedCount, 0);
    await h.emit(subscriptions[0], [event(EventType.CREATE, worker(101))]);
    assert.equal(h.drawer.addedCount, 0);
    await h.emit(drawerWatch, [
      event(EventType.CREATE, worker(101)),
      event(EventType.CREATE, worker(102))
    ]);
    assert.equal(h.drawer.addedCount, 2);
    await act(async () => h.table.handleQueryChange({ cluster_id: 2 }));
    assert.equal(drawerWatch.cancel.mock.callCount(), 0);
    await act(async () => visibility[0].current.onHidden());
    await act(async () => visibility[0].current.onVisible());
    const reconnected = subscriptions.at(-1)!;
    await h.emit(
      reconnected,
      [...seed, 101, 102, 103].map((id) => event(EventType.CREATE, worker(id)))
    );
    assert.equal(h.drawer.addedCount, 3);
    await h.advance(200);
  });
}

test('REST and watch keep every label filter when tags change or clear', async (t) => {
  const h = await mount(t);
  const labels = ['arch=amd64', 'city=New York, US'];
  await act(async () => h.table.handleQueryChange({ page: 1, label: labels }));
  const request = h.fetchPage.mock.calls.at(-1)!.arguments[0];
  assert.deepEqual(request.label, labels);
  let query = new URL(subscriptions.at(-1)!.url, 'http://localhost')
    .searchParams;
  assert.deepEqual(query.getAll('label'), labels);
  assert.equal(query.has('label[]'), false);
  assert.equal(query.get('cluster_id'), '1');

  await act(async () => h.table.handleQueryChange({ page: 1, label: [] }));
  assert.deepEqual(h.fetchPage.mock.calls.at(-1)!.arguments[0].label, []);
  query = new URL(subscriptions.at(-1)!.url, 'http://localhost').searchParams;
  assert.equal(query.has('label'), false);
});

test('updating a visible sort field refetches the ordered page', async (t) => {
  const h = await mount(t);
  await act(async () =>
    h.table.handleQueryChange({ sort_by: 'name' }, { paginate: true })
  );
  h.respond(() => response([198, 200, 197]));
  await h.emit(subscriptions[0], [
    event(EventType.UPDATE, { ...worker(197), name: 'zulu' })
  ]);
  const before = h.fetchPage.mock.callCount();
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), before + 1);
  assert.deepEqual(h.ids, [198, 200, 197]);
  assert.equal(h.fetchPage.mock.calls.at(-1)!.arguments[0].sort_by, 'name');
});

for (const metadata of [undefined, {}, { name: [['worker-1'], ['aaa']] }]) {
  test(`an off-page sort update refreshes membership (${metadata ? 'with' : 'without'} change metadata)`, async (t) => {
    const h = await mount(t);
    await act(async () =>
      h.table.handleQueryChange(
        { sort_by: 'name', page: 2 },
        { paginate: true }
      )
    );
    h.respond(() => response([1, 200, 197], 200, 2));
    await h.emit(subscriptions[0], [
      {
        ...event(EventType.UPDATE, { ...worker(1), name: 'aaa' }),
        changed_fields: metadata
      }
    ]);
    assert.deepEqual(h.ids, [200, 197, 198]);
    await h.advance(1000);
    assert.deepEqual(h.ids, [1, 200, 197]);
    assert.equal(h.fetchPage.mock.calls.at(-1)!.arguments[0].page, 2);
  });
}

for (const sortBy of [
  'name,-state',
  '-status.cpu.utilization_rate',
  'status.memory.utilization_rate',
  '-gpus'
]) {
  test(`sort changes refresh nested, secondary and aliased fields (${sortBy})`, async (t) => {
    const h = await mount(t);
    await act(async () =>
      h.table.handleQueryChange({ sort_by: sortBy }, { paginate: true })
    );
    const before = h.fetchPage.mock.callCount();
    await h.emit(subscriptions[0], [
      event(EventType.UPDATE, {
        ...worker(197),
        state: 'ready',
        status: {
          cpu: { utilization_rate: 90 },
          memory: { utilization_rate: 80 },
          gpu_devices: [{}]
        }
      })
    ]);
    await h.advance(1000);
    assert.equal(h.fetchPage.mock.callCount(), before + 1);
    assert.equal(h.fetchPage.mock.calls.at(-1)!.arguments[0].sort_by, sortBy);
  });
}

test('unrelated updates do not refetch a name-sorted page', async (t) => {
  const h = await mount(t);
  await act(async () =>
    h.table.handleQueryChange({ sort_by: 'name' }, { paginate: true })
  );
  const before = h.fetchPage.mock.callCount();
  await h.emit(subscriptions[0], [
    event(EventType.UPDATE, { ...worker(197), state: 'ready' }),
    {
      ...event(EventType.UPDATE, worker(1)),
      changed_fields: { status: [{}, { cpu: { utilization_rate: 90 } }] }
    }
  ]);
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), before);
});

test('a pending REST response retains the newest visible watch update', async (t) => {
  const h = await mount(t);
  const slow = deferred<ReturnType<typeof response>>();
  h.respond(() => slow.promise);
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = h.table.fetchData();
  });
  await h.emit(subscriptions[0], [
    event(EventType.UPDATE, { ...worker(197), state: 'ready' })
  ]);
  await h.emit(subscriptions[0], [
    event(EventType.UPDATE, { ...worker(197), state: 'not_ready' })
  ]);
  await act(async () => {
    slow.resolve(response([200, 197, 198]));
    await pending;
  });
  assert.equal(h.table.dataSource.dataList[1].state, 'not_ready');
});

test('updates to rows on an incoming page survive its pending REST response', async (t) => {
  const h = await mount(t);
  const slow = deferred<ReturnType<typeof response>>();
  h.respond(() => slow.promise);
  let pending!: Promise<void>;
  await act(async () => {
    pending = h.table.handleQueryChange({ page: 2 }, { paginate: true });
  });
  await h.emit(subscriptions[0], [
    {
      ...event(EventType.UPDATE, { ...worker(5), state: 'ready' }),
      changed_fields: { state: [['not_ready'], ['ready']] }
    }
  ]);
  await act(async () => {
    slow.resolve(response([6, 5, 4], 200, 2));
    await pending;
  });
  assert.deepEqual(h.ids, [6, 5, 4]);
  assert.equal(h.table.dataSource.dataList[1].state, 'ready');
});

test('watch deletions cannot be resurrected by a pending REST response', async (t) => {
  const h = await mount(t);
  const slow = deferred<ReturnType<typeof response>>();
  h.respond(() => slow.promise);
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = h.table.fetchData();
  });
  await h.emit(subscriptions[0], [event(EventType.DELETE, worker(197))]);
  await act(async () => {
    slow.resolve(response([200, 197, 198]));
    await pending;
  });
  assert.deepEqual(h.ids, [200, 198]);
  h.respond(() => response([200, 198, 196], 199));
  await h.advance(1000);
  assert.deepEqual(h.ids, [200, 198, 196]);
  assert.equal(h.table.dataSource.total, 199);
});

for (const survivors of [[200, 198], []]) {
  test(`transport reconnect refetches after replay even with ${survivors.length} known survivors`, async (t) => {
    const h = await mount(t);
    const watch = subscriptions[0];
    assert.equal(watch.contentType, 'text');
    await act(async () => watch.beforeReconnect!());
    watch.response = '';
    const before = h.fetchPage.mock.callCount();
    // The deletion happens during retry backoff, after beforeReconnect ran.
    h.respond(() => response(survivors, survivors.length));
    await h.advance(2000);
    assert.equal(h.fetchPage.mock.callCount(), before);
    await h.raw(
      watch,
      survivors
        .map(
          (id) =>
            JSON.stringify({ type: EventType.CREATE, data: worker(id) }) +
            '\n\n'
        )
        .join('') || '\n\n'
    );
    assert.equal(h.fetchPage.mock.callCount(), before + 1);
    assert.deepEqual(h.ids, survivors);
    assert.equal(h.table.dataSource.total, survivors.length);
    await h.raw(watch, '\n\n');
    assert.equal(h.fetchPage.mock.callCount(), before + 1);
  });
}

test('stale reconnect callbacks cannot refresh a different cluster or a hidden table', async (t) => {
  const h = await mount(t);
  const old = subscriptions[0];
  old.beforeReconnect!();
  old.response = '';
  await act(async () => h.table.handleQueryChange({ cluster_id: 2 }));
  await h.raw(old, '\n\n');
  const current = subscriptions[1];
  current.beforeReconnect!();
  current.response = '';
  await act(async () => h.table.cancelRequestsOnPageInactive());
  await h.raw(current, '\n\n');
  assert.equal(h.fetchPage.mock.callCount(), 2);
});

test('text watch preserves partial frames, ignores malformed rows, and batches complete events', async (t) => {
  const h = await mount(t);
  const watch = subscriptions[0];
  const updated = {
    ...worker(197),
    name: 'worker-197 {"quoted"}\nnext',
    state: 'ready'
  };
  const frame = JSON.stringify({ type: EventType.UPDATE, data: updated });
  await h.raw(watch, frame.slice(0, 25));
  assert.equal(h.table.dataSource.dataList[1].state, undefined);
  await h.raw(
    watch,
    frame.slice(25) +
      '\n\ninvalid\nnull\n' +
      JSON.stringify({ type: EventType.UPDATE, data: null }) +
      '\n\n'
  );
  assert.equal(h.table.dataSource.dataList[1].name, updated.name);
  assert.equal(h.table.dataSource.dataList[1].state, 'ready');
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), 1);
});

test('off-page nested sort updates ignore unrelated status fields', async (t) => {
  const h = await mount(t);
  await act(async () =>
    h.table.handleQueryChange(
      { sort_by: '-status.cpu.utilization_rate' },
      { paginate: true }
    )
  );
  const before = h.fetchPage.mock.callCount();
  const oldStatus = {
    cpu: { utilization_rate: 10 },
    memory: { utilization_rate: 20 }
  };
  const newStatus = { ...oldStatus, memory: { utilization_rate: 90 } };
  await h.emit(subscriptions[0], [
    {
      ...event(EventType.UPDATE, { ...worker(1), status: newStatus }),
      changed_fields: { status: [oldStatus, newStatus] }
    }
  ]);
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), before);
  const nextStatus = { ...newStatus, cpu: { utilization_rate: 95 } };
  h.respond(() => response([1, 200, 197]));
  await h.emit(subscriptions[0], [
    {
      ...event(EventType.UPDATE, { ...worker(1), status: nextStatus }),
      changed_fields: { status: [newStatus, nextStatus] }
    }
  ]);
  await h.advance(1000);
  assert.equal(h.fetchPage.mock.callCount(), before + 1);
  assert.deepEqual(h.ids, [1, 200, 197]);
});

test('watch updates survive the fallback request when the last page shrinks', async (t) => {
  const h = await mount(t);
  const fallback = deferred<ReturnType<typeof response>>();
  h.respond((params) =>
    params.page === 3 ? response([], 6, 3) : fallback.promise
  );
  let pending!: Promise<void>;
  await act(async () => {
    pending = h.table.handleQueryChange({ page: 3 }, { paginate: true });
  });
  await h.emit(subscriptions[0], [
    {
      ...event(EventType.UPDATE, { ...worker(5), state: 'ready' }),
      changed_fields: { state: [['not_ready'], ['ready']] }
    }
  ]);
  await act(async () => {
    fallback.resolve(response([4, 5, 6], 6, 2));
    await pending;
  });
  assert.equal(h.table.queryParams.page, 2);
  assert.equal(h.table.dataSource.dataList[1].state, 'ready');
});

test('a canceled REST request cannot discard the current request watch buffer', async (t) => {
  const h = await mount(t);
  const first = deferred<ReturnType<typeof response>>();
  const second = deferred<ReturnType<typeof response>>();
  let count = 0;
  h.respond(() => (++count === 1 ? first.promise : second.promise));
  let oldRequest!: Promise<boolean>;
  let currentRequest!: Promise<boolean>;
  await act(async () => {
    oldRequest = h.table.fetchData();
    currentRequest = h.table.fetchData();
  });
  await act(async () => {
    first.resolve(response([200, 197, 198]));
    await oldRequest;
  });
  await h.emit(subscriptions[0], [
    event(EventType.UPDATE, { ...worker(197), state: 'ready' })
  ]);
  await act(async () => {
    second.resolve(response([200, 197, 198]));
    await currentRequest;
  });
  assert.equal(h.table.dataSource.dataList[1].state, 'ready');
});
