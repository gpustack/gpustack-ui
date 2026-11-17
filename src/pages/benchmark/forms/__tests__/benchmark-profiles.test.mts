import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, Children, createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
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
const { createRoot } = await import('react-dom/client');
const antd = await import('antd');
const { Form } = antd;
const { default: _default, ...antdExports } = antd;
mock.module('antd', {
  namedExports: {
    ...antdExports,
    Tooltip: ({ title, children }: any) =>
      createElement(
        'span',
        {
          'data-help':
            title == null
              ? ''
              : renderToStaticMarkup(createElement('span', null, title))
        },
        children
      )
  }
});
const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const controls = new Map<string, any>();
const Input = ({ label, id, value, onChange }: any) => {
  controls.set(label, { id, value, onChange });
  return createElement('input', { id, value: value ?? '', readOnly: true });
};
const Select = ({
  label,
  id,
  value,
  onChange,
  disabled,
  options,
  children
}: any) => {
  controls.set(label, { id, value, onChange, disabled });
  const items =
    options ?? Children.toArray(children).map((child: any) => child.props);
  return createElement(
    'select',
    {
      id,
      value: value ?? '',
      disabled,
      onChange: (event: any) => onChange(event.target.value)
    },
    items.map((item: any) =>
      createElement(
        'option',
        {
          key: item.value,
          value: item.value
        },
        item.label
      )
    )
  );
};
mock.module('@gpustack/core-ui', {
  namedExports: {
    ScrollSpyTabs: passChildren,
    CollapsePanel: ({ items }: any) =>
      createElement(
        Fragment,
        null,
        items.map((item: any) =>
          createElement(Fragment, { key: item.key }, item.children)
        )
      ),
    InputNumber: Input,
    Select,
    MetadataList: ({ dataList = [], children }: any) =>
      createElement(
        Fragment,
        null,
        dataList.map((item: any, index: number) =>
          createElement(Fragment, { key: index }, children(item, index))
        )
      ),
    AutoTooltip: passChildren,
    IconFont: empty,
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id }),
    useWrapperContext: () => ({ getScrollElementScrollableHeight: () => 0 })
  }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ messages: {}, formatMessage: ({ id }: any) => id })
  }
});
mock.module(new URL('../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit' },
    StatusMaps: {}
  }
});
mock.module(
  new URL('../../components/distribution-chart.tsx', import.meta.url).href,
  { defaultExport: empty }
);
let form: any;
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: function Basic() {
    form = Form.useFormInstance();
    return createElement(Form.Item, { name: 'name' }, createElement(Input));
  }
});
const { default: ProviderForm } = await import('../index.tsx');
const { sloFieldsFromTargets } = await import('../../config/index');
const profiles = [
  {
    value: 'Max Throughput',
    label: 'Max Throughput',
    config: {
      dataset_name: 'Random',
      dataset_input_tokens: 1024,
      dataset_output_tokens: 128,
      load_type: 'fixed_rate',
      auto_tune: true,
      lower_bound: 4,
      upper_bound: 8192,
      max_points: 15,
      max_total_seconds: 3600
    }
  },
  {
    value: 'Meet Latency SLO',
    label: 'Meet Latency SLO',
    config: {
      dataset_name: 'Random',
      dataset_input_tokens: 128,
      dataset_output_tokens: 128,
      load_type: 'concurrency',
      auto_tune: true,
      lower_bound: 4,
      upper_bound: 8192,
      max_points: 18,
      max_total_seconds: 5400,
      slo_avg_ttft_ms: 500,
      slo_avg_tpot_ms: 50
    }
  },
  {
    value: 'Custom',
    label: 'Custom',
    config: {
      dataset_name: 'Random',
      dataset_input_tokens: 1024,
      dataset_output_tokens: 128
    }
  }
];
async function render(options: { action?: string; currentData?: any } = {}) {
  const root = createRoot(dom.window.document.getElementById('root')!);
  const submitted = mock.fn(async (_values: any) => {});
  await act(async () =>
    root.render(
      createElement(ProviderForm, {
        action: options.action ?? 'create',
        currentData: options.currentData,
        open: true,
        profilesOptions: profiles,
        datasetList: [],
        onFinish: submitted
      })
    )
  );
  // Settle form watchers before inspecting conditionally mounted inputs.
  await act(async () => {});
  return {
    submitted,
    changeProfile: async (value: string) =>
      act(async () => {
        const control = controls.get('benchmark.form.profile');
        control.onChange(value);
      }),
    set: async (values: any) => act(async () => form.setFieldsValue(values)),
    submit: async () =>
      act(async () => {
        await form.validateFields();
        form.submit();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }),
    unmount: async () => act(async () => root.unmount())
  };
}

