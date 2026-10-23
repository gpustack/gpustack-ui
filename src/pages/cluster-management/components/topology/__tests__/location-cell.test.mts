import { JSDOM } from 'jsdom';
import _ from 'lodash';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, isValidElement, useState } from 'react';
import type { WorkerLocation } from '../../../config/types';

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) => {
        if (id === 'clusters.topology.value.count')
          return `${values.count} workers`;
        if (id === 'clusters.topology.value.create')
          return `Create “${values.value}”`;
        if (id === 'clusters.topology.value.clear') return 'Clear value';
        if (id === 'clusters.topology.value.empty')
          return 'No available values. Enter a label value.';
        if (id === 'clusters.topology.mapping.noKeys')
          return 'No candidate keys';
        if (id === 'clusters.topology.cell.noKeys.tips')
          return 'Configure candidate keys in Manage Layers';
        if (id === 'clusters.topology.cell.unfilled')
          return 'Layer value not set';
        if (id === 'clusters.topology.state.user.tips')
          return `Worker label: ${values.key}`;
        if (id === 'clusters.topology.cell.aria')
          return `${values.field}: ${values.state} (${values.host})`;
        return id;
      }
    })
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: {
        option: 'location-option',
        cell: 'location-cell',
        unfilled: 'location-unfilled',
        failed: 'location-failed'
      }
    })
  }
});
// The sibling location helpers import the entire cluster configuration. Keep
// unrelated Core-UI exports out of these real antd interaction tests.
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    topologyLayerLabel: (_intl: any, layer: any) => layer.name
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/',
  pretendToBeVisual: true
});
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  HTMLAnchorElement: {
    configurable: true,
    value: dom.window.HTMLAnchorElement
  },
  HTMLInputElement: { configurable: true, value: dom.window.HTMLInputElement },
  HTMLTextAreaElement: {
    configurable: true,
    value: dom.window.HTMLTextAreaElement
  },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  Element: { configurable: true, value: dom.window.Element },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
  requestAnimationFrame: {
    configurable: true,
    value: dom.window.requestAnimationFrame
  },
  cancelAnimationFrame: {
    configurable: true,
    value: dom.window.cancelAnimationFrame
  },
  ResizeObserver: { configurable: true, value: ResizeObserver },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
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
// Exercise the Core-UI select contracts with the real antd widget underneath.
const { Select: BaseSelect } = await import('antd');
let floatingSelectOptions: any[] = [];
const assertPlainOptions = (value: unknown, path = 'options') => {
  // Stop at the element itself: traversing its React owner would reproduce
  // the expensive Fiber walk this boundary is meant to catch deterministically.
  assert.equal(
    isValidElement(value),
    false,
    `${path} must not contain React elements before Core-UI clones options`
  );
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertPlainOptions(item, `${path}[${index}]`)
    );
  } else if (value !== null && typeof value === 'object') {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
    Object.entries(value).forEach(([key, item]) =>
      assertPlainOptions(item, `${path}.${key}`)
    );
  } else {
    assert.ok(
      value === null ||
        ['string', 'number', 'boolean', 'undefined'].includes(typeof value),
      `${path} must contain plain data`
    );
  }
};
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect,
    IconFont: ({ type, ...props }: any) =>
      createElement('span', { ...props, 'data-icon': type }),
    Select: ({ label, isInFormItems, alwaysFocus, options, ...props }: any) => {
      assertPlainOptions(options);
      floatingSelectOptions = options;
      return createElement(
        'label',
        null,
        createElement('span', null, label),
        // The real Core-UI floating Select clones options before handing
        // them to BaseSelect, so exercise that contract with plain data.
        createElement(BaseSelect, { ...props, options: _.cloneDeep(options) })
      );
    }
  }
});
const { createRoot } = await import('react-dom/client');
const { default: LocationCell, LocationValueSelect } =
  await import('../location-cell.tsx');

