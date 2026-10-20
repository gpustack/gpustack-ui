import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const empty = () => null;
mock.module('@ant-design/icons', {
  namedExports: { CheckOutlined: empty, CloseOutlined: empty }
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
    Button: ({ onClick, htmlType, ...props }: any) =>
      createElement('button', {
        onClick,
        type: htmlType,
        'aria-label': props['aria-label']
      }),
    Flex: ({ children }: any) => createElement('div', null, children)
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
const { default: InsertLayerInput } = await import('../insert-layer-input.tsx');

const mount = async (taken: string[] = []) => {
  const onConfirm = mock.fn();
  const onCancel = mock.fn();
  const onParentKeyDown = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  await act(async () => {
    root.render(
      createElement(
        'div',
        { onKeyDown: onParentKeyDown },
        createElement(InsertLayerInput, { taken, onConfirm, onCancel })
      )
    );
  });
  const input = document.querySelector('input')!;
  const type = async (value: string) => {
    await act(async () => {
      input.value = value;
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
  };
  const press = async (key: string, options: KeyboardEventInit = {}) => {
    await act(async () => {
      input.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
          ...options
        })
      );
    });
  };
  const click = async (action: 'confirm' | 'cancel') => {
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>(
          `button[aria-label="common.button.${action}"]`
        )!
        .click();
    });
  };
  const unmount = async () => {
    await act(async () => root.unmount());
  };
  return {
    input,
    type,
    press,
    click,
    unmount,
    onConfirm,
    onCancel,
    onParentKeyDown
  };
};

test('validates empty and reserved names, then confirms a trimmed unique name', async (t) => {
  const editor = await mount(['RACK', '主机']);
  t.after(editor.unmount);
  assert.equal(document.activeElement, editor.input);
  assert.equal(document.querySelector('[role="alert"]'), null);

  await editor.click('confirm');
  assert.equal(
    document.querySelector('[role="alert"]')?.textContent,
    'clusters.topology.custom.name.required'
  );
  await editor.type('  rack  ');
  await editor.press('Enter');
  assert.equal(
    document.querySelector('[role="alert"]')?.textContent,
    'clusters.topology.custom.name.taken'
  );
  await editor.type('主机');
  await editor.click('confirm');
  assert.equal(editor.onConfirm.mock.callCount(), 0);

  await editor.type('  pod-east  ');
  assert.equal(document.querySelector('[role="alert"]'), null);
  await editor.press('Enter');
  assert.deepEqual(editor.onConfirm.mock.calls[0].arguments, ['pod-east']);
  assert.equal(editor.onParentKeyDown.mock.callCount(), 0);
});

test('Enter waits for IME composition to finish before confirming', async (t) => {
  const editor = await mount();
  t.after(editor.unmount);
  await editor.type('机房');
  await editor.press('Enter', { isComposing: true });
  await editor.press('Enter', { keyCode: 229 });
  await act(async () => {
    editor.input.dispatchEvent(
      new dom.window.CompositionEvent('compositionstart', { bubbles: true })
    );
  });
  // Some browsers report isComposing=false on the composition's final Enter.
  await editor.press('Enter');
  assert.equal(editor.onConfirm.mock.callCount(), 0);
  await act(async () => {
    editor.input.dispatchEvent(
      new dom.window.CompositionEvent('compositionend', { bubbles: true })
    );
  });
  await editor.press('Enter');
  assert.deepEqual(editor.onConfirm.mock.calls[0].arguments, ['机房']);
});

test('Escape cancels only the inline editor, and the cancel icon also works', async (t) => {
  const editor = await mount();
  t.after(editor.unmount);
  await editor.press('Escape');
  assert.equal(editor.onCancel.mock.callCount(), 1);
  assert.equal(editor.onParentKeyDown.mock.callCount(), 0);
  assert.equal(editor.onConfirm.mock.callCount(), 0);
  await editor.click('cancel');
  assert.equal(editor.onCancel.mock.callCount(), 2);
});
