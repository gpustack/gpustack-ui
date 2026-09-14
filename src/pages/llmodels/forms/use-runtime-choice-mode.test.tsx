import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChangeEventHandler } from 'react';

test('catalog runtime choices update visible fields and validation', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/'
  });
  const { window } = dom;
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: window },
    document: { configurable: true, value: window.document },
    navigator: { configurable: true, value: window.navigator },
    HTMLElement: { configurable: true, value: window.HTMLElement },
    Element: { configurable: true, value: window.Element },
    Node: { configurable: true, value: window.Node },
    MutationObserver: { configurable: true, value: window.MutationObserver },
    getComputedStyle: { configurable: true, value: window.getComputedStyle },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
  });
  window.matchMedia = (media) => ({
    matches: false,
    media,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false
  });

  const React = await import('react');
  const { act } = React;
  const { createRoot } = await import('react-dom/client');
  const { Form } = await import('antd');
  const { useRuntimeChoiceMode } = await import('./use-runtime-choice-mode');
  const container = window.document.getElementById('root')!;
  const root = createRoot(container);
  let formInstance!: ReturnType<typeof Form.useForm>[0];
  const InputField = ({
    value,
    onChange,
    label
  }: {
    value?: string | null;
    onChange?: ChangeEventHandler<HTMLInputElement>;
    label: string;
  }) => <input aria-label={label} value={value ?? ''} onChange={onChange} />;
  const TextareaField = ({
    value,
    onChange
  }: {
    value?: string | null;
    onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  }) => <textarea aria-label="命令" value={value ?? ''} onChange={onChange} />;

  const Harness = () => {
    const [form] = Form.useForm();
    formInstance = form;
    const { imageModePicked, setImageModePicked, applyRuntimeChoice } =
      useRuntimeChoiceMode(form);
    const imageName = Form.useWatch('image_name', form);
    const backendVersion = Form.useWatch('backend_version', form);
    const isImageMode = !backendVersion && (imageModePicked || !!imageName);

    return (
      <Form form={form}>
        <button type="button" onClick={() => setImageModePicked(true)}>
          使用自定义镜像
        </button>
        <Form.Item
          name="image_name"
          hidden={!isImageMode}
          rules={isImageMode ? [{ required: true }] : undefined}
        >
          <InputField label="镜像" />
        </Form.Item>
        <Form.Item name="backend_version" hidden={isImageMode}>
          <InputField label="版本" />
        </Form.Item>
        <Form.Item name="run_command" hidden={!isImageMode}>
          <TextareaField />
        </Form.Item>
        <button
          type="button"
          onClick={() =>
            applyRuntimeChoice({
              image_name: null,
              backend_version: null,
              run_command: null
            })
          }
        >
          回填 Auto
        </button>
        <button
          type="button"
          onClick={() =>
            applyRuntimeChoice({
              image_name: null,
              backend_version: '0.5.9',
              run_command: null
            })
          }
        >
          回填固定版本
        </button>
        <button
          type="button"
          onClick={() =>
            applyRuntimeChoice({
              image_name: 'catalog/sglang:dev',
              backend_version: null,
              run_command: '--model-path {{model_path}}'
            })
          }
        >
          回填镜像
        </button>
      </Form>
    );
  };

  const isVisible = (selector: string) => {
    let element = container.querySelector(selector) as HTMLElement | null;
    while (element && element !== container) {
      if (window.getComputedStyle(element).display === 'none') {
        return false;
      }
      element = element.parentElement;
    }
    return true;
  };

  try {
    await act(async () => root.render(<Harness />));
    await act(async () => {
      container.querySelector('button')!.click();
    });
    assert.equal(isVisible('[aria-label="镜像"]'), true);

    const imageInput =
      container.querySelector<HTMLInputElement>('[aria-label="镜像"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!.call(imageInput, 'custom/sglang:dev');
      imageInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    assert.equal(formInstance.getFieldValue('image_name'), 'custom/sglang:dev');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === '回填 Auto')!
        .click();
    });

    assert.equal(isVisible('[aria-label="镜像"]'), false);
    assert.equal(isVisible('[aria-label="版本"]'), true);
    assert.deepEqual(
      formInstance.getFieldsValue([
        'image_name',
        'backend_version',
        'run_command'
      ]),
      { image_name: null, backend_version: null, run_command: null }
    );
    await act(async () => {
      await formInstance.validateFields();
    });

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === '回填固定版本')!
        .click();
    });
    assert.equal(isVisible('[aria-label="镜像"]'), false);
    assert.equal(isVisible('[aria-label="版本"]'), true);
    assert.deepEqual(
      formInstance.getFieldsValue([
        'image_name',
        'backend_version',
        'run_command'
      ]),
      { image_name: null, backend_version: '0.5.9', run_command: null }
    );

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === '回填镜像')!
        .click();
    });
    assert.equal(isVisible('[aria-label="镜像"]'), true);
    assert.equal(isVisible('[aria-label="版本"]'), false);
    assert.deepEqual(
      formInstance.getFieldsValue([
        'image_name',
        'backend_version',
        'run_command'
      ]),
      {
        image_name: 'catalog/sglang:dev',
        backend_version: null,
        run_command: '--model-path {{model_path}}'
      }
    );
    await act(async () => {
      await formInstance.validateFields();
    });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