const mount = async (
  current: string | null,
  options = [
    { value: 'rack-a', count: 3 },
    { value: 'rack-b', count: 1 }
  ]
) => {
  const onPick = mock.fn();
  const onCancel = mock.fn();
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(LocationValueSelect, {
        inline: true,
        current,
        fieldLabel: 'Rack',
        options,
        onPick,
        onCancel
      })
    );
  });
  return {
    container,
    onPick,
    onCancel,
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('inline editing displays the current value without its count, while candidates retain counts', async (t) => {
  const editor = await mount('rack-a');
  t.after(editor.unmount);
  const selected = editor.container.querySelector('.ant-select-content');
  assert.equal(selected?.textContent, 'rack-a');
  const options = [
    ...document.querySelectorAll('.ant-select-item-option-content')
  ];
  assert.ok(options.some((option) => option.textContent === 'rack-a3 workers'));
  assert.ok(options.some((option) => option.textContent === 'rack-b1 workers'));
  assert.equal(editor.onPick.mock.callCount(), 0);
});

test('an empty inline picker keeps its dropdown visible and offers guidance', async (t) => {
  const editor = await mount(null, []);
  t.after(editor.unmount);
  const dropdown = document.querySelector('.ant-select-dropdown');
  assert.ok(dropdown);
  assert.ok(!dropdown.classList.contains('ant-select-dropdown-hidden'));
  assert.ok(
    dropdown.textContent?.includes('No available values. Enter a label value.')
  );
  assert.equal(editor.onPick.mock.callCount(), 0);
});

test('selecting an existing value writes it once', async (t) => {
  const editor = await mount('rack-a');
  t.after(editor.unmount);
  const option = [
    ...document.querySelectorAll<HTMLElement>('.ant-select-item-option')
  ].find(
    (item) =>
      item.querySelector('.ant-select-item-option-content')?.textContent ===
      'rack-b1 workers'
  );
  assert.ok(option);
  await act(async () => option.click());
  assert.deepEqual(editor.onPick.mock.calls[0].arguments, ['rack-b']);
  assert.equal(editor.onPick.mock.callCount(), 1);
  assert.equal(editor.onCancel.mock.callCount(), 0);
});

test('Escape cancels an open inline editor without writing a value', async (t) => {
  const editor = await mount('rack-a');
  t.after(editor.unmount);
  const input =
    editor.container.querySelector<HTMLInputElement>('[role="combobox"]')!;
  await act(async () => {
    input.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true
      })
    );
  });
  assert.equal(editor.onCancel.mock.callCount(), 1);
  assert.equal(editor.onPick.mock.callCount(), 0);
});

