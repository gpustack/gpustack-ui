import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';

const dom = new JSDOM('<div id="root"></div>');
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'SVGElement',
  'Node',
  'MutationObserver',
  'ShadowRoot',
  'getComputedStyle'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'window' ? dom.window : (dom.window as any)[key]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true
});
dom.window.matchMedia = (media) => ({
  matches: false,
  media,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false
});
after(() => dom.window.close());
mock.module('ahooks', { namedExports: { useMemoizedFn: (fn: any) => fn } });
// Exercise the shared submit guard itself while replacing only visual wrappers.
const { default: useSubmitLock } =
  await import('../../../../../node_modules/@gpustack/core-ui/dist/lib/hooks/use-submit-lock.es.js');
let footer: any;
let selector: any;
let modal: any;
let name: any;
let kvInterface: any;
mock.module('@gpustack/core-ui', {
  namedExports: {
    useSubmitLock,
    Input: {
      Input: (props: any) => {
        if (props.label === 'common.table.name') name = props;
        else if (props.label === 'resources.worker.kvTransferInterface')
          kvInterface = props;
        return null;
      }
    },
    LabelSelector: (props: any) => {
      selector = props;
      return null;
    },
    ModalFooter: (props: any) => {
      footer = props;
      return null;
    },
    ScrollerModal: (props: any) => {
      modal = props;
      return createElement(Fragment, null, props.children, props.footer);
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) =>
        values?.count ? `${id}:${values.count}` : id
    })
  }
});
mock.module('simplebar-react/dist/simplebar.min.css', { defaultExport: {} });
const { createRoot } = await import('react-dom/client');
const { default: UpdateLabels } = await import('../update-labels.tsx');

async function mount(t: any, props: any = {}) {
  kvInterface = undefined;
  const onOk = mock.fn(async (_values: any) => {});
  const root = createRoot(document.getElementById('root')!);
  const render = (next: any = {}) =>
    act(async () =>
      root.render(
        createElement(UpdateLabels, {
          open: true,
          batch: true,
          count: 1,
          data: { name: 'worker', labels: { zone: 'west' } },
          onCancel() {},
          onOk,
          ...props,
          ...next
        })
      )
    );
  await render();
  t.after(async () => {
    await act(async () => root.unmount());
  });
  return { onOk, render };
}
const flushValidation = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

test('batch starts empty, explains merge semantics and disables empty submission', async (t) => {
  await mount(t);
  assert.deepEqual(selector.value, {});
  assert.equal(name.value, 'resources.worker.setLabels.count:1');
  assert.equal(modal.title, 'resources.worker.setLabels');
  assert.equal(footer.okText, 'resources.worker.setLabels');
  assert.equal(footer.okBtnProps.disabled, true);
  assert.match(document.body.textContent!, /resources.worker.setLabels.hint/);
  await act(async () => selector.onChange({ pool: 'new' }));
  assert.equal(footer.okBtnProps.disabled, false);
});

test('double clicks submit once and loading remains until the request settles', async (t) => {
  let complete!: () => void;
  const onOk = mock.fn(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      })
  );
  await mount(t, { onOk });
  await act(async () => selector.onChange({ pool: 'new' }));
  await act(async () => {
    footer.onOk();
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.callCount(), 1);
  assert.equal(footer.loading, true);
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.callCount(), 1);
  await act(async () => {
    complete();
    await flushValidation();
  });
  assert.equal(footer.loading, false);
  assert.deepEqual(selector.value, { pool: 'new' });
});

