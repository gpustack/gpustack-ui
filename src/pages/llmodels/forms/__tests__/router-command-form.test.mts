import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
mock.module('@gpustack/core-ui', { namedExports: { LabelSelector: empty } });
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
for (const file of ['role-backend', 'override-section']) {
  mock.module(new URL(`../roles/${file}.tsx`, import.meta.url).href, {
    defaultExport: empty
  });
}
mock.module(new URL('../backend-parameters-list.tsx', import.meta.url).href, {
  defaultExport: empty
});
mock.module(new URL('../roles/router-scheduling.tsx', import.meta.url).href, {
  defaultExport: { __esModule: true, default: empty, RouterResources: empty }
});
mock.module(new URL('../roles/system-managed.tsx', import.meta.url).href, {
  defaultExport: {
    __esModule: true,
    default: empty,
    flagLines: (tokens: string[]) => tokens
  }
});
const dom = new JSDOM('<div id="root"></div>');
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'SVGElement',
  'Node',
  'MutationObserver',
  'ShadowRoot',
  'getComputedStyle'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'window' ? dom.window : (dom.window as any)[key]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true
});
dom.window.matchMedia = () =>
  ({
    matches: false,
    addListener() {},
    removeListener() {}
  }) as any;
after(() => dom.window.close());
const { Form } = await import('antd');
const { default: RouterForm } = await import('../roles/router-form.tsx');
const mode = {
  name: 'vllm-nixl',
  display_name: 'NIXL',
  backends: ['vLLM'],
  router: { connection_args: ['--host {{worker_ip}}'], tunable_args: [] }
};
const template = 'router {% for p in prefill %}--peer {{p.url}} {% endfor %}';

for (const initialCommand of [null, template]) {
  test(`Router catalog parameters follow command ownership from ${initialCommand ? 'custom' : 'automatic'}`, async () => {
    const root = createRoot(dom.window.document.getElementById('root')!);
    const ref = createRef<FormInstance>();
    const Harness = () => {
      const [form] = Form.useForm();
      return createElement(
        Form,
        {
          form,
          ref,
          initialValues: {
            roles: [
              {
                name: 'router',
                run_command: initialCommand,
                backend_parameters: ['--own-option value']
              }
            ]
          }
        },
        createElement(RouterForm, { index: 0, mode })
      );
    };
    const paramsPath = ['roles', 0, 'backend_parameters'];
    const commandPath = ['roles', 0, 'run_command'];
    try {
      await act(async () => root.render(createElement(Harness)));
      assert.deepEqual(
        ref.current!.getFieldValue(paramsPath),
        initialCommand
          ? ['--own-option value']
          : ['--host {{worker_ip}}', '--own-option value']
      );
      await act(async () => ref.current!.setFieldValue(commandPath, template));
      assert.deepEqual(ref.current!.getFieldValue(paramsPath), [
        '--own-option value'
      ]);
      assert.equal(
        ref.current!.getFieldValue(['roles', 0, '__injected']),
        undefined
      );
      await act(async () => ref.current!.setFieldValue(commandPath, ''));
      assert.deepEqual(ref.current!.getFieldValue(paramsPath), [
        '--host {{worker_ip}}',
        '--own-option value'
      ]);
    } finally {
      await act(async () => root.unmount());
    }
  });
}

for (const backend of ['vLLM', 'router-custom']) {
  test(`${backend} backend commands own flags and stop recipe parameter seeding`, async () => {
    const { FormContext } = await import('../../config/form-context.ts');
    const root = createRoot(dom.window.document.getElementById('root')!);
    const ref = createRef<FormInstance>();
    const Harness = () => {
      const [form] = Form.useForm();
      return createElement(
        Form,
        {
          form,
          ref,
          initialValues: {
            roles: [
              {
                name: 'router',
                backend,
                backend_parameters: ['--own-option value']
              }
            ]
          }
        },
        createElement(
          FormContext.Provider,
          {
            value: {
              flatBackendOptions: [
                {
                  value: backend,
                  default_run_command: 'router --custom-flags',
                  versions: []
                }
              ]
            } as any
          },
          createElement(RouterForm, { index: 0, mode })
        )
      );
    };
    try {
      await act(async () => root.render(createElement(Harness)));
      assert.deepEqual(
        ref.current!.getFieldValue(['roles', 0, 'backend_parameters']),
        ['--own-option value']
      );
      await act(async () =>
        ref.current!.setFieldValue(['roles', 0, 'backend'], null)
      );
      assert.deepEqual(
        ref.current!.getFieldValue(['roles', 0, 'backend_parameters']),
        ['--host {{worker_ip}}', '--own-option value']
      );
    } finally {
      await act(async () => root.unmount());
    }
  });
}
