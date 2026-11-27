import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

mock.module('@gpustack/core-ui', {
  namedExports: {
    LabelInfo: ({ label, required }: any) =>
      createElement(
        'span',
        { className: 'label-text' },
        label,
        required ? '﹡' : ''
      )
  }
});

mock.module(new URL('../index.module.less', import.meta.url).href, {
  defaultExport: {}
});

function setupDOM() {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    pretendToBeVisual: true
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    Element: dom.window.Element,
    ShadowRoot: dom.window.ShadowRoot,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true
  };
  const descriptors = Object.keys(globals).map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { configurable: true, value });
  Object.defineProperty(dom.window, 'matchMedia', {
    value: () => ({ matches: false, addListener() {}, removeListener() {} })
  });
  return {
    dom,
    restore() {
      Object.keys(globals).forEach((key, index) => {
        const descriptor = descriptors[index];
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as any)[key];
      });
      dom.window.close();
    }
  };
}

test('controlled string options emit values, support decorative icons and leave disabled options unchanged', async () => {
  const { dom, restore } = setupDOM();
  const { createRoot } = await import('react-dom/client');
  const { default: Group } = await import('../index');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const changes: string[] = [];
  const options = [
    {
      value: 'small',
      label: 'Small',
      icon: createElement('span', null, 'S'),
      tooltip: 'Compact option'
    },
    { value: 'large', label: 'Large' },
    { value: 'locked', label: 'Locked', disabled: true, fullWidth: true }
  ];
  const render = (value: string) =>
    root.render(
      createElement(Group, {
        value,
        label: 'Canvas size',
        required: true,
        options,
        onChange: (next: string) => changes.push(next)
      })
    );
  const input = (value: string) =>
    dom.window.document.querySelector(
      `input[value="${value}"]`
    ) as HTMLInputElement;
  try {
    await act(async () => render('small'));
    assert.equal(
      dom.window.document
        .querySelector('[role="radiogroup"]')
        ?.getAttribute('aria-label'),
      'Canvas size'
    );
    assert.equal(input('small').checked, true);
    assert.equal(
      dom.window.document.querySelector('.label-text')?.textContent,
      'Canvas size﹡'
    );
    assert.equal(
      dom.window.document.querySelector('span[aria-hidden]')?.textContent,
      'S'
    );
    await act(async () => input('large').click());
    assert.deepEqual(changes, ['large']);
    await act(async () => render('large'));
    assert.equal(input('large').checked, true);
    assert.equal(input('small').checked, false);
    await act(async () => input('locked').click());
    assert.deepEqual(changes, ['large']);
  } finally {
    await act(async () => root.unmount());
    restore();
  }
});

test('Form.Item preserves numeric zero and group disabling overrides each option', async () => {
  const { dom, restore } = setupDOM();
  const { createRoot } = await import('react-dom/client');
  const { Form } = await import('antd');
  const { default: Group } = await import('../index');
  const root = createRoot(dom.window.document.getElementById('root')!);
  let form: FormInstance;
  const Harness = ({ disabled = false }: { disabled?: boolean }) => {
    [form] = Form.useForm();
    return createElement(
      Form,
      { form, initialValues: { preset: 0 } },
      createElement(
        Form.Item,
        { name: 'preset', label: 'Preset', rules: [{ required: true }] },
        createElement(Group<number>, {
          disabled,
          options: [
            { value: 0, label: 'Zero' },
            { value: 1, label: 'One', disabled: false }
          ]
        })
      )
    );
  };
  const input = (value: number) =>
    dom.window.document.querySelector(
      `input[value="${value}"]`
    ) as HTMLInputElement;
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.ok(dom.window.document.getElementById('preset'));
    assert.equal((await form!.validateFields()).preset, 0);
    await act(async () => input(1).click());
    assert.equal(form!.getFieldValue('preset'), 1);
    await act(async () => form!.setFieldValue('preset', 0));
    assert.equal(input(0).checked, true);
    await act(async () =>
      root.render(createElement(Harness, { disabled: true }))
    );
    assert.equal(input(0).disabled, true);
    assert.equal(input(1).disabled, true);
    await act(async () => input(1).click());
    assert.equal(form!.getFieldValue('preset'), 0);
  } finally {
    await act(async () => root.unmount());
    restore();
  }
});
