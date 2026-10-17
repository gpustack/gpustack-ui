import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';

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
    value: key === 'window' ? dom.window : dom.window[key]
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

const empty = () => null;
const { createRoot } = await import('react-dom/client');
const { Form, InputNumber } = await import('antd');
const fields = new Map<string, any>();
const NumberField = ({ label, checkStatus: _checkStatus, ...props }: any) => {
  if (typeof label === 'string') fields.set(label, props);
  return createElement(InputNumber, {
    ...props,
    'aria-label': typeof label === 'string' ? label : undefined
  });
};
mock.module('@gpustack/core-ui', {
  namedExports: {
    InputNumber: NumberField,
    Select: empty,
    CollapsePanel: ({ items }: any) =>
      createElement(
        Fragment,
        null,
        items.map((item: any) =>
          createElement(Fragment, { key: item.key }, item.children)
        )
      ),
    MetadataList: ({ dataList = [], children }: any) =>
      createElement(
        Fragment,
        null,
        dataList.map((item: any, index: number) =>
          createElement(Fragment, { key: index }, children(item, index))
        )
      ),
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ messages: {}, formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit' },
    StatusMaps: {}
  }
});
mock.module(
  new URL('../../components/distribution-chart.tsx', import.meta.url).href,
  {
    defaultExport: empty
  }
);
mock.module(new URL('../../config/form-context.ts', import.meta.url).href, {
  namedExports: {
    useFormContext: () => ({
      action: 'create',
      profilesOptions: [],
      groupKeys: ['load'],
      onGroupChange() {}
    })
  }
});

const { default: RandomSettingsForm } = await import('../random-settings.tsx');

async function renderLoadForm(loadType = 'fixed_rate', autoTune = true) {
  fields.clear();
  let form: any;
  const root = createRoot(dom.window.document.getElementById('root')!);
  function Harness() {
    [form] = Form.useForm();
    return createElement(
      Form,
      {
        form,
        initialValues: {
          profile: 'Custom',
          dataset_name: 'Random',
          load_type: loadType,
          auto_tune: autoTune,
          lower_bound: 1,
          upper_bound: 2,
          stages: [{ rate: 1, max_requests: 10 }]
        }
      },
      createElement(
        Form.Item,
        { name: 'profile', hidden: true },
        createElement('input')
      ),
      createElement(RandomSettingsForm, { datasetList: [] })
    );
  }
  await act(async () => root.render(createElement(Harness)));
  return {
    form,
    set: async (values: any) => act(async () => form.setFieldsValue(values)),
    unmount: async () => act(async () => root.unmount())
  };
}

test('automatic request-rate bounds require positive integers', async () => {
  const view = await renderLoadForm();
  try {
    for (const label of ['rateFrom', 'rateTo']) {
      const props = fields.get(`benchmark.form.autoTune.${label}`);
      assert.equal(props.min, 1);
      assert.equal(props.step, 1);
      assert.equal(props.precision, 0);
    }
    await view.set({ lower_bound: 4, upper_bound: 8192 });
    let values: any;
    await act(async () => {
      values = await view.form.validateFields(['lower_bound', 'upper_bound']);
    });
    assert.equal(values.lower_bound, 4);
    assert.equal(values.upper_bound, 8192);
    for (const bounds of [
      { lower_bound: 0.1, upper_bound: 8192 },
      { lower_bound: 4, upper_bound: 4.5 },
      { lower_bound: 0.001, upper_bound: 0.5 }
    ]) {
      await view.set(bounds);
      await act(async () =>
        assert.rejects(view.form.validateFields(['lower_bound', 'upper_bound']))
      );
    }
  } finally {
    await view.unmount();
  }
});

test('manual request-rate stages accept and retain sub-one values', async () => {
  const view = await renderLoadForm('fixed_rate', false);
  try {
    const props = fields.get('benchmark.form.rate');
    assert.ok(props.min === undefined || props.min < 0.001);
    assert.equal(props.step, 1);
    await view.set({
      stages: [
        { rate: 0.1, max_requests: 10 },
        { rate: 0.5, max_seconds: 60 }
      ]
    });
    let values: any;
    await act(async () => {
      values = await view.form.validateFields(['stages']);
    });
    assert.deepEqual(
      values.stages.map((stage: any) => stage.rate),
      [0.1, 0.5]
    );
  } finally {
    await view.unmount();
  }
});

