import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';
import type { DraftLayer } from '../draft';
import type { KeyListProps } from '../key-list';

const empty = () => null;
mock.module('@ant-design/icons', {
  namedExports: Object.fromEntries(
    [
      'CheckOutlined',
      'CloseOutlined',
      'DownOutlined',
      'ExclamationCircleOutlined',
      'MoreOutlined',
      'PlusOutlined',
      'RightOutlined'
    ].map((name) => [name, empty])
  )
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: ({ type, className, 'aria-hidden': ariaHidden }: any) =>
      createElement('span', {
        className,
        'data-icon': type,
        'aria-hidden': ariaHidden
      }),
    ThemeTag: ({ children, className }: any) =>
      createElement('span', { className }, children)
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    Input: ({
      value,
      onChange,
      autoFocus,
      onKeyDown,
      onCompositionStart,
      onCompositionEnd,
      placeholder,
      ...props
    }: any) =>
      createElement('input', {
        value,
        autoFocus,
        onInput: onChange,
        onKeyDown,
        onCompositionStart,
        onCompositionEnd,
        placeholder,
        'aria-label': props['aria-label'],
        'aria-invalid': props['aria-invalid'],
        'aria-describedby': props['aria-describedby']
      }),
    Button: ({ children, icon, type, size, htmlType, ...props }: any) =>
      createElement(
        'button',
        { ...props, type: htmlType ?? 'button' },
        children
      ),
    // Expose menu callbacks directly; these tests cover FieldChain's action
    // wiring, not antd's dropdown visibility or portal implementation.
    Dropdown: ({ children, menu }: any) =>
      createElement(
        'div',
        null,
        children,
        createElement(
          'div',
          { role: 'menu' },
          menu.items
            .filter((item: any) => item.type !== 'divider')
            .map((item: any) =>
              createElement(
                'button',
                {
                  key: item.key,
                  role: 'menuitem',
                  onClick: (domEvent: any) =>
                    menu.onClick({ key: item.key, domEvent })
                },
                item.label
              )
            )
        )
      ),
    Flex: ({
      children,
      orientation,
      align,
      justify,
      gap,
      wrap,
      ...props
    }: any) => createElement('div', props, children),
    Tooltip: ({ children }: any) => children
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../key-editor.tsx', import.meta.url).href, {
  namedExports: { CUSTOM_FIELD: 'custom' }
});
// Keep candidate-key editing separate from these parent-flow tests. The real
// InsertLayerInput remains mounted so validation and keyboard submission run.
const renderedKeyLists = new Map<string, KeyListProps>();
mock.module(new URL('../key-list.tsx', import.meta.url).href, {
  defaultExport: (props: KeyListProps) => {
    const { fieldId, editing, defaultEditing, onEditingChange } = props;
    renderedKeyLists.set(fieldId, props);
    return createElement(
      'section',
      {
        'aria-label': `candidate-keys-${fieldId}`,
        'data-editing': editing ?? !!defaultEditing
      },
      (editing ?? defaultEditing) &&
        createElement(
          'button',
          { onClick: () => onEditingChange?.(false) },
          'Finish key editing'
        )
    );
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
const { default: FieldChain } = await import('../field-chain.tsx');

const layer = (
  id: string,
  overrides: Partial<DraftLayer> = {}
): DraftLayer => ({
  id,
  name: id,
  label: id,
  builtin: false,
  active: true,
  disabled: false,
  labelKeys: [`labels/${id}`],
  primaryKey: null,
  customised: false,
  ...overrides
});
const initialRows = () => [
  layer('zone', { label: 'Zone display', builtin: true, active: false }),
  layer('pod', {
    label: 'Pod display',
    labelKeys: ['labels/pod', 'legacy/pod', 'facts/pod']
  }),
  layer('rack', { label: 'Rack display', builtin: true, disabled: true })
];
const headers = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[aria-expanded]'));
const header = (label: string) => {
  const result = headers().find((element) =>
    element.textContent?.includes(label)
  );
  assert.ok(result, `Layer header exists: ${label}`);
  return result;
};
const rung = (label: string) => header(label).closest('.rung')!;
const menuAction = (label: string, action: string) => {
  const item = Array.from(
    rung(label).querySelectorAll<HTMLElement>('[role="menuitem"]')
  ).find((element) => element.textContent === action);
  assert.ok(item, `Menu action exists: ${action} on ${label}`);
  return item;
};
const keyList = (label: string) =>
  rung(label).querySelector<HTMLElement>('[aria-label^="candidate-keys-"]');
const insertionButtons = (within: ParentNode = document) =>
  Array.from(within.querySelectorAll<HTMLButtonElement>('button')).filter(
    (button) => button.textContent === 'clusters.topology.custom.insertHere'
  );
const click = async (element: HTMLElement) => {
  await act(async () => element.click());
};
const typeAndSubmit = async (value: string) => {
  const input = document.querySelector('input')!;
  assert.ok(input);
  await act(async () => {
    input.value = value;
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await act(async () => {
    input.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true
      })
    );
  });
};

const mount = async () => {
  const onAdd = mock.fn();
  const onKeysChange = mock.fn();
  renderedKeyLists.clear();
  let replaceRows!: (rows: DraftLayer[]) => void;
  const Harness = () => {
    const [rows, setRows] = useState(initialRows);
    replaceRows = setRows;
    return createElement(FieldChain, {
      rows,
      total: 3,
      classified: {},
      flashing: new Set<string>(),
      vocabulary: { known: [], workerLabels: [] },
      reserved: ['host'],
      onAddLayer: (name, index) => {
        onAdd(name, index);
        const added = layer('new-layer', { name, label: name, labelKeys: [] });
        setRows((current) => [
          ...current.slice(0, index),
          added,
          ...current.slice(index)
        ]);
        return added.id;
      },
      onKeysChange: (id, keys) => {
        onKeysChange(id, keys);
        setRows((current) =>
          current.map((row) =>
            row.id === id ? { ...row, labelKeys: keys } : row
          )
        );
      },
      onRename: empty,
      onToggleDisabled: empty,
      onDelete: empty
    });
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  return {
    onAdd,
    onKeysChange,
    replaceRows: async (rows: DraftLayer[]) => {
      await act(async () => replaceRows(rows));
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('shows unused and disabled layers by default and expands each row independently', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  assert.equal(headers().length, 3);
  for (const row of initialRows()) {
    assert.equal(header(row.label).getAttribute('aria-expanded'), 'false');
    assert.equal(insertionButtons(rung(row.label)).length, 1);
  }
  assert.doesNotMatch(
    header('Pod display').textContent || '',
    /clusters\.topology\.mapping\.moreKeys|\+\d+/
  );

  await click(header('Zone display'));
  await click(header('Pod display'));
  assert.equal(header('Zone display').getAttribute('aria-expanded'), 'true');
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'true');
  assert.ok(document.querySelector('[aria-label="candidate-keys-zone"]'));
  assert.ok(document.querySelector('[aria-label="candidate-keys-custom"]'));
  assert.equal(insertionButtons(rung('Zone display')).length, 0);
  assert.equal(insertionButtons(rung('Pod display')).length, 0);
  assert.equal(insertionButtons(rung('Rack display')).length, 1);

  await click(header('Zone display'));
  assert.equal(
    document.querySelector('[aria-label="candidate-keys-zone"]'),
    null
  );
  assert.ok(document.querySelector('[aria-label="candidate-keys-custom"]'));
  assert.equal(insertionButtons(rung('Zone display')).length, 1);
});

test('inserts after the chosen layer through the real inline input and opens its key editor', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await click(insertionButtons(rung('Pod display'))[0]);
  assert.equal(document.activeElement, document.querySelector('input'));
  assert.ok(rung('Pod display').querySelector('input'));
  await typeAndSubmit('  Network block  ');
  assert.deepEqual(chain.onAdd.mock.calls[0].arguments, ['Network block', 2]);
  assert.equal(header('Network block').getAttribute('aria-expanded'), 'true');
  assert.equal(
    document
      .querySelector('[aria-label="candidate-keys-custom"]')
      ?.getAttribute('data-editing'),
    'true'
  );
  assert.equal(document.querySelector('input'), null);
  assert.deepEqual(
    headers().map(
      (element) => element.querySelector('.name')?.firstChild?.textContent
    ),
    ['Zone display', 'Pod display', 'Network block', 'Rack display']
  );
});

test('the add-key menu opens or restarts editing without collapsing an expanded row', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await click(header('Zone display'));
  assert.equal(keyList('Zone display')?.getAttribute('data-editing'), 'false');

  await click(menuAction('Pod display', 'clusters.topology.layer.addKey'));
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'true');
  assert.equal(keyList('Pod display')?.getAttribute('data-editing'), 'true');
  assert.equal(header('Zone display').getAttribute('aria-expanded'), 'true');
  const finish = Array.from(
    rung('Pod display').querySelectorAll('button')
  ).find((button) => button.textContent === 'Finish key editing');
  assert.ok(finish);
  await click(finish);
  assert.equal(keyList('Pod display')?.getAttribute('data-editing'), 'false');
  await click(menuAction('Pod display', 'clusters.topology.layer.addKey'));
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'true');
  assert.equal(keyList('Pod display')?.getAttribute('data-editing'), 'true');
  assert.equal(keyList('Zone display')?.getAttribute('data-editing'), 'false');
});