for (const action of ['create', 'edit']) {
  for (const loadType of ['fixed_rate', 'concurrency']) {
    test(`${action === 'create' ? 'cloning' : 'editing'} a legacy ${loadType} single run preserves its original load and global caps`, async () => {
      const source = {
        profile: 'Custom',
        name: 'legacy-single',
        load_type: loadType,
        dataset_name: 'Random',
        dataset_input_tokens: 512,
        dataset_output_tokens: 64,
        dataset_seed: 42,
        dataset_seed_random: false,
        request_rate: loadType === 'fixed_rate' ? 0.5 : 3,
        total_requests: 73,
        max_seconds: 29,
        stages: [],
        // Older rows predate the flag. Its absence meant a single run, even
        // though a plain new form now starts with Auto Tune enabled.
        ...(action === 'edit' ? { auto_tune: false } : {})
      };
      const view = await render({ action, currentData: source });
      try {
        assert.ok(dom.window.document.getElementById('benchmark_request_rate'));
        assert.ok(
          dom.window.document.getElementById('benchmark_total_requests')
        );
        assert.ok(dom.window.document.getElementById('benchmark_max_seconds'));
        assert.equal(
          dom.window.document.getElementById('benchmark_stages'),
          null
        );
        const singleTitle = [
          ...dom.window.document.querySelectorAll('.section-title')
        ].find((title) =>
          title.textContent?.includes('benchmark.form.load.single')
        );
        assert.ok(singleTitle);
        assert.ok(!singleTitle.querySelector('.title-help'));
        await view.submit();
        const values = view.submitted.mock.calls.at(-1)?.arguments[0];
        assert.equal(values.auto_tune, false);
        assert.equal(values.request_rate, source.request_rate);
        assert.equal(values.total_requests, 73);
        assert.equal(values.max_seconds, 29);
        assert.ok(!values.stages?.length);
      } finally {
        await view.unmount();
      }
    });
  }
}

test('changing a cloned single-run load axis keeps its original load until explicitly edited', async () => {
  const view = await render({
    currentData: {
      profile: 'Custom',
      name: 'legacy-single',
      load_type: 'fixed_rate',
      dataset_name: 'Random',
      dataset_input_tokens: 512,
      dataset_output_tokens: 64,
      request_rate: 0.5,
      total_requests: 73,
      max_seconds: 29,
      stages: [],
      auto_tune: false
    }
  });
  try {
    await act(async () =>
      controls.get('benchmark.form.loadType').onChange('concurrency')
    );
    assert.equal(form.getFieldValue('request_rate'), 0.5);
    assert.ok(!form.getFieldValue('stages')?.length);
    await act(async () =>
      assert.rejects(form.validateFields(['request_rate']))
    );
    await view.set({ request_rate: 3, total_requests: null, max_seconds: 90 });
    await view.submit();
    const values = view.submitted.mock.calls.at(-1)?.arguments[0];
    assert.equal(values.auto_tune, false);
    assert.equal(values.load_type, 'concurrency');
    assert.equal(values.request_rate, 3);
    assert.equal(values.total_requests, null);
    assert.equal(values.max_seconds, 90);
    assert.ok(!values.stages?.length);
  } finally {
    await view.unmount();
  }
});