for (const [autoTune, label, field] of [
  [true, 'benchmark.form.autoTune.rateFrom', 'lower_bound'],
  [true, 'benchmark.form.autoTune.rateTo', 'upper_bound'],
  [false, 'benchmark.form.rate', 'stages']
] as const) {
  test(`${field} displays integers and steps by one${autoTune ? '' : ' while retaining fractions'}`, async () => {
    const view = await renderLoadForm('fixed_rate', autoTune);
    try {
      const setValue = async (value: number) =>
        view.set({
          [field]:
            field === 'stages' ? [{ rate: value, max_requests: 10 }] : value
        });
      const input = dom.window.document.querySelector<HTMLInputElement>(
        `input[aria-label="${label}"]`
      );
      assert.ok(input);
      const step = async (direction: 'Increase' | 'Decrease') => {
        const button = input
          .closest('.ant-input-number')
          ?.querySelector(`[aria-label="${direction} Value"]`);
        assert.ok(button);
        await act(async () => {
          button.dispatchEvent(
            new dom.window.MouseEvent('mousedown', { bubbles: true })
          );
          button.dispatchEvent(
            new dom.window.MouseEvent('mouseup', { bubbles: true })
          );
        });
      };

      const initial = field === 'upper_bound' ? 8192 : 4;
      await setValue(initial);
      assert.equal(input.value, String(initial));
      await step('Increase');
      assert.equal(input.value, String(initial + 1));
      await step('Decrease');
      assert.equal(input.value, String(initial));

      if (!autoTune) {
        await act(async () => {
          const setInputValue = Object.getOwnPropertyDescriptor(
            dom.window.HTMLInputElement.prototype,
            'value'
          )!.set!;
          setInputValue.call(input, '0.001');
          input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
          input.blur();
        });
        assert.equal(input.value, '0.001');
        await step('Increase');
        assert.equal(input.value, '1.001');
      }
    } finally {
      await view.unmount();
    }
  });
}

test('automatic bounds reject non-positive and inverted ranges', async () => {
  const view = await renderLoadForm();
  try {
    for (const values of [
      { lower_bound: 0, upper_bound: 8192 },
      { lower_bound: -1, upper_bound: 8192 },
      { lower_bound: 4, upper_bound: 2 },
      { lower_bound: 4, upper_bound: 4 }
    ]) {
      await view.set(values);
      await act(async () =>
        assert.rejects(view.form.validateFields(['lower_bound', 'upper_bound']))
      );
    }
  } finally {
    await view.unmount();
  }
});

test('manual stages reject non-positive rates and fractional concurrency', async () => {
  for (const loadType of ['fixed_rate', 'concurrency']) {
    const view = await renderLoadForm(loadType, false);
    try {
      const invalid = loadType === 'fixed_rate' ? [0, -0.1] : [0, 0.1, 1.5];
      for (const rate of invalid) {
        await view.set({ stages: [{ rate, max_requests: 10 }] });
        await act(async () =>
          assert.rejects(view.form.validateFields(['stages']))
        );
      }
    } finally {
      await view.unmount();
    }
  }
});

test('concurrency inputs and automatic bounds require whole streams', async () => {
  const view = await renderLoadForm('concurrency');
  try {
    const props = fields.get('benchmark.form.autoTune.concFrom');
    assert.equal(props.min, 1);
    assert.equal(props.precision, 0);
    assert.equal(props.step, 1);
    await view.set({ lower_bound: 0.5, upper_bound: 2 });
    await act(async () =>
      assert.rejects(view.form.validateFields(['lower_bound', 'upper_bound']))
    );
    await view.set({ lower_bound: 1, upper_bound: 2.5 });
    await act(async () =>
      assert.rejects(view.form.validateFields(['lower_bound', 'upper_bound']))
    );
  } finally {
    await view.unmount();
  }
});
