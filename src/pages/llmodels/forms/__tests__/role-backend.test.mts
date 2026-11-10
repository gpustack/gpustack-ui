import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, createRef, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
let useRealSelect = false;
let realSelect: any;
const copiedCommands: string[] = [];
const field = ({ value, onChange, label, placeholder, description }: any) =>
  createElement(
    Fragment,
    null,
    createElement('input', {
      'aria-label': label,
      value: value ?? '',
      onChange,
      placeholder
    }),
    description &&
      createElement('span', { 'data-command-help': true }, description)
  );
const backends = ['vLLM', 'SGLang', 'Custom', 'my-router'].map((value) => ({
  label: value === 'my-router' ? 'Friendly router' : value,
  title: value === 'my-router' ? 'Friendly router' : value,
  value,
  isBuiltIn: value !== 'my-router',
  versions: [{ value: '1.0', label: '1.0' }]
}));
const flatten = (options: any[]): any[] =>
  options.flatMap((option) =>
    option.options ? flatten(option.options) : [option]
  );
mock.module('@gpustack/core-ui', {
  namedExports: {
    CopyButton: ({ text, btnText }: any) =>
      createElement(
        'button',
        {
          onClick: () => copiedCommands.push(text)
        },
        btnText
      ),
    HighlightCode: ({ code }: any) => createElement('pre', null, code),
    useCoreUIContext: () => ({ config: { theme: 'light' } }),
    Input: { Input: field },
    Textarea: field,
    Select: (props: any) => {
      const {
        value,
        onChange,
        options,
        label,
        footer,
        optionRender,
        labelRender
      } = props;
      if (useRealSelect)
        return createElement(realSelect, {
          value,
          onChange,
          options,
          optionRender,
          labelRender,
          open: true,
          virtual: false
        });
      return createElement(
        Fragment,
        null,
        createElement(
          'select',
          {
            'aria-label': label,
            value: value ?? '',
            onChange: (event: any) => {
              const value = event.target.value || null;
              onChange(
                value,
                flatten(options || []).find(
                  (option) => option.value === value
                ) || {}
              );
            }
          },
          !options?.length && createElement('option', { value: '' }, 'Auto'),
          flatten(options || []).map((option, index) => {
            optionRender?.(
              { data: option, value: option.value, label: option.label },
              { index }
            );
            return createElement(
              'option',
              {
                key: option.value,
                value: option.value
              },
              option.label
            );
          })
        ),
        footer
      );
    },
    TextAttribute: empty,
    ThemeTag: empty,
    TooltipList: empty,
    AutoTooltip: ({ children }: any) => children,
    LabelInfo: ({ label }: any) => createElement('span', null, label),
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
mock.module(new URL('../envs-override-popover.tsx', import.meta.url).href, {
  defaultExport: empty
});
const dom = new JSDOM('<div id="root"></div>');
const computedStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.getComputedStyle = (element) => computedStyle(element);
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
});
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
const { Form, Input, Select: AntSelect } = await import('antd');
realSelect = AntSelect;
const { FormContext } = await import('../../config/form-context.ts');
const { rolesFormToPayload, rolesSpecToForm } =
  await import('../roles/transform.ts');
const { default: RoleBackend } = await import('../roles/role-backend.tsx');
const parent = {
  backend: 'vLLM',
  backend_version: '1.0',
  image_name: null,
  run_command: null
};

for (const name of ['prefill', 'decode', 'router']) {
  for (const saved of [false, true]) {
    test(`${name} selects inheritance or an independent backend (${saved ? 'edit' : 'create'})`, async () => {
      const container = dom.window.document.getElementById('root')!;
      const root = createRoot(container);
      const ref = createRef<FormInstance>();
      const Harness = () => {
        const [form] = Form.useForm();
        const [imageModePicked, setImageModePicked] = useState(false);
        return createElement(
          Form,
          {
            form,
            ref,
            preserve: false,
            initialValues: {
              ...parent,
              roles: rolesSpecToForm([
                {
                  name,
                  replicas: 1,
                  ...(saved
                    ? {
                        backend: 'Custom',
                        image_name: 'saved:1',
                        run_command: 'saved-command'
                      }
                    : {})
                }
              ])
            }
          },
          createElement(
            FormContext.Provider,
            {
              value: {
                backendOptions: [
                  { label: 'Backends', value: 'backends', options: backends }
                ],
                flatBackendOptions: backends,
                imageModePicked,
                setImageModePicked
              } as any
            },
            ...Object.keys(parent).map((key) =>
              createElement(
                Form.Item,
                { key, name: key, hidden: true },
                createElement(Input)
              )
            ),
            createElement(RoleBackend, { index: 0 })
          )
        );
      };
      try {
        await act(async () => root.render(createElement(Harness)));
        const form = ref.current!;
        const selector = () =>
          container.querySelector<HTMLSelectElement>(
            'select[aria-label="models.form.backend"]'
          )!;
        const inheritOption = () =>
          Array.from(selector().options).find((option) =>
            option.textContent?.includes('models.form.roles.backend.inherit')
          )!;
        const choose = async (value: string) => {
          selector().value = value;
          await act(async () =>
            selector().dispatchEvent(
              new dom.window.Event('change', { bubbles: true })
            )
          );
        };
        assert.ok(selector());
        assert.ok(inheritOption());
        assert.equal(container.querySelector('[role="switch"]'), null);
        if (saved) {
          assert.equal(selector().value, 'Custom');
          assert.equal(
            form.getFieldValue(['roles', 0, 'run_command']),
            'saved-command'
          );
          await choose(inheritOption().value);
          for (const key of Object.keys(parent))
            assert.equal(form.getFieldValue(['roles', 0, key]), null);
        }
        assert.equal(selector().value, inheritOption().value);
        assert.equal(container.querySelectorAll('select').length, 1);
        assert.match(inheritOption().textContent!, /vLLM.*1\.0/);
        await act(async () => form.setFieldValue('backend_version', '2.0'));
        assert.match(inheritOption().textContent!, /vLLM.*2\.0/);
        await act(async () => {
          await form.validateFields();
        });
        const inheritedPayload = rolesFormToPayload(
          form.getFieldValue('roles'),
          form.getFieldsValue(true)
        )![0];
        for (const key of Object.keys(parent))
          assert.equal((inheritedPayload as any)[key], null);

        await choose('vLLM');
        assert.equal(form.getFieldValue(['roles', 0, 'backend']), 'vLLM');
        assert.equal(
          form.getFieldValue(['roles', 0, 'backend_version']),
          '2.0'
        );
        assert.equal(container.querySelectorAll('select').length, 2);
        assert.equal(
          rolesFormToPayload(
            form.getFieldValue('roles'),
            form.getFieldsValue(true)
          )![0].backend,
          'vLLM'
        );
        await act(async () => form.setFieldValue('backend_version', '3.0'));
        assert.equal(
          form.getFieldValue(['roles', 0, 'backend_version']),
          '2.0'
        );

        await choose('Custom');
        assert.equal(container.querySelectorAll('select').length, 1);
        assert.ok(container.querySelector('[aria-label="backend.imageName"]'));
        assert.ok(container.querySelector('[aria-label="backend.runCommand"]'));
        await act(async () =>
          form.setFieldsValue({
            roles: [
              {
                ...form.getFieldValue(['roles', 0]),
                image_name: 'custom:1',
                run_command: 'custom-command'
              }
            ]
          })
        );
        await choose('my-router');
        assert.equal(form.getFieldValue(['roles', 0, 'image_name']), null);
        assert.equal(form.getFieldValue(['roles', 0, 'run_command']), null);
        assert.equal(form.getFieldValue('backend'), 'vLLM');
        await choose(inheritOption().value);
        const payload = rolesFormToPayload(
          form.getFieldValue('roles'),
          form.getFieldsValue(true)
        )![0];
        for (const key of Object.keys(parent))
          assert.equal((payload as any)[key], null);
        assert.equal(container.querySelectorAll('select').length, 1);
        assert.match(inheritOption().textContent!, /vLLM.*3\.0/);

        await act(async () =>
          form.setFieldsValue({
            backend: 'Custom',
            backend_version: null,
            image_name: 'parent:custom',
            run_command: 'parent-command'
          })
        );
        assert.equal(container.querySelectorAll('select').length, 1);
        assert.match(inheritOption().textContent!, /Custom.*parent:custom/);
        assert.equal(
          container.querySelector('[aria-label="backend.imageName"]'),
          null
        );
        await choose('Custom');
        assert.equal(
          form.getFieldValue(['roles', 0, 'image_name']),
          'parent:custom'
        );
        assert.equal(
          form.getFieldValue(['roles', 0, 'run_command']),
          name === 'router' ? null : 'parent-command'
        );
        await choose(inheritOption().value);
        assert.equal(form.getFieldValue(['roles', 0, 'image_name']), null);
        assert.equal(form.getFieldValue(['roles', 0, 'run_command']), null);
      } finally {
        await act(async () => root.unmount());
      }
    });
  }
}

for (const parentBackend of ['vLLM', 'SGLang', 'Custom', 'my-router']) {
  for (const ownField of ['image_name', 'run_command']) {
    test(`${parentBackend} legacy ${ownField} remains visible and survives reselection`, async () => {
      const container = dom.window.document.getElementById('root')!;
      const root = createRoot(container);
      const ref = createRef<FormInstance>();
      const defaults = {
        ...parent,
        backend: parentBackend,
        ...(parentBackend === 'Custom'
          ? {
              backend_version: null,
              image_name: 'parent:image',
              run_command: 'parent-command'
            }
          : {})
      };
      const role = {
        name: 'router',
        replicas: 1,
        backend: null,
        [ownField]: ownField === 'image_name' ? 'role:image' : 'role-command'
      };
      const Harness = () => {
        const [form] = Form.useForm();
        const [imageModePicked, setImageModePicked] = useState(false);
        return createElement(
          Form,
          {
            form,
            ref,
            preserve: false,
            initialValues: { ...defaults, roles: rolesSpecToForm([role]) }
          },
          createElement(
            FormContext.Provider,
            {
              value: {
                backendOptions: [
                  { label: 'Backends', value: 'backends', options: backends }
                ],
                flatBackendOptions: backends,
                imageModePicked,
                setImageModePicked
              } as any
            },
            ...Object.keys(parent).map((key) =>
              createElement(
                Form.Item,
                { key, name: key, hidden: true },
                createElement(Input)
              )
            ),
            createElement(RoleBackend, { index: 0 })
          )
        );
      };
      try {
        await act(async () => root.render(createElement(Harness)));
        const form = ref.current!;
        const select = container.querySelector<HTMLSelectElement>(
          'select[aria-label="models.form.backend"]'
        )!;
        assert.equal(select.value, parentBackend);
        const imageLabel =
          parentBackend === 'Custom'
            ? 'backend.imageName'
            : 'models.form.customImage';
        const field = container.querySelector<HTMLInputElement>(
          `input[aria-label="${ownField === 'image_name' ? imageLabel : 'backend.runCommand'}"]`
        )!;
        assert.ok(field);
        assert.equal(field.closest('.ant-form-item-hidden'), null);
        assert.equal(field.value, (role as any)[ownField]);
        if (ownField === 'image_name') {
          await assert.rejects(() => form.validateFields());
          await act(async () =>
            form.setFieldValue(['roles', 0, 'run_command'], 'role-router')
          );
        }
        await act(async () => {
          await form.validateFields();
        });
        const first = rolesFormToPayload(
          form.getFieldValue('roles'),
          form.getFieldsValue(true)
        )![0];
        assert.equal(first.backend, null);
        assert.equal((first as any)[ownField], (role as any)[ownField]);
        select.value = parentBackend;
        await act(async () =>
          select.dispatchEvent(
            new dom.window.Event('change', { bubbles: true })
          )
        );
        assert.equal(
          form.getFieldValue(['roles', 0, ownField]),
          (role as any)[ownField]
        );
        assert.equal(form.getFieldValue(['roles', 0, 'backend']), null);
        const inherit = Array.from(select.options).find((option) =>
          option.textContent?.includes('models.form.roles.backend.inherit')
        )!;
        if (parentBackend === 'my-router')
          assert.match(inherit.textContent!, /Friendly router/);
        select.value = inherit.value;
        await act(async () =>
          select.dispatchEvent(
            new dom.window.Event('change', { bubbles: true })
          )
        );
        assert.equal(form.getFieldValue(['roles', 0, ownField]), null);
        assert.equal(container.querySelectorAll('select').length, 1);
      } finally {
        await act(async () => root.unmount());
      }
    });
  }
}

test('the real backend dropdown renders inherited options using Ant Design option data', async () => {
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  const Harness = () => {
    const [form] = Form.useForm();
    const [imageModePicked, setImageModePicked] = useState(false);
    return createElement(
      Form,
      {
        form,
        initialValues: {
          ...parent,
          roles: rolesSpecToForm([{ name: 'router', replicas: 1 }])
        }
      },
      createElement(
        FormContext.Provider,
        {
          value: {
            backendOptions: [
              { label: 'Backends', value: 'backends', options: backends }
            ],
            flatBackendOptions: backends,
            imageModePicked,
            setImageModePicked
          } as any
        },
        ...Object.keys(parent).map((key) =>
          createElement(
            Form.Item,
            { key, name: key, hidden: true },
            createElement(Input)
          )
        ),
        createElement(RoleBackend, { index: 0 })
      )
    );
  };
  try {
    useRealSelect = true;
    await act(async () => root.render(createElement(Harness)));
    const labels = Array.from(
      dom.window.document.querySelectorAll('.ant-select-item-option-content')
    ).map((item) => item.textContent);
    assert.ok(
      labels.some((label) =>
        label?.includes('models.form.roles.backend.inherit')
      )
    );
    assert.ok(labels.includes('vLLM'));
  } finally {
    await act(async () => root.unmount());
    useRealSelect = false;
  }
});

for (const [mode] of [
  ['vllm-nixl', 'vllm-router', 'nixl'],
  ['vllm-ascend-mooncake', 'vllm-router', 'nixl'],
  ['vllm-mooncake', 'vllm-router', 'mooncake'],
  ['sglang-nixl', 'python3 -m sglang_router.launch_router', null],
  ['custom', 'your-router', null]
] as const) {
  for (const backend of ['Custom', 'vLLM']) {
    test(`${mode} ${backend} Router command help describes its actual launch contract`, async () => {
      const container = dom.window.document.getElementById('root')!;
      const root = createRoot(container);
      const ref = createRef<FormInstance>();
      const Harness = () => {
        const [form] = Form.useForm();
        const [imageModePicked, setImageModePicked] = useState(false);
        return createElement(
          Form,
          {
            form,
            ref,
            preserve: false,
            initialValues: {
              ...parent,
              disaggregation: { mode },
              roles: rolesSpecToForm([
                {
                  name: 'router',
                  replicas: 1,
                  backend,
                  backend_version: null,
                  image_name: 'vllm/vllm-router:v0.1.16.1',
                  run_command: null
                }
              ])
            }
          },
          createElement(
            FormContext.Provider,
            {
              value: {
                backendOptions: [
                  { label: 'Backends', value: 'backends', options: backends }
                ],
                flatBackendOptions: backends,
                imageModePicked,
                setImageModePicked
              } as any
            },
            ...Object.keys(parent).map((key) =>
              createElement(
                Form.Item,
                { key, name: key, hidden: true },
                createElement(Input)
              )
            ),
            createElement(RoleBackend, { index: 0 })
          )
        );
      };
      try {
        await act(async () => root.render(createElement(Harness)));
        const input = container.querySelector<HTMLInputElement>(
          'input[aria-label="backend.runCommand"]'
        )!;
        if (mode !== 'custom') {
          assert.equal(
            input.placeholder,
            'models.form.roles.router.command.auto.placeholder'
          );
          assert.ok(!input.placeholder.includes('<prefill-ip>'));
        } else {
          assert.equal(
            input.placeholder,
            'models.form.roles.router.command.custom.placeholder'
          );
          assert.ok(!input.placeholder.includes('{{model_path}}'));
        }
        assert.ok(
          container.textContent?.includes(
            `models.form.roles.router.command.${mode !== 'custom' ? 'managed' : backend === 'Custom' ? 'custom' : 'manual'}.tips`
          )
        );
        assert.equal(
          ref.current!.getFieldValue(['roles', 0, 'run_command']),
          null
        );
        if (mode === 'custom') {
          await assert.rejects(async () => {
            await act(async () => {
              await ref.current!.validateFields();
            });
          });
        } else {
          await act(async () => {
            await ref.current!.validateFields();
          });
        }
      } finally {
        await act(async () => root.unmount());
      }
    });
  }
}

for (const [name, mode, backend] of [
  ['router', 'vllm-nixl', 'vLLM'],
  ['router', 'vllm-mooncake', 'vLLM'],
  ['router', 'vllm-ascend-mooncake', 'vLLM'],
  ['router', 'vllm-nixl', 'Custom'],
  ['router', 'sglang-nixl', 'SGLang'],
  ['router', 'sglang-mooncake', 'SGLang'],
  ['router', 'custom', 'vLLM'],
  ['prefill', 'vllm-nixl', 'vLLM'],
  ['decode', 'vllm-nixl', 'vLLM']
] as const) {
  test(`${mode} ${name} initializes its own effective command when selecting the parent backend`, async () => {
    const root = createRoot(dom.window.document.getElementById('root')!);
    const ref = createRef<FormInstance>();
    const defaults = {
      ...parent,
      backend,
      backend_version: null,
      image_name: 'parent:engine',
      run_command: 'engine --model {{model_path}} --port {{port}}'
    };
    const managedRouter = name === 'router';
    const Harness = () => {
      const [form] = Form.useForm();
      const [imageModePicked, setImageModePicked] = useState(false);
      return createElement(
        Form,
        {
          form,
          ref,
          preserve: false,
          initialValues: {
            ...defaults,
            disaggregation: { mode },
            roles: rolesSpecToForm([{ name, replicas: 1 }])
          }
        },
        createElement(
          FormContext.Provider,
          {
            value: {
              backendOptions: [
                { label: 'Backends', value: 'backends', options: backends }
              ],
              flatBackendOptions: backends,
              imageModePicked,
              setImageModePicked
            } as any
          },
          ...Object.keys(defaults).map((key) =>
            createElement(
              Form.Item,
              { key, name: key, hidden: true },
              createElement(Input)
            )
          ),
          createElement(RoleBackend, { index: 0 })
        )
      );
    };
    const selectBackend = async () => {
      const selector = dom.window.document.querySelector<HTMLSelectElement>(
        'select[aria-label="models.form.backend"]'
      )!;
      selector.value = backend;
      await act(async () =>
        selector.dispatchEvent(
          new dom.window.Event('change', { bubbles: true })
        )
      );
    };
    try {
      await act(async () => root.render(createElement(Harness)));
      await selectBackend();
      const form = ref.current!;
      assert.equal(
        form.getFieldValue(['roles', 0, 'image_name']),
        defaults.image_name
      );
      assert.equal(
        form.getFieldValue(['roles', 0, 'run_command']),
        managedRouter ? null : defaults.run_command
      );
      await act(async () => {
        form.setFieldValue(['roles', 0, 'image_name'], 'role:router');
        if (mode !== 'custom') await form.validateFields();
      });
      const payload = rolesFormToPayload(
        form.getFieldValue('roles'),
        form.getFieldsValue(true)
      )![0];
      assert.equal(payload.backend, backend);
      assert.equal(payload.image_name, 'role:router');
      assert.equal(
        payload.run_command,
        managedRouter ? null : defaults.run_command
      );
      assert.equal(form.getFieldValue('run_command'), defaults.run_command);
      const ownCommand = 'own-server --port {{port}}';
      await act(async () =>
        form.setFieldValue(['roles', 0, 'run_command'], ownCommand)
      );
      await selectBackend();
      assert.equal(form.getFieldValue(['roles', 0, 'run_command']), ownCommand);
    } finally {
      await act(async () => root.unmount());
    }
  });
}

test('Router help separates copyable mode examples from the variable reference', async () => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  const Harness = () => {
    const [form] = Form.useForm();
    return createElement(
      Form,
      {
        form,
        initialValues: {
          ...parent,
          disaggregation: { mode: 'sglang-nixl' },
          roles: rolesSpecToForm([
            {
              name: 'router',
              replicas: 1,
              backend: 'Custom',
              image_name: 'upstream:router'
            }
          ])
        }
      },
      createElement(
        FormContext.Provider,
        {
          value: {
            backendOptions: [
              { label: 'Backends', value: 'backends', options: backends }
            ],
            flatBackendOptions: backends
          } as any
        },
        createElement(RoleBackend, { index: 0 })
      )
    );
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    const findButton = (label: string) =>
      Array.from(dom.window.document.querySelectorAll('button')).find(
        (button) => button.textContent?.includes(label)
      )!;
    const trigger = findButton('models.form.roles.router.command.help');
    assert.ok(
      trigger,
      'a visible template help action appears below the field'
    );
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    await act(async () => trigger.click());
    const dialog = dom.window.document.querySelector('[role="dialog"]')!;
    assert.ok(dialog);
    const blocks = Array.from(dialog.querySelectorAll('pre'));
    assert.equal(blocks.length, 2);
    const example = blocks[0].textContent!;
    assert.ok(example.startsWith('python3 -m sglang_router.launch_router'));
    assert.ok(example.includes('{% for p in prefill %}'));
    assert.ok(example.includes('--prefill {{p.url}} {{p.ports.bootstrap}}'));
    assert.ok(example.includes('--decode {{d.url}}'));
    assert.ok(!example.includes('router_args'));
    const buttons = Array.from(dialog.querySelectorAll('button')).filter(
      (button) =>
        button.textContent?.includes('models.form.roles.router.command.copy')
    );
    assert.equal(buttons.length, 2);
    await act(async () => buttons[0].click());
    assert.equal(copiedCommands.at(-1), example);
    await act(async () => buttons[1].click());
    assert.equal(copiedCommands.at(-1), blocks[1].textContent);
    assert.ok(copiedCommands.at(-1)!.includes("{{prefill_urls | join(',')}}"));
    const referenceTab = Array.from(
      dialog.querySelectorAll<HTMLElement>('[role="tab"]')
    ).find((tab) =>
      tab.textContent?.includes('models.form.roles.router.command.variables')
    )!;
    await act(async () => referenceTab.click());
    const reference = dialog.querySelector(
      '[role="tabpanel"][aria-hidden="false"]'
    )!;
    for (const value of [
      '{{worker_ip}}',
      '{{port}}',
      '{{p.url}}',
      '{{p.ports.bootstrap}}',
      'prefill_urls',
      'decode_urls',
      '{% for p in prefill %}{{p.url}} {% endfor %}',
      "{{prefill_urls | join(',')}}"
    ])
      assert.ok(reference.textContent?.includes(value));
  } finally {
    await act(async () => root.unmount());
  }
});

