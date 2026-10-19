import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, createRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const InputField = ({ value, onChange, label, labelExtra }: any) =>
  createElement(
    'label',
    null,
    labelExtra,
    createElement('input', {
      'aria-label': label,
      value: value ?? '',
      onChange
    })
  );
mock.module('@gpustack/core-ui', {
  namedExports: {
    Input: { Input: InputField },
    Select: ({ footer }: any) => createElement('div', null, footer),
    Textarea: ({ value, onChange, label, placeholder }: any) =>
      createElement('textarea', {
        'aria-label': label,
        value: value ?? '',
        onChange,
        placeholder
      }),
    TextAttribute: empty,
    ThemeTag: empty,
    TooltipList: empty,
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) => values?.content ?? id
    }),
    useNavigate: () => empty
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: { backendTipsList: [] }
});
mock.module(new URL('../envs-override-popover.tsx', import.meta.url).href, {
  defaultExport: empty
});

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Element: { configurable: true, value: dom.window.Element },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
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

const { Form } = await import('antd');
const { FormContext } = await import('../../config/form-context.ts');
const { default: BackendFields } = await import('../backend.tsx');

for (const backend of ['vLLM', 'SGLang']) {
  for (const nested of [false, true]) {
    for (const savedCommand of [null, '', '--custom-command']) {
      test(`${backend} custom image command placeholder (${nested ? 'nested' : 'model'}, ${JSON.stringify(savedCommand)})`, async () => {
        const container = dom.window.document.getElementById('root')!;
        const root = createRoot(container);
        const namePrefix = nested ? ['roles', 0] : undefined;
        const path = (field: string) => [...(namePrefix || []), field];
        const runtime = {
          backend,
          backend_version: '1.0',
          image_name: null,
          run_command: savedCommand
        };
        const formRef = createRef<FormInstance>();
        const Harness = () => {
          const [form] = Form.useForm();
          const [imageModePicked, setImageModePicked] = useState(false);
          return createElement(
            Form,
            {
              form,
              ref: formRef,
              preserve: false,
              initialValues: nested
                ? { ...runtime, run_command: 'model command', roles: [runtime] }
                : runtime
            },
            createElement(
              FormContext.Provider,
              {
                value: {
                  backendOptions: [],
                  flatBackendOptions: [],
                  imageModePicked,
                  setImageModePicked
                } as any
              },
              createElement(BackendFields, { namePrefix })
            )
          );
        };
        const click = async (text: string) => {
          const button = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent === text
          );
          assert.ok(button);
          await act(async () => button.click());
        };
        try {
          await act(async () => root.render(createElement(Harness)));
          const form = formRef.current!;
          await click('models.form.customImage.entry');
          const expectedPlaceholder = `${backend === 'SGLang' ? '--model-path ' : ''}{{model_path}} --host {{worker_ip}} --port {{port}} --served-model-name {{model_name}}`;
          const textarea =
            container.querySelector<HTMLTextAreaElement>('textarea')!;
          assert.equal(form.getFieldValue(path('run_command')), savedCommand);
          assert.equal(textarea.value, savedCommand ?? '');
          assert.equal(textarea.placeholder, expectedPlaceholder);
          assert.equal(form.getFieldValue(path('backend_version')), null);
          if (nested) {
            assert.equal(form.getFieldValue('run_command'), 'model command');
            assert.equal(form.getFieldValue('backend_version'), '1.0');
          }

          await act(async () =>
            form.setFieldValue(path('image_name'), 'custom/image:dev')
          );
          await act(async () => {
            const values = await form.validateFields();
            assert.equal(
              nested ? values.roles[0].run_command : values.run_command,
              savedCommand
            );
          });
          await click('models.form.customImage.backToVersion');
          assert.equal(form.getFieldValue(path('run_command')), null);
          assert.equal(form.getFieldValue(path('image_name')), null);
          await click('models.form.customImage.entry');
          assert.equal(form.getFieldValue(path('run_command')), null);
          assert.equal(textarea.value, '');
          assert.equal(textarea.placeholder, expectedPlaceholder);
        } finally {
          await act(async () => root.unmount());
        }
      });
    }
  }
}