test('validation failure releases the guard and a corrected form can retry', async (t) => {
  const { onOk } = await mount(t);
  await act(async () => selector.onChange({ pool: '' }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.callCount(), 0);
  await act(async () => selector.onChange({ pool: 'new' }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.callCount(), 1);
  assert.deepEqual(onOk.mock.calls[0].arguments[0].labels, { pool: 'new' });
});

test('single edit initializes existing labels and allows clearing every label', async (t) => {
  const { onOk } = await mount(t, { batch: false });
  assert.deepEqual(selector.value, { zone: 'west' });
  assert.equal(name.value, 'worker');
  assert.equal(modal.title, 'resources.button.edit');
  await act(async () => selector.onChange({}));
  assert.notEqual(footer.okBtnProps?.disabled, true);
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.deepEqual(onOk.mock.calls[0].arguments[0].labels, {});
});

test('single edit displays the configured interface and clears it explicitly', async (t) => {
  const { onOk } = await mount(t, {
    batch: false,
    data: { name: 'worker', labels: {}, kv_transfer_ifname: 'ens5f0' }
  });
  assert.equal(kvInterface?.value, 'ens5f0');
  await act(async () => kvInterface.onChange({ target: { value: ' ' } }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.calls[0].arguments[0].kv_transfer_ifname, null);
});

test('unchanged interface is omitted from a label edit', async (t) => {
  const { onOk } = await mount(t, {
    batch: false,
    data: { name: 'worker', labels: {}, kv_transfer_ifname: 'mlx5_2:1' }
  });
  assert.equal(kvInterface?.value, 'mlx5_2:1');
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal('kv_transfer_ifname' in onOk.mock.calls[0].arguments[0], false);
});

test('a nonblank interface selection is submitted without altering its contents', async (t) => {
  const { onOk } = await mount(t, { batch: false });
  const value = ' mlx5_2:1,  ens5f0 ';
  await act(async () => kvInterface.onChange({ target: { value } }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.callCount(), 1);
  assert.equal(onOk.mock.calls[0].arguments[0].kv_transfer_ifname, value);
});

test('a Worker detail refresh cannot restore an untouched old interface', async (t) => {
  const data = { name: 'worker', labels: {}, kv_transfer_ifname: 'ens5f0' };
  const { onOk, render } = await mount(t, { batch: false, data });
  await render({ data: { ...data, kv_transfer_ifname: 'ens7f0' } });
  assert.equal(kvInterface?.value, 'ens5f0');
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal('kv_transfer_ifname' in onOk.mock.calls[0].arguments[0], false);
});

for (const [edit, value, expected] of [
  ['setting', 'ens6f0', 'ens6f0'],
  ['clearing', '', null]
] as const) {
  test(`${edit} the KV interface leaves concurrently updated labels alone`, async (t) => {
    const data = {
      name: 'worker',
      labels: { zone: 'west' },
      kv_transfer_ifname: 'ens5f0'
    };
    const { onOk, render } = await mount(t, { batch: false, data });
    await render({
      data: { ...data, labels: { zone: 'west', pool: 'production' } }
    });
    assert.deepEqual(selector.value, data.labels);
    await act(async () => kvInterface.onChange({ target: { value } }));
    await act(async () => {
      footer.onOk();
      await flushValidation();
    });
    assert.deepEqual(onOk.mock.calls[0].arguments[0], {
      name: 'worker',
      kv_transfer_ifname: expected
    });
  });
}

test('returning labels to their opening values omits them after a refresh', async (t) => {
  const data = { name: 'worker', labels: { zone: 'west' } };
  const { onOk, render } = await mount(t, { batch: false, data });
  await act(async () => selector.onChange({ zone: 'east' }));
  await render({
    data: { ...data, labels: { zone: 'west', pool: 'production' } }
  });
  await act(async () => selector.onChange({ zone: 'west' }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.deepEqual(onOk.mock.calls[0].arguments[0], { name: 'worker' });
});

test('an Ascend-only Worker can save labels without rendering or clearing its interface', async (t) => {
  const { onOk } = await mount(t, {
    batch: false,
    data: { name: 'worker', labels: {}, kv_transfer_ifname: 'ens5f0' },
    gpuDevices: [{ vendor: 'ascend' }, { vendor: ' Ascend ' }]
  });
  assert.equal(kvInterface, undefined);
  await act(async () => selector.onChange({ pool: 'new' }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.deepEqual(onOk.mock.calls[0].arguments[0], {
    name: 'worker',
    labels: { pool: 'new' }
  });
});

test('a pending interface edit is omitted if the Worker refreshes as Ascend-only', async (t) => {
  const { onOk, render } = await mount(t, {
    batch: false,
    data: { name: 'worker', labels: {}, kv_transfer_ifname: 'ens5f0' }
  });
  await act(async () => kvInterface.onChange({ target: { value: '' } }));
  kvInterface = undefined;
  await render({ gpuDevices: [{ vendor: 'ascend' }] });
  assert.equal(kvInterface, undefined);
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal(onOk.mock.callCount(), 1);
  assert.equal('kv_transfer_ifname' in onOk.mock.calls[0].arguments[0], false);
});

for (const [label, gpuDevices] of Object.entries({
  absent: undefined,
  empty: [],
  nvidia: [{ vendor: 'nvidia' }],
  mixed: [{ vendor: 'ascend' }, { vendor: 'nvidia' }],
  unknown: [{ vendor: 'ascend' }, { vendor: 'unknown' }],
  incomplete: [{ vendor: 'ascend' }, {}]
})) {
  test(`the interface stays editable with ${label} GPU inventory`, async (t) => {
    await mount(t, {
      batch: false,
      data: { name: 'worker', labels: {}, kv_transfer_ifname: 'ens5f0' },
      gpuDevices
    });
    assert.equal(kvInterface?.value, 'ens5f0');
  });
}

test('batch edit does not render or submit the interface', async (t) => {
  const { onOk } = await mount(t, {
    data: { name: 'worker', labels: {}, kv_transfer_ifname: 'mlx5_2:1' }
  });
  assert.equal(kvInterface, undefined);
  await act(async () => selector.onChange({ pool: 'new' }));
  await act(async () => {
    footer.onOk();
    await flushValidation();
  });
  assert.equal('kv_transfer_ifname' in onOk.mock.calls[0].arguments[0], false);
});
