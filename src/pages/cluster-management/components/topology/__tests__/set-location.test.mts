import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { act, createElement, useEffect, useRef, useState } from 'react';
import type { TopologyWorker, WorkerLocation } from '../../../config/types';
import type { LocationField } from '../location';

const require = createRequire(import.meta.url);
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (callback: any) => callback }
});
// Keep the real synchronous submit guard while isolating unrelated Core-UI UI.
const { default: useSubmitLock } = await import(
  new URL(
    'lib/hooks/use-submit-lock.es.js',
    pathToFileURL(require.resolve('@gpustack/core-ui'))
  ).href
);
const empty = () => null;
let finishOpenAnimation: (() => void) | undefined;
mock.module('@gpustack/core-ui', {
  namedExports: {
    Select: ({ label, value, options, onChange, disabled }: any) =>
      createElement(
        'label',
        null,
        createElement('span', null, label),
        createElement(
          'select',
          {
            'aria-label': 'Layer',
            value: value || '',
            disabled,
            onChange: (event: any) => onChange(event.target.value)
          },
          createElement('option', { value: '' }, 'Choose a layer'),
          options.map((option: any) =>
            createElement(
              'option',
              {
                key: option.value,
                value: option.value,
                disabled: option.disabled
              },
              typeof option.label === 'string' ? option.label : option.value
            )
          )
        )
      ),
    useSubmitLock,
    ModalFooter: ({
      onCancel,
      onOk,
      loading,
      okBtnProps,
      cancelBtnProps
    }: any) =>
      createElement(
        'footer',
        null,
        createElement(
          'button',
          { onClick: onCancel, disabled: cancelBtnProps?.disabled },
          'Cancel'
        ),
        createElement(
          'button',
          { onClick: onOk, disabled: loading || okBtnProps?.disabled },
          'Apply'
        )
      )
  }
});
mock.module('@ant-design/icons', { namedExports: { WarningOutlined: empty } });
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any = {}) => {
        if (id === 'clusters.topology.batch.apply') return 'Apply';
        if (id === 'common.button.cancel') return 'Cancel';
        if (
          [
            'clusters.topology.mapping.title',
            'clusters.topology.columns.manage',
            'clusters.topology.batch.manageLayers'
          ].includes(id)
        )
          return 'Manage layers';
        return `${id}⟦${JSON.stringify(values)}⟧`;
      }
    })
  }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: { topologyLayerLabel: (_intl: any, layer: any) => layer.name }
});
mock.module('antd', {
  namedExports: {
    Button: ({ children, onClick, disabled, loading }: any) =>
      createElement(
        'button',
        { onClick, disabled: disabled || loading },
        children
      ),
    Flex: ({ children }: any) => createElement('div', null, children),
    Alert: ({ title, message, description }: any) =>
      createElement('aside', null, title || message, description),
    Tooltip: ({ children }: any) => children,
    Modal: ({
      children,
      title,
      footer,
      open,
      onCancel,
      afterClose,
      afterOpenChange,
      closable = true
    }: any) => {
      const wasOpen = useRef(open);
      finishOpenAnimation = () => afterOpenChange?.(true);
      useEffect(() => {
        if (wasOpen.current && !open) afterClose?.();
        afterOpenChange?.(open);
        wasOpen.current = open;
      }, [open]);
      return open
        ? createElement(
            'div',
            { role: 'dialog' },
            title,
            createElement(
              'button',
              { onClick: onCancel, disabled: !closable },
              'Header close'
            ),
            children,
            footer
          )
        : null;
    }
  }
});
mock.module(new URL('../location-cell.tsx', import.meta.url).href, {
  namedExports: {
    LocationValueSelect: ({
      current,
      value,
      onPick,
      onClear,
      disabled,
      placeholder,
      label
    }: any) =>
      createElement(
        'div',
        null,
        createElement(
          'label',
          null,
          createElement('span', null, label),
          createElement('input', {
            'aria-label': 'Location value',
            value: value || '',
            disabled,
            placeholder,
            onInput: (event: any) => onPick(event.target.value)
          })
        ),
        onClear &&
          value !== undefined &&
          createElement(
            'button',
            { disabled, onClick: onClear },
            'Reset selected value'
          ),
        current &&
          createElement(
            'button',
            {
              'aria-label': 'Clear location',
              disabled,
              onClick: () => onPick(null)
            },
            'Clear location'
          )
      )
  }
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
const { SetLocationModal } = await import('../set-location.tsx');
const { writableLabelKey } = await import('../location.ts');

const field = (
  id: string,
  changes: Partial<LocationField> = {}
): LocationField => ({
  id,
  name: id,
  label: id,
  builtin: false,
  active: false,
  primaryKey: null,
  labelKeys: [`labels/${id}`],
  ...changes
});
const builtin = field('builtin-rack', {
  builtin: true,
  primaryKey: 'topology/rack',
  labelKeys: ['topology/rack', 'legacy/rack']
});
const custom = field('hidden-custom-pod', {
  labelKeys: ['custom/pod', 'custom/backup']
});
const noKeys = field('unmapped', {
  primaryKey: 'topology/unmapped',
  labelKeys: []
});
const disabled = field('disabled', { disabled: true });
const worker = (
  id: number,
  location: Record<string, WorkerLocation> = {},
  labels: Record<string, string> = {}
): TopologyWorker => ({
  id,
  name: `worker-${id}`,
  state: 'ready',
  gpus: 0,
  free_gpus: 0,
  location,
  labels
});
const at = (
  value: string,
  source: WorkerLocation['source'] = 'user',
  key = 'topology/rack'
): WorkerLocation => ({ value, source, key });
const currentWorker = () =>
  worker(1, { [builtin.id]: at('old-rack') }, { 'topology/rack': 'old-rack' });
const button = (label: string) => {
  const found = [
    ...document.querySelectorAll<HTMLButtonElement>('button')
  ].find((item) => item.textContent === label);
  assert.ok(found, `Button exists: ${label}`);
  return found;
};
const click = async (label: string) => {
  await act(async () => button(label).click());
};
const pick = async (value: string | null) => {
  await act(async () => {
    if (value === null)
      document
        .querySelector<HTMLButtonElement>('[aria-label="Clear location"]')!
        .click();
    else {
      const input = document.querySelector<HTMLInputElement>(
        '[aria-label="Location value"]'
      )!;
      input.value = value;
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    }
  });
};
const chooseField = async (id: string) => {
  await act(async () => {
    const select = document.querySelector<HTMLSelectElement>(
      '[aria-label="Layer"]'
    )!;
    select.value = id;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
};
const renderedMessage = (id: string) => {
  const text = document.body.textContent || '';
  const marker = `${id}⟦`;
  const start = text.indexOf(marker);
  return start < 0
    ? undefined
    : JSON.parse(text.slice(start + marker.length, text.indexOf('⟧', start)));
};
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const mount = async ({
  fields = [builtin, custom],
  targets = [currentWorker()],
  defaultField,
  apply = async (_field: string, _value: string | null) => {}
}: {
  fields?: LocationField[];
  targets?: TopologyWorker[];
  defaultField?: string;
  apply?: (field: string, value: string | null) => Promise<void>;
} = {}) => {
  const onApply = mock.fn(apply);
  const onManageLayers = mock.fn();
  const onCancel = mock.fn();
  const props = {
    fields,
    targets,
    allWorkers: targets,
    defaultField,
    onApply,
    onManageLayers
  };
  let changeOpen!: (open: boolean) => void;
  let changeDefaultField!: (field: string | undefined) => void;
  const Harness = () => {
    const [open, setOpen] = useState(true);
    const [currentDefault, setCurrentDefault] = useState(defaultField);
    changeOpen = setOpen;
    changeDefaultField = setCurrentDefault;
    return createElement(SetLocationModal, {
      ...props,
      open,
      defaultField: currentDefault,
      onCancel: () => {
        onCancel();
        setOpen(false);
      }
    });
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  return {
    onApply,
    onManageLayers,
    onCancel,
    setOpen: async (open: boolean) => {
      await act(async () => changeOpen(open));
    },
    setDefaultField: async (field: string | undefined) => {
      await act(async () => changeDefaultField(field));
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('built-ins write their owned primary key and custom layers write their first candidate key', async (t) => {
  assert.equal(writableLabelKey(builtin), 'topology/rack');
  assert.equal(writableLabelKey(custom), 'custom/pod');
  assert.equal(writableLabelKey(noKeys), null);
  const panel = await mount();
  t.after(panel.unmount);
  assert.ok(document.body.textContent?.includes('topology/rack'));
  await chooseField(custom.id);
  assert.ok(document.body.textContent?.includes('custom/pod'));
  assert.ok(!document.body.textContent?.includes('custom/backup'));
});

test('the default skips unmapped and disabled layers and their options cannot be selected', async (t) => {
  const panel = await mount({
    fields: [noKeys, disabled, builtin],
    defaultField: noKeys.id
  });
  t.after(panel.unmount);
  const select = document.querySelector<HTMLSelectElement>(
    '[aria-label="Layer"]'
  )!;
  assert.equal(select.value, builtin.id);
  assert.equal(
    [...select.options].find((option) => option.value === noKeys.id)?.disabled,
    true
  );
  assert.equal(
    [...select.options].find((option) => option.value === disabled.id)
      ?.disabled,
    true
  );
  assert.equal(button('Apply').disabled, true);
});

test('no writable layer explains the missing configuration, disables apply, and offers layer management', async (t) => {
  const panel = await mount({ fields: [noKeys, disabled] });
  t.after(panel.unmount);
  assert.ok(renderedMessage('clusters.topology.batch.noWritableLayers'));
  assert.equal(document.querySelector('[aria-label="Location value"]'), null);
  assert.equal(button('Apply').disabled, true);
  await click('Apply');
  assert.equal(panel.onApply.mock.callCount(), 0);
  await click('Manage layers');
  assert.equal(panel.onManageLayers.mock.callCount(), 1);
});

test('a supplied custom layer remains selectable even when its table column is hidden and submits its id', async (t) => {
  const panel = await mount({ defaultField: custom.id });
  t.after(panel.unmount);
  assert.equal(
    document.querySelector<HTMLSelectElement>('[aria-label="Layer"]')?.value,
    custom.id
  );
  await pick('Pod A');
  assert.deepEqual(renderedMessage('clusters.topology.batch.summary'), {
    count: 1,
    field: custom.label,
    value: 'Pod A'
  });
  await click('Apply');
  assert.deepEqual(panel.onApply.mock.calls[0].arguments, [custom.id, 'Pod A']);
});

test('only different user and discovered values count as overwrites after a value is chosen', async (t) => {
  const targets = [
    worker(1, { [builtin.id]: at('same') }),
    worker(2, { [builtin.id]: at('old-user') }),
    worker(3, { [builtin.id]: at('same', 'discovered') }),
    worker(4, { [builtin.id]: at('old-auto', 'discovered') }),
    worker(5, { [builtin.id]: at('old-node', 'node') }),
    worker(6)
  ];
  const panel = await mount({ targets });
  t.after(panel.unmount);
  assert.equal(
    renderedMessage('clusters.topology.batch.overwriteAuto'),
    undefined
  );
  await pick('same');
  assert.equal(renderedMessage('clusters.topology.batch.overwrite')?.count, 1);
  assert.match(
    renderedMessage('clusters.topology.batch.overwrite')?.names,
    /worker-2/
  );
  assert.equal(
    renderedMessage('clusters.topology.batch.overwriteAuto')?.count,
    2
  );
});

test('clearing removes only owned labels, explains fallback values, and never reports overwriting discovered values', async (t) => {
  const panel = await mount({
    targets: [
      currentWorker(),
      worker(
        2,
        { [builtin.id]: at('secondary', 'user', 'legacy/rack') },
        { 'legacy/rack': 'secondary' }
      ),
      worker(3, { [builtin.id]: at('auto', 'discovered') }),
      worker(
        4,
        { [builtin.id]: { ...at('override'), discovered_value: 'fallback' } },
        { 'topology/rack': 'override' }
      )
    ]
  });
  t.after(panel.unmount);
  await pick(null);
  assert.equal(
    renderedMessage('clusters.topology.batch.clearSummary')?.count,
    4
  );
  assert.equal(
    renderedMessage('clusters.topology.batch.clearExisting')?.count,
    2
  );
  assert.ok(renderedMessage('clusters.topology.batch.clearHint'));
  assert.equal(
    renderedMessage('clusters.topology.batch.overwriteAuto'),
    undefined
  );
  await click('Apply');
  assert.deepEqual(panel.onApply.mock.calls[0].arguments, [builtin.id, null]);
});

test('rapid repeated apply clicks and clicks while pending submit only once, then release the guard', async (t) => {
  const pending = deferred();
  t.after(pending.resolve);
  const panel = await mount({ apply: () => pending.promise });
  t.after(panel.unmount);
  await pick('new-rack');
  await act(async () => {
    button('Apply').click();
    button('Apply').click();
  });
  assert.equal(panel.onApply.mock.callCount(), 1);
  assert.equal(button('Apply').disabled, true);
  await click('Apply');
  assert.equal(panel.onApply.mock.callCount(), 1);
  await act(async () => pending.resolve());
  await click('Apply');
  assert.equal(panel.onApply.mock.callCount(), 2);
});

test('the modal prevents cancel and header closure while applying and closes after the request settles', async (t) => {
  const pending = deferred();
  t.after(pending.resolve);
  const panel = await mount({ apply: () => pending.promise });
  t.after(panel.unmount);
  await pick('new-rack');
  await click('Apply');
  await click('Cancel');
  await click('Header close');
  assert.equal(panel.onCancel.mock.callCount(), 0);
  assert.ok(document.querySelector('[role="dialog"]'));
  await act(async () => pending.resolve());
  await click('Header close');
  assert.equal(panel.onCancel.mock.callCount(), 1);
  assert.equal(document.querySelector('[role="dialog"]'), null);
});

test('reopening resets stale values, preserves edits during opening, and clearing allows a fresh selection', async (t) => {
  const modal = await mount();
  t.after(modal.unmount);
  await chooseField(custom.id);
  await pick('unsaved-pod');
  assert.equal(button('Apply').disabled, false);
  await click('Header close');
  assert.equal(modal.onCancel.mock.callCount(), 1);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  await modal.setDefaultField(custom.id);
  await modal.setOpen(true);
  assert.equal(
    document.querySelector<HTMLSelectElement>('[aria-label="Layer"]')?.value,
    custom.id
  );
  assert.equal(
    document.querySelector<HTMLInputElement>('[aria-label="Location value"]')
      ?.value,
    ''
  );
  assert.equal(button('Apply').disabled, true);
  await chooseField(builtin.id);
  await pick('typed-during-opening');
  await act(async () => finishOpenAnimation?.());
  assert.equal(
    document.querySelector<HTMLSelectElement>('[aria-label="Layer"]')?.value,
    builtin.id
  );
  assert.equal(
    document.querySelector<HTMLInputElement>('[aria-label="Location value"]')
      ?.value,
    'typed-during-opening'
  );
  assert.equal(modal.onApply.mock.callCount(), 0);
  await click('Reset selected value');
  assert.equal(
    document.querySelector<HTMLInputElement>('[aria-label="Location value"]')
      ?.value,
    ''
  );
  assert.equal(button('Apply').disabled, true);
  assert.equal(renderedMessage('clusters.topology.batch.summary'), undefined);
  assert.equal(
    renderedMessage('clusters.topology.batch.clearSummary'),
    undefined
  );
  await click('Apply');
  assert.equal(modal.onApply.mock.callCount(), 0);
  await pick('reselected-rack');
  assert.equal(button('Apply').disabled, false);
  await click('Apply');
  assert.deepEqual(modal.onApply.mock.calls[0].arguments, [
    builtin.id,
    'reselected-rack'
  ]);
  assert.equal(modal.onApply.mock.callCount(), 1);
});