for (const loadType of ['fixed_rate', 'concurrency']) {
  test(`Custom ${loadType} help follows the actual Avg/P95/P99 SLO targets`, async () => {
    const view = await render();
    try {
      await view.changeProfile('Custom');
      await view.set({ load_type: loadType, slo_targets: [] });
      const title = [
        ...dom.window.document.querySelectorAll('.section-title')
      ].find((element) =>
        element.textContent?.includes('benchmark.form.stages')
      );
      const help = title?.querySelector('.title-help');
      assert.ok(help);
      const helpText = () =>
        title
          ?.querySelector('.title-help')
          ?.closest('[data-help]')
          ?.getAttribute('data-help') ?? '';
      assert.match(helpText(), /benchmark\.form\.autoTune\.goal\.throughput/);
      for (const agg of ['avg', 'p95', 'p99']) {
        await view.set({ slo_targets: [{ metric: 'ttft', agg, value: 500 }] });
        assert.match(helpText(), /benchmark\.form\.autoTune\.goal\.slo/);
        assert.doesNotMatch(
          helpText(),
          /benchmark\.form\.autoTune\.goal\.throughput/
        );
      }
    } finally {
      await view.unmount();
    }
  });
}

test('named profiles retain their distinct API defaults and submit Auto Tune', async () => {
  const view = await render();
  try {
    assert.equal(form.getFieldValue('profile'), 'Max Throughput');
    assert.equal(form.getFieldValue('load_type'), 'fixed_rate');
    assert.equal(form.getFieldValue('max_points'), 15);
    assert.equal(form.getFieldValue('max_total_seconds'), 3600);
    await view.submit();
    assert.equal(
      view.submitted.mock.calls.at(-1)?.arguments[0].auto_tune,
      true
    );
    await view.changeProfile('Meet Latency SLO');
    assert.equal(form.getFieldValue('load_type'), 'concurrency');
    assert.equal(form.getFieldValue('dataset_input_tokens'), 128);
    assert.equal(form.getFieldValue('max_points'), 18);
    assert.equal(form.getFieldValue('max_total_seconds'), 5400);
    assert.deepEqual(form.getFieldValue('slo_targets'), [
      { metric: 'ttft', agg: 'avg', value: 500 },
      { metric: 'tpot', agg: 'avg', value: 50 }
    ]);
    await view.submit();
    const sloValues = view.submitted.mock.calls.at(-1)?.arguments[0];
    assert.equal(sloValues.auto_tune, true);
    assert.equal(sloValues.load_type, 'concurrency');
    assert.deepEqual(sloFieldsFromTargets(sloValues.slo_targets), {
      slo_avg_ttft_ms: 500,
      slo_p95_ttft_ms: null,
      slo_p99_ttft_ms: null,
      slo_avg_tpot_ms: 50,
      slo_p95_tpot_ms: null,
      slo_p99_tpot_ms: null,
      slo_avg_latency_ms: null,
      slo_p95_latency_ms: null,
      slo_p99_latency_ms: null
    });
    await view.changeProfile('Max Throughput');
    assert.deepEqual(form.getFieldValue('slo_targets'), []);
    assert.equal(form.getFieldValue('max_points'), 15);
    assert.equal(
      dom.window.document.getElementById('benchmark_slo_targets'),
      null
    );
  } finally {
    await view.unmount();
  }
});

for (const loadType of ['fixed_rate', 'concurrency']) {
  for (const autoTune of [true, false]) {
    test(`Custom ${loadType} ${autoTune ? 'Auto Tune' : 'manual single stage'} keeps its load strategy and all SLO aggregations`, async () => {
      const view = await render();
      try {
        await view.changeProfile('Custom');
        assert.equal(form.getFieldValue('auto_tune'), true);
        assert.equal(form.getFieldValue('max_points'), 18);
        const sloTargets = [
          { metric: 'ttft', agg: 'avg', value: 500 },
          { metric: 'ttft', agg: 'p95', value: 800 },
          { metric: 'tpot', agg: 'p99', value: 50 }
        ];
        await view.set({
          load_type: loadType,
          auto_tune: autoTune,
          slo_targets: sloTargets,
          stages: autoTune
            ? []
            : [{ rate: loadType === 'fixed_rate' ? 0.5 : 2, max_requests: 10 }]
        });
        await view.submit();
        const values = view.submitted.mock.calls.at(-1)?.arguments[0];
        assert.equal(values.auto_tune, autoTune);
        assert.equal(values.load_type, loadType);
        assert.deepEqual(values.slo_targets, sloTargets);
        assert.equal(
          sloFieldsFromTargets(values.slo_targets).slo_p95_ttft_ms,
          800
        );
        if (!autoTune) assert.equal(values.stages.length, 1);
      } finally {
        await view.unmount();
      }
    });
  }
}
