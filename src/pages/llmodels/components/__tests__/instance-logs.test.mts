import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import {
  act,
  createElement,
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle
} from 'react';
import { createRoot } from 'react-dom/client';

const dom = new JSDOM('<html><body></body></html>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true
});
const calls: Array<[string, any]> = [];
const notifications: any[] = [];
const errors: any[] = [];
const downloads: any[] = [];
const viewerMounts: any[] = [];
const abortViewer = mock.fn();
const cancelWatch = mock.fn();
let viewer: any;
let optionsResponse: any;
let getOptions = async (_options: any) => optionsResponse;
let readLogs = async (_options: any): Promise<any> => '';
let downloadLogs = async (_options: any): Promise<any> => ({
  data: new Blob(['log']),
  headers: { 'content-disposition': 'attachment; filename="server.log"' }
});
const request = async (url: string, options: any) => {
  calls.push([url, options]);
  if (url.endsWith('/log-options')) return getOptions(options);
  if (url.endsWith('/logs/download')) return downloadLogs(options);
  if (url.endsWith('/logs')) return readLogs(options);
  throw new Error(`Unexpected request: ${url}`);
};
mock.module('@umijs/max', {
  namedExports: {
    request,
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) =>
        `${id}${Object.values(values).length ? ` ${Object.values(values).join(' ')}` : ''}`
    })
  }
});
const pass = ({ children }: any) => createElement(Fragment, null, children);
mock.module('@ant-design/icons', {
  namedExports: {
    CloseOutlined: () => null,
    QuestionCircleOutlined: () => null
  }
});
mock.module('antd', {
  namedExports: {
    Alert: ({ title, message, description }: any) =>
      createElement('div', { role: 'alert' }, title || message, description),
    Flex: pass,
    Tooltip: pass,
    Button: ({ children, onClick, disabled, title }: any) =>
      createElement('button', { onClick, disabled, title }, children),
    Checkbox: ({ children, onChange, checked }: any) =>
      createElement(
        'label',
        null,
        createElement('input', { type: 'checkbox', onChange, checked }),
        children
      ),
    Modal: ({ open, children, title }: any) =>
      open
        ? createElement(
            'div',
            null,
            createElement('header', { 'data-modal-title': true }, title),
            children
          )
        : null,
    App: {
      useApp: () => ({
        notification: {
          open: (notice: any) => notifications.push(notice),
          destroy: (key: string) =>
            notifications.findLast((notice) => notice.key === key)?.onClose(),
          error: (notice: any) => errors.push(notice)
        }
      })
    },
    message: { error: (error: any) => errors.push(error) }
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: ({ value, options, onChange, placeholder }: any) =>
      createElement(
        'select',
        {
          value: value || '',
          onChange: (event: any) =>
            onChange(
              event.target.value,
              options.find((option: any) => option.value === event.target.value)
            )
        },
        createElement('option', { value: '' }, placeholder),
        ...options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      ),
    LogsViewer: forwardRef((props: any, ref) => {
      viewer = props;
      useImperativeHandle(ref, () => ({ abort: abortViewer }));
      useEffect(() => {
        viewerMounts.push(props);
        return () => {
          viewer = undefined;
          abortViewer();
        };
      }, []);
      return createElement('div', { 'data-viewer': true });
    }),
    useChunkRequest: () => ({
      setChunkRequest: () => ({ current: { cancel: cancelWatch } })
    })
  }
});
mock.module(new URL('../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { convertFileSize: (value: number) => `${value} bytes` }
});
mock.module('file-saver', {
  namedExports: { saveAs: (...args: any[]) => downloads.push(args) }
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: {
    InstanceRealtimeLogStatus: ['starting', 'downloading'],
    InstanceStatusMap: { Downloading: 'downloading' }
  }
});

const { default: ViewLogsModal } = await import('../view-logs-modal.tsx');
const { default: useDownloadInstanceLogs } =
  await import('../../hooks/use-download-instance-logs.tsx');
