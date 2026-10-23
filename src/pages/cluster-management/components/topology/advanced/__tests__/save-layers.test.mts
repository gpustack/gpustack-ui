import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, useImperativeHandle } from 'react';
import type { DraftLayer } from '../draft';

const empty = () => null;
mock.module('@gpustack/core-ui', {
  namedExports: {
    DeleteModal: forwardRef((_props, ref) => {
      useImperativeHandle(ref, () => ({ show: empty }));
      return null;
    }),
    SubDrawer: ({ open, children, footer }: any) =>
      open ? createElement('section', null, children, footer) : null,
    ModalFooter: ({ onOk, loading, okBtnProps }: any) =>
      createElement(
        'button',
        { onClick: onOk, disabled: loading || okBtnProps?.disabled },
        'Save'
      )
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
const success = mock.fn();
const error = mock.fn();
mock.module('antd', {
  namedExports: {
    Flex: ({ children }: any) => createElement('div', null, children),
    Alert: empty,
    Spin: empty,
    Modal: { warning: empty },
    message: { success, error }
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    topologyFieldLabel: (_intl: any, name: string) => name,
    topologyLayerLabel: (_intl: any, layer: any) =>
      layer.display_name || layer.name
  }
});
mock.module(new URL('../rename-layer.tsx', import.meta.url).href, {
  defaultExport: empty
});
let chainRows: DraftLayer[] = [];
mock.module(new URL('../field-chain.tsx', import.meta.url).href, {
  defaultExport: ({ rows, onAddLayer, onDelete }: any) => {
    chainRows = rows;
    return createElement(
      'div',
      null,
      ['new-a', 'temporary', 'new-b'].map((name) =>
        createElement(
          'button',
          { key: name, onClick: () => onAddLayer(name, rows.length) },
          `Add ${name}`
        )
      ),
      rows.map((row: DraftLayer) =>
        createElement(
          'button',
          { key: row.id, onClick: () => onDelete(row) },
          `Delete ${row.name}`
        )
      )
    );
  }
});
const cluster = {
  id: 7,
  name: 'cluster',
  topology: {
    layers: [
      {
        id: 'existing-pod',
        name: 'pod',
        labelKeys: ['labels/pod'],
        parentLayer: 'zone'
      }
    ]
  }
};
const loadSpecContext = mock.fn(async () => ({ cluster, workerLabels: [] }));
let save: () => Promise<void>;
const saveTopologySpec = mock.fn(() => save());
mock.module(new URL('../../spec.ts', import.meta.url).href, {
  namedExports: { loadSpecContext, saveTopologySpec }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const { createRoot } = await import('react-dom/client');
const { default: AdvancedDrawer } = await import('../index.tsx');
const view: any = {
  workers: [],
  layers: [
    {
      id: 'zone',
      name: 'zone',
      builtin: true,
      active: false,
      primary_key: 'labels/zone',
      label_keys: ['labels/zone'],
      classified: 0
    },
    {
      id: 'existing-pod',
      name: 'pod',
      builtin: false,
      active: false,
      primary_key: null,
      label_keys: ['labels/pod'],
      classified: 0
    }
  ]
};
const click = async (label: string) => {
  const button = [
    ...document.querySelectorAll<HTMLButtonElement>('button')
  ].find((item) => item.textContent === label);
  assert.ok(button, `Button exists: ${label}`);
  await act(async () => button.click());
};
const mount = async (write: () => Promise<void>) => {
  save = write;
  [success, error, saveTopologySpec].forEach((fn) => fn.mock.resetCalls());
  const onSaved = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  await act(async () => {
    root.render(
      createElement(AdvancedDrawer, {
        open: true,
        width: 1080,
        getContainer: () => document.getElementById('root'),
        clusterId: cluster.id,
        view,
        displayed: view,
        preview: { run: empty } as any,
        onClose: empty,
        onSaved
      })
    );
  });
  return {
    onSaved,
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('saving returns only surviving new layer ids after the write succeeds', async (t) => {
  let resolve!: () => void;
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  const drawer = await mount(() => pending);
  t.after(drawer.unmount);
  t.after(resolve);
  await click('Add new-a');
  await click('Add temporary');
  await click('Add new-b');
  const addedIds = ['new-a', 'new-b'].map(
    (name) => chainRows.find((row) => row.name === name)!.id
  );
  const removedId = chainRows.find((row) => row.name === 'temporary')!.id;
  await click('Delete temporary');
  await click('Save');

  assert.equal(saveTopologySpec.mock.callCount(), 1);
  const [savedCluster, spec]: any[] = saveTopologySpec.mock.calls[0].arguments;
  assert.equal(savedCluster, cluster);
  assert.deepEqual(
    spec.layers.map((layer: any) => layer.id),
    ['existing-pod', ...addedIds]
  );
  assert.ok(!spec.layers.some((layer: any) => layer.id === removedId));
  assert.equal(drawer.onSaved.mock.callCount(), 0);
  await act(async () => resolve());
  assert.equal(drawer.onSaved.mock.callCount(), 1);
  assert.deepEqual(drawer.onSaved.mock.calls[0].arguments, [addedIds]);
  assert.equal(success.mock.callCount(), 1);
  assert.equal(error.mock.callCount(), 0);
});

test('a failed topology save does not report new layers as saved', async (t) => {
  const drawer = await mount(async () => {
    throw { response: { data: { message: 'Save rejected' } } };
  });
  t.after(drawer.unmount);
  await click('Add new-a');
  await click('Save');

  assert.equal(saveTopologySpec.mock.callCount(), 1);
  assert.equal(drawer.onSaved.mock.callCount(), 0);
  assert.equal(success.mock.callCount(), 0);
  assert.deepEqual(error.mock.calls[0].arguments, ['Save rejected']);
  assert.ok(chainRows.some((row) => row.name === 'new-a'));
});