test('the empty-key hint is plain text that bubbles to repeatedly expand and collapse its row', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await chain.replaceRows([
    ...initialRows(),
    layer('unmapped', { label: 'Unmapped display', labelKeys: [] })
  ]);
  const hint = () => {
    const text = Array.from(
      rung('Unmapped display').querySelectorAll<HTMLElement>('span')
    ).find(
      (item) => item.textContent === 'clusters.topology.mapping.noKeys.add'
    );
    assert.ok(text);
    const container = text.closest<HTMLElement>('.no-keys');
    assert.ok(container);
    for (const element of [container, text]) {
      assert.notEqual(element.tagName, 'BUTTON');
      assert.equal(element.getAttribute('role'), null);
      assert.equal(element.getAttribute('tabindex'), null);
    }
    assert.equal(text.closest('button'), null);
    assert.equal(container.querySelector('button'), null);
    return { container, text };
  };
  await click(hint().text);
  assert.equal(
    header('Unmapped display').getAttribute('aria-expanded'),
    'true'
  );
  assert.equal(
    keyList('Unmapped display')?.getAttribute('data-editing'),
    'true'
  );
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'false');
  await click(hint().container);
  assert.equal(
    header('Unmapped display').getAttribute('aria-expanded'),
    'false'
  );
  assert.equal(keyList('Unmapped display'), null);

  await click(hint().text);
  assert.equal(
    header('Unmapped display').getAttribute('aria-expanded'),
    'true'
  );
  assert.equal(
    keyList('Unmapped display')?.getAttribute('data-editing'),
    'true'
  );
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'false');
  await click(hint().text);
  assert.equal(
    header('Unmapped display').getAttribute('aria-expanded'),
    'false'
  );
  assert.equal(keyList('Unmapped display'), null);
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'false');
});