const api = await import('../../apis/index.ts');
const source = (overrides: any = {}) => ({
  id: 'opaque /+?identity',
  worker_id: 7,
  restart_count: 3,
  previous: false,
  kind: 'rank',
  label: 'DP 2 · main node 0',
  component_kind: null,
  workload_name: 'engine',
  container_name: 'default',
  dp_rank: 2,
  node_rank: 0,
  main: true,
  attribution: 'supervisor_rank',
  available: true,
  active_workload_name: null,
  active_attempt: null,
  ...overrides
});
const response = (sources: any[] | undefined = [source()]) => ({
  main_worker_id: 7,
  workers: [
    {
      worker_id: 7,
      name: 'worker:seven',
      restarts: [
        {
          previous: false,
          started_at: '2026-10-28T00:00:00Z',
          containers: ['default'],
          ...(sources === undefined ? {} : { sources })
        }
      ]
    }
  ]
});
const defer = () => {
  let resolve!: (value?: any) => void;
  let reject!: (error: any) => void;
  const promise = new Promise<any>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLDivElement;
const mount = async (element: any) => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(element);
  });
};
const modal = (props: any = {}) =>
  createElement(ViewLogsModal, {
    open: true,
    id: 42,
    modelId: 8,
    url: '/model-instances/42/logs',
    status: 'running',
    onCancel() {},
    ...props
  });
const select = async (value: string) => {
  await act(async () => {
    const input = container.querySelector('select')!;
    input.value = value;
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
};
afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  root = undefined;
  document.body.innerHTML = '';
  viewer = undefined;
  calls.length = notifications.length = errors.length = downloads.length = 0;
  viewerMounts.length = 0;
  abortViewer.mock.resetCalls();
  cancelWatch.mock.resetCalls();
  getOptions = async () => optionsResponse;
  readLogs = async () => '';
  downloadLogs = async () => ({ data: new Blob(['log']), headers: {} });
});

test('a single container opens combined logs without exposing source categories', async () => {
  optionsResponse = response([
    source(),
    source({ id: 'prep', kind: 'preparation', label: 'Preparation' })
  ]);
  const close = mock.fn();
  await mount(modal({ onCancel: close }));
  const header = container.querySelector('[data-modal-title]')!;
  assert.equal(header.querySelectorAll('button').length, 1);
  assert.equal(header.querySelector('input[type="checkbox"]'), null);
  assert.equal(header.querySelector('select'), null);
  assert.deepEqual(viewer.params, {
    follow: true,
    watch: true,
    previous: false,
    worker_id: 7,
    container_name: 'default'
  });
  assert.equal(calls.filter(([url]) => url.endsWith('/logs')).length, 0);
  assert.equal(container.querySelector('[role="alert"]'), null);
  await act(async () => {
    header.querySelector('button')!.click();
  });
  assert.equal(close.mock.callCount(), 1);
});

test('container selection preserves Worker identity without Preparation or rank options', async () => {
  optionsResponse = response();
  optionsResponse.workers.push({
    worker_id: 9,
    name: 'headless',
    restarts: [
      {
        previous: false,
        started_at: null,
        containers: ['ray-worker'],
        sources: [source({ id: 'other', worker_id: 9 })]
      }
    ]
  });
  await mount(modal());
  assert.equal(container.querySelectorAll('select option').length, 3);
  await select('9:ray-worker');
  assert.deepEqual(viewer.params, {
    follow: true,
    watch: true,
    previous: false,
    worker_id: 9,
    container_name: 'ray-worker'
  });
  assert.doesNotMatch(
    container.textContent!,
    /Preparation|DP 2|models.instance.logs/
  );
});

test('previous run automatically selects the matching container and toggles back to live logs', async () => {
  optionsResponse = response();
  optionsResponse.workers[0].restarts.push({
    previous: true,
    started_at: null,
    containers: ['default'],
    sources: []
  });
  await mount(modal());
  await act(async () => {
    container.querySelector('input[type="checkbox"]')!.click();
  });
  assert.deepEqual(viewer.params, {
    follow: false,
    watch: false,
    previous: true,
    worker_id: 7,
    container_name: 'default'
  });
  await act(async () => {
    container.querySelector('input[type="checkbox"]')!.click();
  });
  assert.equal(viewer.params.previous, false);
  assert.equal(viewer.params.follow, true);
});

test('SMG has a distinct source option when Engine uses the same default container', async () => {
  optionsResponse = response([
    source({ kind: 'workload', component_kind: 'sglang_engine', id: 'engine' }),
    source({
      kind: 'workload',
      component_kind: 'sglang_smg',
      id: 'smg-current'
    })
  ]);
  optionsResponse.workers[0].restarts.push({
    previous: true,
    started_at: null,
    containers: ['default'],
    sources: [
      source({
        kind: 'workload',
        component_kind: 'sglang_smg',
        id: 'smg-previous',
        previous: true,
        restart_count: 2
      })
    ]
  });
  await mount(modal());
  assert.equal(container.querySelectorAll('select option').length, 3);
  assert.equal(viewer.params.container_name, 'default');
  assert.equal(viewer.params.source, undefined);
  await select('7:source:sglang_smg');
  assert.deepEqual(viewer.params, {
    follow: true,
    watch: true,
    worker_id: 7,
    source: 'smg-current'
  });
  await act(async () => {
    container.querySelector('input[type="checkbox"]')!.click();
  });
  assert.deepEqual(viewer.params, {
    follow: false,
    watch: false,
    worker_id: 7,
    source: 'smg-previous'
  });
  await act(async () => {
    container.querySelector('input[type="checkbox"]')!.click();
  });
  assert.equal(viewer.params.source, 'smg-current');
});

