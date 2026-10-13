import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { act, createElement } from 'react';
import type { CacheProviderL2Backend } from '../../config/types';

// Keep the real Form store; replace presentation controls with native inputs.
const Input = ({ value, onChange, label }: any) =>
  createElement('input', { value: value ?? '', onChange, 'aria-label': label });
mock.module('@gpustack/core-ui', {
  namedExports: {
    CheckboxField: ({ checked, onChange, label }: any) => {
      assert.equal(typeof checked, 'boolean');
      return createElement('input', {
        type: 'checkbox',
        checked,
        onChange,
        'aria-label': label
      });
    },
    Input: { Input, Password: Input },
    InputNumber: Input,
    Select: Input,
    CollapseContainer: ({ children }: any) => children,
    useAppUtils: () => ({ getRuleMessage: () => 'Required' })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
    getLocale: () => 'en-US'
  }
});
mock.module(new URL('../styled.tsx', import.meta.url).href, {
  namedExports: {
    EntryTitle: 'span',
    GroupTips: 'div',
    GroupTitle: 'div',
    OptionWithIcon: () => null
  }
});
mock.module(new URL('../utils.ts', import.meta.url).href, {
  namedExports: { humanizeFieldName: (name: string) => name }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  Element: { configurable: true, value: dom.window.Element },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
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
const { createRoot } = await import('react-dom/client');
const { Form } = await import('antd');
const { default: L2Storages } = await import('../l2-storages.tsx');
let root: ReturnType<typeof createRoot>;
afterEach(async () => {
  await act(async () => root?.unmount());
});

const mount = async (
  params: Record<string, any>,
  defaultValue: boolean | null | undefined
) => {
  const container = dom.window.document.getElementById('root')!;
  root = createRoot(container);
  let form!: FormInstance;
  const backend: CacheProviderL2Backend = {
    fields: [
      {
        name: 'auto_cleanup',
        label: 'Automatic Cleanup',
        type: 'boolean',
        default: defaultValue
      }
    ]
  };
  const submitted: any[] = [];
  const Harness = () => {
    [form] = Form.useForm();
    return createElement(
      Form,
      { form, onFinish: (values) => submitted.push(values) },
      createElement(L2Storages, { form, l2Backends: { fs_native: backend } })
    );
  };
  await act(async () => root.render(createElement(Harness)));
  // Editing hydrates the form with saved params after the form is mounted.
  await act(async () => {
    form.setFieldsValue({
      config: { l2_storages: [{ backend: 'fs_native', params }] }
    });
  });
  const checkbox = container.querySelector<HTMLInputElement>(
    'input[aria-label="Automatic Cleanup"]'
  )!;
  assert.ok(checkbox);
  const submit = async () => {
    await act(async () => form.submit());
    return submitted.at(-1).config.l2_storages[0].params;
  };
  return { checkbox, submit };
};

for (const [name, params, defaultValue, expected] of [
  ['missing value uses enabled default', {}, true, true],
  [
    'saved false overrides enabled default',
    { auto_cleanup: false },
    true,
    false
  ],
  [
    'saved true overrides disabled default',
    { auto_cleanup: true },
    false,
    true
  ],
  ['saved null skips the enabled default', { auto_cleanup: null }, true, false],
  ['missing value with a null default is unchecked', {}, null, false],
  ['missing value uses disabled default', {}, false, false],
  ['missing value without a default is unchecked', {}, undefined, false]
] as const) {
  test(name, async () => {
    const { checkbox, submit } = await mount(params, defaultValue);
    assert.equal(checkbox.checked, expected);
    const saved = await submit();
    // Displaying a default leaves an untouched value for the server to resolve.
    assert.equal(
      saved.auto_cleanup,
      'auto_cleanup' in params ? params.auto_cleanup : undefined
    );
  });
}

test('turning off a default-enabled field submits false and survives reopening', async () => {
  const { checkbox, submit } = await mount({}, true);
  assert.equal(checkbox.checked, true);
  await act(async () => checkbox.click());
  assert.equal(checkbox.checked, false);
  const saved = await submit();
  assert.equal(saved.auto_cleanup, false);

  await act(async () => root.unmount());
  const reopened = await mount(saved, true);
  assert.equal(reopened.checkbox.checked, false);
  assert.equal((await reopened.submit()).auto_cleanup, false);
});