test('the insert menu opens the inline slot after an expanded row without toggling its key list', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await click(header('Pod display'));
  await click(menuAction('Pod display', 'clusters.topology.layer.insert'));
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'true');
  assert.ok(keyList('Pod display'));
  assert.ok(rung('Pod display').querySelector('input'));
  assert.equal(document.activeElement, document.querySelector('input'));
  await typeAndSubmit('Network block');
  assert.deepEqual(chain.onAdd.mock.calls[0].arguments, ['Network block', 2]);
  assert.equal(header('Pod display').getAttribute('aria-expanded'), 'true');
  assert.equal(header('Network block').getAttribute('aria-expanded'), 'true');
  assert.equal(keyList('Network block')?.getAttribute('data-editing'), 'true');
});

test('uses canonical built-in names and custom scope for key suggestions instead of layer ids', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await chain.replaceRows([
    layer('builtin-000001', {
      builtin: true,
      name: 'zone',
      label: 'Renamed zone'
    }),
    layer('custom-abc123', {
      name: 'NVLink domain',
      label: 'NVLink display'
    })
  ]);
  await click(header('Renamed zone'));
  await click(header('NVLink display'));
  assert.ok(
    rung('Renamed zone').querySelector('[aria-label="candidate-keys-zone"]')
  );
  assert.ok(
    rung('NVLink display').querySelector('[aria-label="candidate-keys-custom"]')
  );
});

