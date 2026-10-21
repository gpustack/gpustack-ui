import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import type { InstanceEventItem } from '../../config/types';

const dom = new JSDOM('<html><body><div id="root"></div></body></html>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
let tables: any[] = [];
let modal: any;
const instanceEvents: InstanceEventItem[] = Array.from(
  { length: 125 },
  (_, i) => ({
    metadata: { name: `event-${i}`, namespace: 'tenant-a' },
    type: i % 2 ? 'Warning' : 'Normal',
    reason: i === 124 ? 'UnexpectedAdmissionError' : `Reason-${i}`,
    message:
      i === 124
        ? 'Pod was rejected: no healthy devices present'
        : `Message-${i}`,
    lastTimestamp: i === 0 ? '2025-01-01T00:00:00Z' : undefined
  })
);
const volumeEvents: InstanceEventItem[] = [
  {
    metadata: { name: 'volume-event', namespace: 'tenant-a' },
    reason: 'ProvisioningFailed',
    message: 'Volume allocation failed'
  }
];
const fetchInstanceEvents = mock.fn();
const fetchVolumeEvents = mock.fn();
const cancelInstanceRequest = mock.fn();
const cancelVolumeRequest = mock.fn();

mock.module('@ant-design/icons', {
  namedExports: { ReloadOutlined: () => null }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: passChildren,
    StatusTag: ({ statusValue }: any) =>
      createElement('span', null, statusValue.text),
    AlertBlockInfo: ({ message }: any) =>
      createElement('div', { role: 'alert' }, message),
    ScrollerModal: (props: any) => {
      modal = props;
      return props.open
        ? createElement('section', null, props.title, props.children)
        : null;
    }
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ onClick }: any) =>
      createElement('button', { onClick }, 'refresh'),
    Table: (props: any) => {
      tables.push(props);
      return createElement('div', {
        'data-event-count': props.dataSource.length
      });
    },
    Tabs: ({ items, activeKey, onChange }: any) =>
      createElement(
        'div',
        null,
        items.map((item: any) =>
          createElement(
            'button',
            { key: item.key, onClick: () => onChange(item.key) },
            item.key
          )
        ),
        items.find((item: any) => item.key === activeKey)?.children
      )
  }
});
mock.module(
  new URL('../../services/use-query-instance-events.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      detailData: { items: instanceEvents },
      loading: false,
      fetchData: fetchInstanceEvents,
      cancelRequest: cancelInstanceRequest
    })
  }
);
mock.module(
  new URL('../../services/use-query-volume-events.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      detailData: { items: volumeEvents },
      loading: false,
      fetchData: fetchVolumeEvents,
      cancelRequest: cancelVolumeRequest
    })
  }
);

const { default: ViewEventsModal } = await import('../view-events-modal.tsx');
const { default: useViewEvents } =
  await import('../../hooks/use-view-events.ts');
let actions: ReturnType<typeof useViewEvents>;
const Harness = () => {
  actions = useViewEvents();
  return createElement(ViewEventsModal, {
    ...actions.openViewEventsModalStatus,
    onCancel: actions.closeViewEventsModal
  });
};
const row = (overrides: any = {}) =>
  ({
    name: 'jupyter-test',
    clusterId: 7,
    status: {
      phase: 'Failed',
      namespace: 'tenant-a',
      phaseMessage:
        'UnexpectedAdmissionError: Pod was rejected: no healthy devices present'
    },
    spec: { volume: { persistent: { name: 'workspace' } } },
    ...overrides
  }) as any;
const mount = async (t: any, record = row()) => {
  for (const fn of [
    fetchInstanceEvents,
    fetchVolumeEvents,
    cancelInstanceRequest,
    cancelVolumeRequest
  ])
    fn.mock.resetCalls();
  tables = [];
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  await act(async () => root.render(createElement(Harness)));
  await act(async () => actions.openViewEventsModal(record));
};
const click = async (text: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (item) => item.textContent === text
  );
  assert.ok(button, text);
  await act(async () => button.click());
};

test('failed-instance events retain every returned item and show reason and full message', async (t) => {
  await mount(t);
  const table = tables.at(-1);
  assert.deepEqual(table.dataSource, instanceEvents);
  assert.equal(table.pagination, false);
  for (const key of ['reason', 'message'] as const) {
    const column = table.columns.find((item: any) => item.key === key);
    const event = instanceEvents.at(-1)!;
    assert.ok(
      renderToStaticMarkup(column.render(event[key], event)).includes(
        event[key]!
      )
    );
  }
  assert.deepEqual(fetchInstanceEvents.mock.calls[0].arguments, [
    { name: 'jupyter-test', namespace: 'tenant-a', clusterID: 7 }
  ]);
  assert.deepEqual(fetchVolumeEvents.mock.calls[0].arguments, [
    { name: 'workspace', namespace: 'tenant-a', clusterID: 7 }
  ]);
  await click('volume');
  assert.deepEqual(tables.at(-1).dataSource, volumeEvents);
  await click('refresh');
  assert.equal(fetchInstanceEvents.mock.callCount(), 2);
  assert.equal(fetchVolumeEvents.mock.callCount(), 2);
});

test('failure details returned in phaseMessage are readable in the event dialog', async (t) => {
  const record = row();
  await mount(t, record);
  assert.ok(document.body.textContent?.includes(record.status.phaseMessage));
});

test('a failed instance without a returned failure message explains the missing detail', async (t) => {
  await mount(t, row({ status: { namespace: 'tenant-a', phase: 'Failed' } }));
  assert.ok(
    document.body.textContent?.includes(
      'gpuservice.instance.event.failureMessageUnavailable'
    )
  );
});

test('opening an instance without a volume after the volume tab restores its instance events', async (t) => {
  await mount(t);
  await click('volume');
  await act(async () => modal.onCancel());
  await act(async () =>
    actions.openViewEventsModal(
      row({ name: 'second-instance', spec: { volume: { ephemeral: {} } } })
    )
  );
  assert.equal(
    document
      .querySelector('[data-event-count]')
      ?.getAttribute('data-event-count'),
    '125'
  );
  assert.deepEqual(tables.at(-1).dataSource, instanceEvents);
  assert.equal(fetchVolumeEvents.mock.callCount(), 1);
  assert.deepEqual(fetchInstanceEvents.mock.calls.at(-1)!.arguments, [
    { name: 'second-instance', namespace: 'tenant-a', clusterID: 7 }
  ]);
});

test('non-failed instances without a message do not display a failure alert', async (t) => {
  await mount(t, row({ status: { namespace: 'tenant-a', phase: 'Ready' } }));
  assert.equal(
    document.body.textContent?.includes(
      'gpuservice.instance.event.failureMessageUnavailable'
    ),
    false
  );
});