test('unavailable SMG sources do not create selectable log options', async () => {
  optionsResponse = response([
    source({ kind: 'workload', component_kind: 'sglang_smg', available: false })
  ]);
  await mount(modal());
  assert.equal(Boolean(container.querySelector('select')), false);
});

test('history falls back to the main container when the selected Worker has no previous run', async () => {
  optionsResponse = response();
  optionsResponse.workers[0].restarts.push({
    previous: true,
    started_at: null,
    containers: ['default'],
    sources: []
  });
  optionsResponse.workers.push({
    worker_id: 9,
    name: 'peer',
    restarts: [
      { previous: false, started_at: null, containers: ['ray-worker'] }
    ]
  });
  await mount(modal());
  await select('9:ray-worker');
  await act(async () => {
    container.querySelector('input[type="checkbox"]')!.click();
  });
  assert.equal(viewer.params.worker_id, 7);
  assert.equal(viewer.params.previous, true);
});

test('history remains opt-in and preserves the previous selector when no current run is discovered', async () => {
  optionsResponse = response();
  optionsResponse.workers[0].restarts[0].previous = true;
  await mount(modal());
  const checkbox = container.querySelector(
    'input[type="checkbox"]'
  ) as HTMLInputElement;
  assert.equal(checkbox.checked, false);
  assert.equal(checkbox.disabled, false);
  assert.deepEqual(viewer.params, { follow: true });
  await act(async () => {
    checkbox.click();
  });
  assert.equal(checkbox.checked, true);
  assert.deepEqual(viewer.params, {
    follow: false,
    watch: false,
    previous: true,
    worker_id: 7,
    container_name: 'default'
  });
});

test('opening does not wait for source validation and closing cancels option discovery', async () => {
  const pending = defer();
  getOptions = () => pending.promise;
  await mount(modal());
  assert.ok(viewer);
  assert.deepEqual(viewer.params, { follow: true });
  const signal = calls.find(([url]) => url.endsWith('/log-options'))![1].signal;
  await act(async () => {
    root!.render(modal({ open: false }));
  });
  assert.equal(signal.aborted, true);
  assert.ok(cancelWatch.mock.callCount());
  await act(async () => {
    pending.resolve(response());
  });
  assert.equal(viewer, undefined);
});

test('partial Worker discovery retains the normal viewer without extra warning banners', async () => {
  optionsResponse = response();
  optionsResponse.workers.push({
    worker_id: 9,
    name: 'offline',
    restarts: [],
    error: 'Worker unavailable'
  });
  await mount(modal());
  assert.ok(viewer);
  assert.equal(container.querySelector('[role="alert"]'), null);
});

for (const failure of [
  { response: { data: { detail: 'Worker unavailable' }, status: 502 } },
  new Error('Network Error')
]) {
  test(`active log discovery failure clears stale options and reports ${failure instanceof Error ? 'network' : 'HTTP'} errors`, async () => {
    optionsResponse = response();
    optionsResponse.workers[0].restarts[0].containers.push('peer');
    await mount(modal());
    assert.ok(container.querySelector('select'));
    getOptions = async () => {
      throw failure;
    };
    await act(async () => {
      root!.render(modal({ id: 43, url: '/model-instances/43/logs' }));
    });
    assert.equal(Boolean(container.querySelector('select')), false);
    assert.deepEqual(viewer.params, { follow: true });
    assert.deepEqual(errors, [
      failure instanceof Error ? 'Network Error' : 'Worker unavailable'
    ]);
    assert.equal(calls.at(-1)![1].skipErrorHandler, true);
  });
}