test('custom primary candidates remain removable and the summary follows the remaining keys while built-ins stay locked', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await chain.replaceRows([
    layer('zone', {
      builtin: true,
      label: 'Zone display',
      primaryKey: 'labels/zone'
    }),
    layer('custom-pod', {
      label: 'Custom pod',
      primaryKey: 'labels/pod',
      labelKeys: ['labels/pod', 'legacy/pod']
    })
  ]);
  await click(header('Zone display'));
  await click(header('Custom pod'));
  assert.equal(renderedKeyLists.get('zone')?.lockedKey, 'labels/zone');
  assert.equal(renderedKeyLists.get('custom')?.lockedKey, null);
  assert.equal(
    header('Custom pod').querySelector('.key-text')?.textContent,
    'labels/pod'
  );

  await act(async () =>
    renderedKeyLists.get('custom')!.onChange(['legacy/pod'])
  );
  assert.deepEqual(chain.onKeysChange.mock.calls[0].arguments, [
    'custom-pod',
    ['legacy/pod']
  ]);
  assert.equal(
    header('Custom pod').querySelector('.key-text')?.textContent,
    'legacy/pod'
  );
  await act(async () => renderedKeyLists.get('custom')!.onChange([]));
  assert.deepEqual(chain.onKeysChange.mock.calls[1].arguments, [
    'custom-pod',
    []
  ]);
  assert.equal(header('Custom pod').querySelector('.key-text'), null);
  assert.ok(
    header('Custom pod').textContent?.includes(
      'clusters.topology.mapping.noKeys.add'
    )
  );
  assert.equal(renderedKeyLists.get('zone')?.lockedKey, 'labels/zone');
});

test('keeps the zone highest and rejects reserved, canonical, and display names when inserting below it', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  const buttons = insertionButtons();
  assert.equal(buttons.length, initialRows().length);
  assert.ok(buttons.every((button) => button.closest('.rung')));
  assert.equal(buttons[0].closest('.rung'), rung('Zone display'));
  await click(buttons[0]);
  for (const duplicate of ['HOST', ' zone ', 'ZONE DISPLAY']) {
    await typeAndSubmit(duplicate);
    assert.equal(chain.onAdd.mock.callCount(), 0);
    assert.equal(
      document.querySelector('[role="alert"]')?.textContent,
      'clusters.topology.custom.name.taken'
    );
  }
  await typeAndSubmit('Region');
  assert.deepEqual(chain.onAdd.mock.calls[0].arguments, ['Region', 1]);
  assert.equal(headers()[0], header('Zone display'));
  assert.equal(headers()[1], header('Region'));
});

test('keeps the chosen insertion neighbour when a preceding layer is removed', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  await click(insertionButtons(rung('Rack display'))[0]);
  await chain.replaceRows(initialRows().filter((row) => row.id !== 'pod'));
  await typeAndSubmit('Network block');
  assert.deepEqual(chain.onAdd.mock.calls[0].arguments, ['Network block', 2]);
});

test('keeps the host as a fixed last layer without editing or an insertion slot after it', async (t) => {
  const chain = await mount();
  t.after(chain.unmount);
  const host = document.querySelector<HTMLElement>('.head.static')!;
  assert.ok(host.textContent?.includes('clusters.topology.field.host'));
  assert.equal(host.getAttribute('role'), null);
  assert.equal(host.getAttribute('tabindex'), null);
  assert.equal(host.getAttribute('aria-expanded'), null);
  assert.equal(host.querySelector('button'), null);
  assert.equal(host.querySelector('input'), null);
  assert.equal(host.parentElement?.nextElementSibling, null);
  assert.equal(insertionButtons().length, initialRows().length);
  await click(host);
  assert.equal(document.querySelector('section'), null);
  assert.equal(document.querySelector('input'), null);
});