const mountFloating = async (
  initialValue?: string | null,
  clearable = false
) => {
  const onPick = mock.fn();
  const onClear = mock.fn();
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const Picker = () => {
    const [value, setValue] = useState(initialValue);
    return createElement(LocationValueSelect, {
      label: 'Layer value',
      current: 'rack-a',
      fieldLabel: 'Rack',
      options: [
        { value: 'rack-a', count: 3 },
        { value: 'rack-b', count: 1 }
      ],
      value,
      onPick: (next) => {
        onPick(next);
        setValue(next);
      },
      onClear: clearable
        ? () => {
            onClear();
            setValue(undefined);
          }
        : undefined
    });
  };
  await act(async () => root.render(createElement(Picker)));
  return {
    container,
    onPick,
    onClear,
    get input() {
      return container.querySelector<HTMLInputElement>('[role="combobox"]')!;
    },
    open: async () => {
      await act(async () => {
        container.querySelector('[role="combobox"]')!.dispatchEvent(
          new dom.window.KeyboardEvent('keydown', {
            key: 'ArrowDown',
            keyCode: 40,
            bubbles: true,
            cancelable: true
          })
        );
      });
    },
    search: async (text: string) => {
      await act(async () => {
        const input =
          container.querySelector<HTMLInputElement>('[role="combobox"]')!;
        Object.getOwnPropertyDescriptor(
          dom.window.HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, text);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

const chooseOption = async (text: string) => {
  const option = [
    ...document.querySelectorAll<HTMLElement>('.ant-select-item-option')
  ].find(
    (item) =>
      item.querySelector('.ant-select-item-option-content')?.textContent ===
      text
  );
  assert.ok(option, `option ${text} is available`);
  await act(async () => option.click());
};

test('floating selection clones plain candidate data and preserves selected counts while filtering and choosing another value', async (t) => {
  const editor = await mountFloating('rack-a');
  t.after(editor.unmount);
  assert.equal(
    editor.container.querySelector('.ant-select-content')?.textContent,
    'rack-a3 workers'
  );
  await editor.open();
  assert.ok(
    floatingSelectOptions.every((option) => typeof option.label === 'string')
  );
  await editor.search('rack-b');
  assert.equal(editor.input.value, 'rack-b');
  assert.deepEqual(
    floatingSelectOptions.map((option) => option.value),
    ['rack-b', '__clear__']
  );
  assert.equal(
    editor.container.querySelector('.ant-select-content')?.textContent,
    'rack-a3 workers'
  );
  await chooseOption('rack-b1 workers');
  assert.deepEqual(editor.onPick.mock.calls[0].arguments, ['rack-b']);
  assert.equal(editor.onPick.mock.callCount(), 1);
  assert.equal(
    editor.container.querySelector('.ant-select-content')?.textContent,
    'rack-b1 workers'
  );
});

test('floating selection creates a typed value with plain option data and displays the actual value after selection', async (t) => {
  const editor = await mountFloating('rack-a');
  t.after(editor.unmount);
  await editor.open();
  await editor.search('  rack-new  ');
  assert.equal(editor.input.value, '  rack-new  ');
  assert.ok(
    floatingSelectOptions.every((option) => typeof option.label === 'string')
  );
  await chooseOption('Create “rack-new”');
  assert.deepEqual(editor.onPick.mock.calls[0].arguments, ['rack-new']);
  assert.equal(editor.onPick.mock.callCount(), 1);
  assert.equal(editor.input.value, '');
  assert.equal(
    editor.container.querySelector('.ant-select-content')?.textContent,
    'rack-new'
  );
});

test('floating selection clears the value through a plain option and preserves the selected clear label', async (t) => {
  const editor = await mountFloating('rack-a');
  t.after(editor.unmount);
  await editor.open();
  const clear = floatingSelectOptions.find(
    (option) => option.action === 'clear'
  );
  assert.ok(clear);
  assert.equal(typeof clear.label, 'string');
  await chooseOption('Clear value');
  assert.deepEqual(editor.onPick.mock.calls[0].arguments, [null]);
  assert.equal(editor.onPick.mock.callCount(), 1);
  assert.equal(
    editor.container.querySelector('.ant-select-content')?.textContent,
    'Clear value'
  );
});

test('the floating clear icon resets the selection and search without choosing label deletion', async (t) => {
  const editor = await mountFloating('rack-a', true);
  t.after(editor.unmount);
  await editor.open();
  await editor.search('rack-b');
  assert.equal(editor.input.value, 'rack-b');
  const clear =
    editor.container.querySelector<HTMLElement>('.ant-select-clear');
  assert.ok(clear);
  await act(async () => {
    clear.dispatchEvent(
      new dom.window.MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true
      })
    );
  });
  assert.equal(editor.onClear.mock.callCount(), 1);
  assert.equal(editor.onPick.mock.callCount(), 0);
  assert.equal(editor.input.value, '');
  assert.equal(
    editor.container.querySelector('.ant-select-content')?.textContent,
    'clusters.topology.cell.fill'
  );
  assert.deepEqual(
    floatingSelectOptions.map((option) => option.value),
    ['rack-a', 'rack-b', '__clear__']
  );
});

const mountCell = async (labelKeys: string[]) => {
  const onStartEdit = mock.fn();
  const onSave = mock.fn(async (_value: string | null) => undefined);
  const onBusy = mock.fn();
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  const renderValue = async (
    current?: string,
    next: {
      labelKeys?: string[];
      editing?: boolean;
      disabled?: boolean;
      builtin?: boolean;
      location?: Partial<WorkerLocation>;
    } = {}
  ) => {
    await act(async () => {
      root.render(
        createElement(LocationCell, {
          worker: {
            id: 1,
            name: 'worker-a',
            state: 'ready',
            gpus: 0,
            free_gpus: 0,
            location: current
              ? {
                  rack: {
                    value: current,
                    source: 'user',
                    key: 'labels/rack',
                    ...next.location
                  }
                }
              : {}
          },
          field: {
            id: 'rack',
            name: 'rack',
            label: 'Rack',
            builtin: next.builtin ?? false,
            active: false,
            primaryKey: null,
            disabled: next.disabled,
            labelKeys: next.labelKeys ?? labelKeys
          },
          options: [],
          editing: next.editing ?? false,
          onStartEdit,
          onStopEdit: () => {},
          onSave,
          onTab: () => {},
          onBusy
        })
      );
    });
  };
  await renderValue();
  return {
    onStartEdit,
    onSave,
    onBusy,
    container,
    renderValue,
    get button() {
      return container.querySelector<HTMLButtonElement>(
        'button.location-cell'
      )!;
    },
    tooltip: async () => {
      await act(async () => {
        const target =
          container.querySelector('button.location-cell') ||
          container.firstElementChild!;
        target.dispatchEvent(
          new dom.window.MouseEvent('mouseover', { bubbles: true })
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
      return document.querySelector('[role="tooltip"]')?.textContent;
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('a cell without candidate keys stays static despite input events, stale values, or external editing', async (t) => {
  const cell = await mountCell([]);
  t.after(cell.unmount);
  const assertStatic = () => {
    assert.equal(cell.container.textContent, 'No candidate keys');
    assert.equal(
      cell.container.querySelector(
        'button, [role="button"], [role="combobox"], [tabindex], .edit, [data-icon="edit"]'
      ),
      null
    );
    assert.ok(cell.container.querySelector('[data-icon="icon-label_thin"]'));
  };
  assertStatic();
  assert.equal(
    await cell.tooltip(),
    'Configure candidate keys in Manage Layers'
  );
  assertStatic();
  await act(async () => {
    const text = cell.container.firstElementChild as HTMLElement;
    text.click();
    for (const key of ['Enter', ' ']) {
      text.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true
        })
      );
    }
  });
  assert.equal(cell.onStartEdit.mock.callCount(), 0);
  assert.equal(cell.onSave.mock.callCount(), 0);
  assert.equal(cell.onBusy.mock.callCount(), 0);

  await cell.renderValue('stale-rack', { editing: true });
  assertStatic();
  assert.equal(cell.onBusy.mock.callCount(), 0);
  await cell.renderValue(undefined, {
    labelKeys: ['labels/rack'],
    editing: true
  });
  assert.ok(cell.container.querySelector('[role="combobox"]'));
  assert.deepEqual(
    cell.onBusy.mock.calls.map((call) => call.arguments),
    [[true]]
  );
  await cell.renderValue('stale-rack', { labelKeys: [], editing: true });
  assertStatic();
  assert.deepEqual(
    cell.onBusy.mock.calls.map((call) => call.arguments),
    [[true], [false]]
  );
});

test('a cell with missing worker labels has no hover tooltip and still starts inline editing on click', async (t) => {
  const cell = await mountCell(['labels/rack', 'legacy/rack']);
  t.after(cell.unmount);
  assert.equal(
    cell.button.querySelector('.value')?.textContent,
    'Layer value not set'
  );
  assert.equal(
    cell.button.getAttribute('aria-label'),
    'Rack: Layer value not set (worker-a)'
  );
  assert.equal(await cell.tooltip(), undefined);
  await act(async () => cell.button.click());
  assert.equal(cell.onStartEdit.mock.callCount(), 1);
  assert.equal(cell.onSave.mock.callCount(), 0);

  await cell.renderValue('rack-a');
  assert.equal(cell.button.querySelector('.value')?.textContent, 'rack-a');
  assert.equal(
    cell.button.getAttribute('aria-label'),
    'Rack: rack-a (worker-a)'
  );
  assert.equal(await cell.tooltip(), 'Worker label: labels/rack');
});

for (const current of [undefined, 'rack-a']) {
  test(`a disabled layer keeps ${current ? 'its existing value' : 'its empty state'} read-only`, async (t) => {
    const cell = await mountCell(['labels/rack']);
    t.after(cell.unmount);
    await cell.renderValue(current, {
      builtin: true,
      disabled: true,
      editing: true
    });
    assert.equal(
      cell.container.querySelector('.value')?.textContent,
      current || 'Layer value not set'
    );
    assert.equal(
      cell.container.querySelector(
        'button, [role="button"], [role="combobox"], [tabindex], .edit'
      ),
      null
    );
    const text = cell.container.firstElementChild as HTMLElement;
    assert.equal(text.getAttribute('aria-disabled'), 'true');
    await act(async () => {
      text.click();
      for (const key of ['Enter', ' ']) {
        text.dispatchEvent(
          new dom.window.KeyboardEvent('keydown', { key, bubbles: true })
        );
      }
    });
    assert.equal(cell.onStartEdit.mock.callCount(), 0);
    assert.equal(cell.onSave.mock.callCount(), 0);
    assert.equal(cell.onBusy.mock.callCount(), 0);
  });
}

test('disabling an open editor releases the busy state and re-enabling restores editing', async (t) => {
  const cell = await mountCell(['labels/rack']);
  t.after(cell.unmount);
  await cell.renderValue(undefined, { builtin: true, editing: true });
  assert.ok(cell.container.querySelector('[role="combobox"]'));
  assert.deepEqual(
    cell.onBusy.mock.calls.map((call) => call.arguments),
    [[true]]
  );

  await cell.renderValue('rack-a', {
    builtin: true,
    editing: true,
    disabled: true
  });
  assert.equal(cell.container.querySelector('[role="combobox"]'), null);
  assert.equal(cell.container.querySelector('.value')?.textContent, 'rack-a');
  assert.deepEqual(
    cell.onBusy.mock.calls.map((call) => call.arguments),
    [[true], [false]]
  );
  assert.equal(cell.onSave.mock.callCount(), 0);

  await cell.renderValue('rack-a', { builtin: true, disabled: false });
  assert.ok(cell.button);
  await act(async () => cell.button.click());
  assert.equal(cell.onStartEdit.mock.callCount(), 1);
});

test('a disabled layer preserves the display name and lock for a discovered value', async (t) => {
  const cell = await mountCell(['labels/rack']);
  t.after(cell.unmount);
  await cell.renderValue('rack-id', {
    builtin: true,
    disabled: true,
    location: { source: 'discovered', display: 'Rack display name' }
  });
  assert.equal(
    cell.container.querySelector('.value')?.textContent,
    'Rack display name'
  );
  assert.ok(cell.container.querySelector('[aria-label="lock"]'));
  await act(async () =>
    (cell.container.firstElementChild as HTMLElement).click()
  );
  assert.equal(document.querySelector('.ant-popconfirm'), null);
  assert.equal(cell.onStartEdit.mock.callCount(), 0);
  assert.equal(cell.onSave.mock.callCount(), 0);
});