test('switching instances clears options while discovery is pending and ignores stale failures', async () => {
  const oldRequest = defer();
  getOptions = () => oldRequest.promise;
  await mount(modal());
  optionsResponse = response();
  optionsResponse.workers[0].restarts[0].containers.push('peer');
  getOptions = async () => optionsResponse;
  await act(async () => {
    root!.render(modal({ id: 43, url: '/model-instances/43/logs' }));
  });
  assert.ok(container.querySelector('select'));
  await act(async () => {
    oldRequest.reject(new Error('stale failure'));
  });
  assert.ok(container.querySelector('select'));
  assert.deepEqual(errors, []);

  const nextRequest = defer();
  getOptions = () => nextRequest.promise;
  await act(async () => {
    root!.render(modal({ id: 44, url: '/model-instances/44/logs' }));
  });
  assert.equal(Boolean(container.querySelector('select')), false);
  await act(async () => {
    root!.render(modal({ open: false }));
    nextRequest.reject(new Error('cancelled failure'));
  });
  assert.deepEqual(errors, []);
});

test('default download has no selector and selected source download sends only source and Worker', async () => {
  await mount(createElement(DownloadHarness));
  const record = { id: 42, name: 'instance' };
  await hookDownload(record);
  const selected = source();
  await hookDownload(record, {
    worker_id: selected.worker_id,
    source: selected.id
  });
  const downloadCalls = calls.filter(([url]) => url.endsWith('/logs/download'));
  assert.equal(downloadCalls[0][1].params, undefined);
  assert.deepEqual(downloadCalls[1][1].params, {
    worker_id: 7,
    source: 'opaque /+?identity'
  });
  assert.equal(downloadCalls[1][1].responseType, 'blob');
  assert.equal(downloadCalls[1][1].getResponse, true);
  assert.equal(downloadCalls[1][1].skipErrorHandler, true);
});

let hookDownload: any;
function DownloadHarness() {
  hookDownload = useDownloadInstanceLogs().downloadLogs;
  return null;
}
test('download guard survives row remount; progress, cancellation and cleanup retain their semantics', async (t) => {
  const pending = defer();
  downloadLogs = () => pending.promise;
  await mount(createElement(DownloadHarness));
  const operation = hookDownload({ id: 42, name: 'instance' });
  const options = calls[0][1];
  await act(async () => {
    root!.unmount();
  });
  root = undefined;
  await mount(createElement(DownloadHarness));
  await hookDownload({ id: 42, name: 'instance' });
  assert.equal(calls.length, 1);
  assert.match(notifications[0].description, /downloading.*0 bytes/);
  let tick = 0;
  const clock = mock.method(Date, 'now', () => (tick += 301));
  t.after(() => clock.mock.restore());
  options.onDownloadProgress({ loaded: 15, lengthComputable: false });
  assert.match(notifications.at(-1).description, /downloading.*15 bytes/);
  options.onDownloadProgress({
    loaded: 25,
    total: 100,
    lengthComputable: true
  });
  assert.match(notifications.at(-1).description, /downloadingPercent.*25/);
  notifications.at(-1).onClose();
  assert.equal(options.signal.aborted, true);
  pending.reject(new Error('cancelled'));
  await operation;
  assert.equal(errors.length, 0);
  downloadLogs = async () => ({
    data: new Blob(['zip'], { type: 'application/zip' }),
    headers: {}
  });
  await hookDownload({ id: 42, name: 'instance' });
  assert.equal(downloads[0][1], 'instance.logs.zip');
});

test('Blob failures remain errors when destroying a notice aborts its controller', async () => {
  downloadLogs = async () => {
    throw { response: { data: new Blob(['{"detail":"source expired"}']) } };
  };
  await mount(createElement(DownloadHarness));
  await hookDownload(
    { id: 42, name: 'instance' },
    { worker_id: 7, source: 'expired' }
  );
  assert.equal(errors[0].description, 'source expired');
  assert.equal(downloads.length, 0);
  downloadLogs = async () => ({
    data: new Blob(['ok']),
    headers: {
      'content-disposition': "attachment; filename*=UTF-8''source%20rank.log"
    }
  });
  await hookDownload({ id: 42, name: 'instance' });
  assert.equal(downloads[0][1], 'source rank.log');
});

test('read and options API wrappers forward action cancellation and local errors', async () => {
  const controller = new AbortController();
  await api.queryModelInstanceRestartCount(42, {
    signal: controller.signal,
    skipErrorHandler: true
  });
  await api.queryModelInstanceLogs(
    42,
    { worker_id: 7, source: 'opaque', offset: 0, limit: 1, follow: false },
    { signal: controller.signal, skipErrorHandler: true }
  );
  for (const [, options] of calls) {
    assert.equal(options.signal, controller.signal);
    assert.equal(options.skipErrorHandler, true);
  }
});
