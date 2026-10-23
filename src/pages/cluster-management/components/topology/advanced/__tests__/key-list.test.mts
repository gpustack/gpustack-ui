import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';

const empty = () => null;
mock.module('@ant-design/icons', {
  namedExports: {
    HolderOutlined: empty,
    LockOutlined: empty,
    PlusOutlined: empty
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    ThemeTag: ({ opacity, ...props }: any) => createElement(Tag, props)
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    Button: ({ children, onClick, ...props }: any) =>
      createElement(
        'button',
        { onClick, 'aria-label': props['aria-label'] },
        children
      ),
    Flex: ({ children, orientation, gap, align, ...props }: any) =>
      createElement('div', props, children),
    Tooltip: ({ children }: any) => children
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({ styles: {}, theme: { marginXS: 8 } })
  }
});
mock.module(new URL('../key-editor.tsx', import.meta.url).href, {
  namedExports: {
    KeyEditor: ({ onAdd, onCancel }: any) => {
      const [typed, setTyped] = useState('');
      return createElement(
        'div',
        { 'data-key-editor': true },
        createElement('input', {
          value: typed,
          onInput: (event: any) => setTyped(event.currentTarget.value)
        }),
        createElement(
          'button',
          { 'data-submit-key': true, onClick: () => onAdd(typed) },
          'add'
        ),
        createElement(
          'button',
          { 'data-cancel-key': true, onClick: onCancel },
          'cancel'
        )
      );
    }
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  Element: { configurable: true, value: dom.window.Element },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
// Reuse antd's actual Tag so its built-in close action drives the deletion.
const { default: Tag } = await import('antd/es/tag/index.js');
const { createRoot } = await import('react-dom/client');
const { default: KeyList } = await import('../key-list.tsx');

const mount = async (
  initial: string[],
  lockedKey?: string,
  options: { defaultEditing?: boolean; editing?: boolean } = {}
) => {
  const onChange = mock.fn();
  const onEditingChange = mock.fn();
  let changeEditing: (editing: boolean | undefined) => void;
  const root = createRoot(document.getElementById('root')!);
  const Harness = () => {
    const [keys, setKeys] = useState(initial);
    const [editing, setEditing] = useState(options.editing);
    changeEditing = setEditing;
    return createElement(KeyList, {
      keys,
      lockedKey,
      fieldId: 'zone',
      vocabulary: { known: [], workerLabels: [] },
      defaultEditing: options.defaultEditing,
      editing,
      onEditingChange,
      onChange: (next) => {
        onChange(next);
        setKeys(next);
      }
    });
  };
  await act(async () => root.render(createElement(Harness)));
  const rows = () => [
    ...document.querySelectorAll<HTMLElement>('[draggable="true"]')
  ];
  const row = (key: string) =>
    rows().find((element) => element.textContent === key)!;
  const drag = async (source: string, target: string) => {
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: mock.fn()
    };
    const dispatch = async (element: HTMLElement, type: string) => {
      const event = new dom.window.Event(type, {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
      await act(async () => element.dispatchEvent(event));
    };
    await dispatch(row(source), 'dragstart');
    await dispatch(row(target), 'dragover');
    await dispatch(row(target), 'drop');
    return dataTransfer;
  };
  return {
    onChange,
    onEditingChange,
    row,
    drag,
    order: () => rows().map((element) => element.textContent),
    editor: () => document.querySelector('[data-key-editor]'),
    input: () =>
      document.querySelector<HTMLInputElement>('[data-key-editor] input')!,
    type: async (value: string) => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-key-editor] input'
      )!;
      await act(async () => {
        input.value = value;
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
    },
    open: async () => {
      const add = [...document.querySelectorAll('button')].find(
        (button) => button.textContent === 'clusters.topology.layer.addKey'
      )!;
      await act(async () => add.click());
    },
    cancel: async () => {
      await act(async () =>
        document.querySelector<HTMLButtonElement>('[data-cancel-key]')!.click()
      );
    },
    submit: async () => {
      await act(async () =>
        document.querySelector<HTMLButtonElement>('[data-submit-key]')!.click()
      );
    },
    setEditing: async (editing: boolean | undefined) => {
      await act(async () => changeEditing(editing));
    },
    rerender: async () => {
      await act(async () => root.render(createElement(Harness)));
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('dragging adjacent candidate keys changes their priority in both directions', async (t) => {
  const list = await mount(['key-a', 'key-b', 'key-c']);
  t.after(list.unmount);

  const transfer = await list.drag('key-a', 'key-b');
  assert.deepEqual(list.order(), ['key-b', 'key-a', 'key-c']);
  assert.deepEqual(list.onChange.mock.calls[0].arguments, [
    ['key-b', 'key-a', 'key-c']
  ]);
  assert.equal(transfer.effectAllowed, 'move');
  assert.deepEqual(transfer.setData.mock.calls[0].arguments, [
    'text/plain',
    'key-a'
  ]);

  await list.drag('key-a', 'key-b');
  assert.deepEqual(list.order(), ['key-a', 'key-b', 'key-c']);
});

test('the built-in key stays first and cannot be dragged or deleted', async (t) => {
  const lockedKey = 'topology.gpustack.ai/zone';
  const list = await mount(['key-a', lockedKey, 'key-b'], lockedKey);
  t.after(list.unmount);

  const lockedRow = document.querySelector('.value')!.parentElement!;
  assert.equal(lockedRow.textContent, lockedKey);
  assert.equal(lockedRow.getAttribute('draggable'), null);
  assert.equal(lockedRow.querySelector('.ant-tag-close-icon'), null);

  await list.drag('key-a', 'key-b');
  assert.deepEqual(list.onChange.mock.calls[0].arguments, [
    [lockedKey, 'key-b', 'key-a']
  ]);
  const close = list
    .row('key-b')
    .querySelector<HTMLElement>(
      '.value [aria-label="common.button.delete key-b"]'
    );
  assert.ok(close, 'The removable tag owns its close action');
  await act(async () => {
    close.click();
  });
  assert.deepEqual(list.onChange.mock.calls[1].arguments, [
    [lockedKey, 'key-a']
  ]);
});

test('standalone editing opens by default and can cancel, reopen, and add a key', async (t) => {
  const list = await mount(['key-a'], undefined, { defaultEditing: true });
  t.after(list.unmount);

  assert.ok(list.editor());
  await list.type('discarded-key');
  await list.cancel();
  assert.equal(list.editor(), null);
  assert.equal(list.onChange.mock.callCount(), 0);
  assert.deepEqual(list.onEditingChange.mock.calls[0].arguments, [false]);

  await list.open();
  assert.ok(list.editor());
  assert.equal(list.input().value, '');
  assert.deepEqual(list.onEditingChange.mock.calls[1].arguments, [true]);
  await list.type('key-b');
  await list.submit();
  assert.deepEqual(list.order(), ['key-a', 'key-b']);
  assert.equal(list.editor(), null);
  assert.deepEqual(list.onChange.mock.calls[0].arguments, [['key-a', 'key-b']]);
  assert.deepEqual(list.onEditingChange.mock.calls[2].arguments, [false]);
});

test('controlled editing follows the parent and reports open and cancel requests', async (t) => {
  const list = await mount(['key-a'], undefined, {
    defaultEditing: true,
    editing: false
  });
  t.after(list.unmount);

  assert.equal(list.editor(), null, 'controlled false overrides the default');
  await list.open();
  assert.deepEqual(list.onEditingChange.mock.calls[0].arguments, [true]);
  assert.equal(list.editor(), null, 'an open request waits for the parent');

  await list.setEditing(true);
  assert.ok(list.editor());
  await list.cancel();
  assert.deepEqual(list.onEditingChange.mock.calls[1].arguments, [false]);
  assert.ok(list.editor(), 'a cancel request waits for the parent');
  await list.setEditing(false);
  assert.equal(list.editor(), null);
  assert.equal(list.onChange.mock.callCount(), 0);
});

test('controlled editing preserves a draft on parent rerenders and reports closure after adding', async (t) => {
  const list = await mount(['key-a'], undefined, { editing: true });
  t.after(list.unmount);

  await list.type('key-b');
  const input = list.input();
  await list.setEditing(true);
  await list.rerender();
  assert.equal(list.input(), input);
  assert.equal(list.input().value, 'key-b');

  await list.submit();
  assert.deepEqual(list.onChange.mock.calls[0].arguments, [['key-a', 'key-b']]);
  assert.deepEqual(list.onEditingChange.mock.calls[0].arguments, [false]);
  assert.deepEqual(list.order(), ['key-a', 'key-b']);
  assert.ok(list.editor(), 'adding cannot override the parent editing prop');
  await list.setEditing(false);
  assert.equal(list.editor(), null);
});