for (const backend of ['vLLM', 'SGLang', 'my-router']) {
  test(`${backend} Router exposes backend command source and accepts an explicit override`, async () => {
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    const ref = createRef<FormInstance>();
    const definitions = backends.map((item) =>
      item.value === backend
        ? {
            ...item,
            default_command_version: '1.0',
            default_run_command: 'default-router --port {{port}}',
            versions: [
              {
                value: '1.0',
                label: '1.0',
                run_command: 'version-router --port {{port}}'
              },
              { value: '2.0', label: '2.0' }
            ]
          }
        : item
    );
    const Harness = () => {
      const [form] = Form.useForm();
      return createElement(
        Form,
        {
          form,
          ref,
          initialValues: {
            ...parent,
            run_command: 'parent-engine',
            disaggregation: { mode: 'custom' },
            roles: rolesSpecToForm([
              {
                name: 'router',
                backend,
                backend_version: null,
                run_command: null
              }
            ])
          }
        },
        createElement(
          FormContext.Provider,
          {
            value: {
              flatBackendOptions: definitions,
              backendOptions: [
                { label: 'Backends', value: 'backends', options: definitions }
              ]
            } as any
          },
          createElement(RoleBackend, { index: 0 })
        )
      );
    };
    const source = () => container.textContent || '';
    try {
      await act(async () => root.render(createElement(Harness)));
      assert.ok(
        source().includes(
          'models.form.roles.router.command.source.backend_version'
        )
      );
      const input = container.querySelector<HTMLInputElement>(
        'input[aria-label="backend.runCommand"]'
      )!;
      assert.ok(input && !input.closest('.ant-form-item-hidden'));
      await act(async () => {
        await ref.current!.validateFields();
      });
      assert.equal(
        ref.current!.getFieldValue(['roles', 0, 'run_command']),
        null
      );
      await act(async () =>
        ref.current!.setFieldValue(['roles', 0, 'backend_version'], '2.0')
      );
      assert.ok(
        source().includes(
          'models.form.roles.router.command.source.backend_default'
        )
      );
      await act(async () =>
        ref.current!.setFieldValue(['roles', 0, 'run_command'], 'own-router')
      );
      assert.ok(
        source().includes('models.form.roles.router.command.source.role')
      );
      assert.equal(
        rolesFormToPayload(
          ref.current!.getFieldValue('roles'),
          ref.current!.getFieldsValue(true)
        )![0].run_command,
        'own-router'
      );
      assert.equal(ref.current!.getFieldValue('run_command'), 'parent-engine');
    } finally {
      await act(async () => root.unmount());
    }
  });
}
