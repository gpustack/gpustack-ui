import type { SubDrawerProps } from '@gpustack/core-ui';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import {
  act,
  createElement,
  forwardRef,
  useImperativeHandle,
  useState
} from 'react';
import { createPortal } from 'react-dom';

const empty = () => null;
const discardShow = mock.fn();
let drawerProps: SubDrawerProps;
mock.module('@gpustack/core-ui', {
  namedExports: {
    DeleteModal: forwardRef((_props, ref) => {
      const [confirmation, setConfirmation] = useState<any>(null);
      useImperativeHandle(ref, () => ({
        show: (options: any) => {
          discardShow(options);
          setConfirmation(options);
        }
      }));
      return confirmation
        ? createElement(
            'div',
            { role: 'alertdialog' },
            createElement(
              'button',
              { onClick: () => setConfirmation(null) },
              confirmation.cancelText
            ),
            createElement(
              'button',
              {
                onClick: () => {
                  confirmation.onOk();
                  setConfirmation(null);
                }
              },
              confirmation.okText
            )
          )
        : null;
    }),
    SubDrawer: (props: SubDrawerProps) => {
      drawerProps = props;
      const container = props.open ? props.getContainer() : null;
      return container
        ? createPortal(
            createElement(
              'section',
              { role: 'dialog', 'aria-label': String(props.title) },
              createElement(
                'button',
                { onClick: props.onCancel },
                'Header back'
              ),
              props.children,
              props.footer
            ),
            container
          )
        : null;
    },
    ModalFooter: ({ onCancel, onOk, loading, okBtnProps }: any) =>
      createElement(
        'footer',
        null,
        createElement('button', { onClick: onCancel }, 'Cancel'),
        createElement(
          'button',
          { onClick: onOk, disabled: loading || okBtnProps?.disabled },
          'Save'
        )
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
    Alert: ({ title, message }: any) =>
      createElement('aside', null, title || message),
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
mock.module(new URL('../field-chain.tsx', import.meta.url).href, {
  defaultExport: ({ rows, onAddLayer, onKeysChange }: any) =>
    createElement(
      'div',
      null,
      createElement(
        'output',
        null,
        rows.map((row: any) => row.label).join(', ')
      ),
      createElement(
        'button',
        { onClick: () => onAddLayer('new-layer', rows.length) },
        'Insert layer'
      ),
      rows.map((row: any) =>
        createElement(
          'button',
          {
            key: row.id,
            onClick: () => onKeysChange(row.id, row.labelKeys.slice(1))
          },
          `Remove first candidate from ${row.name}`
        )
      )
    )
});

const cluster = { id: 7, name: 'cluster', topology: { layers: [] } };
const loadSpecContext = mock.fn(async () => ({ cluster, workerLabels: [] }));
const saveTopologySpec = mock.fn(async () => undefined);
mock.module(new URL('../../spec.ts', import.meta.url).href, {
  namedExports: { loadSpecContext, saveTopologySpec }
});

const dom = new JSDOM(
  '<!doctype html><div id="root"></div><div id="parent-drawer"></div>'
);
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
const mount = async (topology = view) => {
  [discardShow, success, error, loadSpecContext, saveTopologySpec].forEach(
    (fn) => fn.mock.resetCalls()
  );
  const container = document.getElementById('parent-drawer')!;
  const getContainer = mock.fn(() => container);
  const onClose = mock.fn();
  const onSaved = mock.fn();
  const run = mock.fn();
  let setOpen!: (open: boolean) => void;
  const Harness = () => {
    const [open, updateOpen] = useState(true);
    setOpen = updateOpen;
    return createElement(AdvancedDrawer, {
      open,
      getContainer,
      clusterId: cluster.id,
      view: topology,
      displayed: topology,
      preview: { run } as any,
      onClose: () => {
        onClose();
        setOpen(false);
      },
      onSaved
    });
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  return {
    container,
    getContainer,
    onClose,
    onSaved,
    run,
    setOpen: async (open: boolean) => {
      await act(async () => setOpen(open));
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('opens inside the parent drawer and a clean header close calls onClose', async (t) => {
  const drawer = await mount();
  t.after(drawer.unmount);
  assert.equal(drawerProps.getContainer, drawer.getContainer);
  assert.equal(drawerProps.open, true);
  assert.ok(drawer.container.querySelector('[role="dialog"]'));
  assert.equal(
    document.getElementById('root')!.querySelector('[role="dialog"]'),
    null
  );
  assert.deepEqual(loadSpecContext.mock.calls[0].arguments, [cluster.id]);
  assert.equal(document.querySelector('output')?.textContent, 'zone');

  await click('Header back');
  assert.equal(drawer.onClose.mock.callCount(), 1);
  assert.equal(discardShow.mock.callCount(), 0);
  assert.equal(drawerProps.open, false);
  assert.equal(document.querySelector('[role="dialog"]'), null);
});

test('dirty header and footer closure use discard confirmation, retaining edits or resetting after confirmed closure', async (t) => {
  const drawer = await mount();
  t.after(drawer.unmount);
  await click('Insert layer');
  assert.equal(drawer.run.mock.callCount(), 1);
  assert.equal(saveTopologySpec.mock.callCount(), 0);
  await click('Header back');
  assert.equal(discardShow.mock.callCount(), 1);
  assert.equal(drawer.onClose.mock.callCount(), 0);
  const confirmation: any = discardShow.mock.calls[0].arguments[0];
  assert.deepEqual(
    {
      title: confirmation.title,
      content: confirmation.content,
      operation: confirmation.operation,
      okText: confirmation.okText,
      cancelText: confirmation.cancelText,
      showSuccess: confirmation.showSuccess
    },
    {
      title: 'clusters.topology.advanced.discard',
      content: 'clusters.topology.mapping.title',
      operation: 'clusters.topology.advanced.discard.tips',
      okText: 'clusters.topology.discard.ok',
      cancelText: 'clusters.topology.advanced.discard.cancel',
      showSuccess: false
    }
  );
  await click('clusters.topology.advanced.discard.cancel');
  assert.equal(
    document.querySelector('output')?.textContent,
    'zone, new-layer'
  );
  assert.equal(drawerProps.open, true);
  assert.equal(drawer.onClose.mock.callCount(), 0);
  assert.equal(document.querySelector('[role="alertdialog"]'), null);

  await click('Cancel');
  assert.equal(discardShow.mock.callCount(), 2);
  assert.equal(drawer.onClose.mock.callCount(), 0);
  await click('clusters.topology.discard.ok');
  assert.equal(drawer.onClose.mock.callCount(), 1);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(saveTopologySpec.mock.callCount(), 0);
  assert.equal(drawer.onSaved.mock.callCount(), 0);
  assert.equal(success.mock.callCount(), 0);
  await drawer.setOpen(true);
  assert.equal(loadSpecContext.mock.callCount(), 2);
  assert.equal(document.querySelector('output')?.textContent, 'zone');
  await click('Cancel');
  assert.equal(drawer.onClose.mock.callCount(), 2);
  assert.equal(discardShow.mock.callCount(), 2);
});

test('saving writes the staged topology and still calls onSaved', async (t) => {
  const drawer = await mount();
  t.after(drawer.unmount);
  await click('Insert layer');
  await click('Save');
  assert.equal(saveTopologySpec.mock.callCount(), 1);
  const [savedCluster, spec]: any[] = saveTopologySpec.mock.calls[0].arguments;
  assert.equal(savedCluster, cluster);
  assert.equal(spec.layers.length, 1);
  assert.equal(spec.layers[0].name, 'new-layer');
  assert.equal(spec.layers[0].parentLayer, 'zone');
  assert.equal(drawer.onSaved.mock.callCount(), 1);
  assert.equal(drawer.onClose.mock.callCount(), 0);
  assert.equal(success.mock.callCount(), 1);
  assert.equal(error.mock.callCount(), 0);
});

test('removing custom first and last candidates saves an empty mapping while built-in primary keys remain protected', async (t) => {
  const drawer = await mount({
    ...view,
    layers: [
      ...view.layers,
      {
        id: 'custom-pod',
        name: 'custom-pod',
        builtin: false,
        active: false,
        primary_key: 'labels/pod',
        label_keys: ['labels/pod', 'legacy/pod'],
        classified: 0
      }
    ]
  });
  t.after(drawer.unmount);
  await click('Remove first candidate from custom-pod');
  const firstPreview: any = drawer.run.mock.calls[0].arguments[0];
  assert.deepEqual(
    firstPreview.layers.find((layer: any) => layer.id === 'custom-pod')
      .labelKeys,
    ['legacy/pod']
  );
  await click('Remove first candidate from custom-pod');
  const emptyPreview: any = drawer.run.mock.calls[1].arguments[0];
  assert.deepEqual(
    emptyPreview.layers.find((layer: any) => layer.id === 'custom-pod')
      .labelKeys,
    []
  );
  await click('Remove first candidate from zone');
  await click('Save');
  const [, spec]: any[] = saveTopologySpec.mock.calls[0].arguments;
  assert.deepEqual(
    spec.layers.find((layer: any) => layer.id === 'custom-pod').labelKeys,
    []
  );
  assert.deepEqual(
    spec.layers.find((layer: any) => layer.id === 'zone').labelKeys,
    ['labels/zone']
  );
  assert.equal(saveTopologySpec.mock.callCount(), 1);
  assert.equal(drawer.onSaved.mock.callCount(), 1);
});
