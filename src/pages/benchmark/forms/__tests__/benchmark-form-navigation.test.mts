import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, mock, test, type TestContext } from 'node:test';
import { act, createElement, Fragment, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
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
  innerWidth: { configurable: true, value: dom.window.innerWidth },
  innerHeight: { configurable: true, value: dom.window.innerHeight },
  requestAnimationFrame: {
    configurable: true,
    value: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0)
  },
  cancelAnimationFrame: { configurable: true, value: clearTimeout },
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
dom.window.requestAnimationFrame = globalThis.requestAnimationFrame;
dom.window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
dom.window.HTMLElement.prototype.scrollTo = () => {};
let scrolled: {
  name: (string | number)[];
  element: HTMLElement | null;
  expanded: boolean;
  visible: boolean;
}[] = [];
const isRevealed = (element: HTMLElement | null) => {
  if (!element) return false;
  for (
    let ancestor: HTMLElement | null = element;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    if (
      getComputedStyle(ancestor).display === 'none' ||
      ancestor.getAttribute('aria-hidden') === 'true' ||
      ancestor.style.height === '0px'
    )
      return false;
  }
  return true;
};
after(() => dom.window.close());

mock.module('ahooks', {
  namedExports: {
    useMemoizedFn: (callback: any) => {
      const latest = useRef(callback);
      latest.current = callback;
      const stable = useRef((...args: any[]) => latest.current(...args));
      return stable.current;
    }
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: {},
      cx: (...classes: any[]) => classes.join(' ')
    })
  }
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
const coreBase = new URL('./lib/', import.meta.resolve('@gpustack/core-ui'));
const tabsDeclaration = readFileSync(
  new URL('components/scroll-spy-tabs/index.d.ts', coreBase),
  'utf8'
);
// Published core versions remain usable while the optional controlled API is
// awaiting release. Keep its extra highlight guarantees strict when installed.
const supportsControlledTabs =
  /\bvalue\?:\s*string\s*;/.test(tabsDeclaration) &&
  /\bonChange\?:/.test(tabsDeclaration);
// Native Node ESM exposes styled-components' CommonJS default wrapper. Use the
// same callable styled export that the app bundler provides to core components.
const styledComponents = await import('styled-components');
mock.module('styled-components', { defaultExport: styledComponents.styled });
mock.module(new URL('components/icon-font/index.es.js', coreBase).href, {
  defaultExport: empty
});
const { default: ScrollSpyTabs } = await import(
  new URL('components/scroll-spy-tabs/index.es.js', coreBase).href
);
const { default: CollapsePanel } = await import(
  new URL('components/collapse-panel/index.es.js', coreBase).href
);
const InputField = ({ value, id, label }: any) =>
  createElement('input', {
    id,
    'aria-label': typeof label === 'string' ? label : undefined,
    value: value == null ? '' : String(value),
    readOnly: true
  });
const MetadataList = ({ dataList = [], children, onAdd, btnText }: any) =>
  createElement(
    'div',
    null,
    dataList.map((item: any, index: number) =>
      createElement(Fragment, { key: index }, children(item, index))
    ),
    createElement('button', { type: 'button', onClick: onAdd }, btnText)
  );
mock.module('@gpustack/core-ui', {
  namedExports: {
    ScrollSpyTabs,
    CollapsePanel,
    InputNumber: InputField,
    Select: InputField,
    MetadataList,
    AutoTooltip: passChildren,
    IconFont: empty,
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id }),
    useWrapperContext: () => ({
      getScrollElementScrollableHeight: () => ({
        scrollHeight: 1200,
        scrollTop: 0
      })
    })
  }
});
mock.module(
  new URL('../../components/distribution-chart.tsx', import.meta.url).href,
  { defaultExport: empty }
);

const { Form } = await import('antd');
let form: any;
mock.module(new URL('../basic.tsx', import.meta.url).href, {
  defaultExport: function BasicFields() {
    form = Form.useFormInstance();
    return createElement(
      Form.Item,
      { name: 'name', 'data-field': 'name', rules: [{ required: true }] },
      createElement(InputField)
    );
  }
});
const { default: ProviderForm } = await import('../index.tsx');

const profilesOptions = [
  {
    value: 'Max Throughput',
    label: 'Max Throughput',
    config: { dataset_name: 'Random' }
  },
  { value: 'Custom', label: 'Custom', config: {} },
  {
    value: 'Meet Latency SLO',
    label: 'Meet Latency SLO',
    config: { slo_p99_ttft_ms: 2000 }
  }
];
const tick = async (delay = 25) =>
  act(async () => new Promise((resolve) => setTimeout(resolve, delay)));
const group = (key: string) => {
  const label = dom.window.document.querySelector(`[data-field="${key}"]`);
  assert.ok(label, `missing ${key} anchor`);
  const item = label.closest('.ant-collapse-item');
  assert.ok(item, `missing ${key} collapse item`);
  return item;
};
const isOpen = (key: string) =>
  group(key).classList.contains('ant-collapse-item-active');
const toggleGroup = async (key: string) => {
  const header = group(key).querySelector(
    '.ant-collapse-header'
  ) as HTMLElement;
  await act(async () => header.click());
  await tick();
};
const selectedTab = () =>
  dom.window.document.querySelector(
    '.segment-line .ant-segmented-item-selected'
  )?.textContent;
const clickTab = async (key: string) => {
  const labels: Record<string, string> = {
    name: 'common.title.basicInfo',
    dataset: 'benchmark.form.group.dataset',
    slo: 'benchmark.form.group.slo',
    load: 'benchmark.form.group.load',
    execution: 'benchmark.form.group.execution'
  };
  const tab = [
    ...dom.window.document.querySelectorAll('.segment-line .ant-segmented-item')
  ].find((item) => item.textContent === labels[key]);
  assert.ok(tab, `missing ${key} tab`);
  await act(async () => (tab.querySelector('input') as HTMLElement).click());
  await tick();
};
const renderForm = async () => {
  scrolled = [];
  const root = createRoot(dom.window.document.getElementById('root')!);
  const ref: any = { current: null };
  let completeSubmit: (() => void) | undefined;
  const release = mock.fn((_errorInfo: any) => completeSubmit?.());
  const submitted = mock.fn(async (_values: any) => completeSubmit?.());
  const render = async (open = true) =>
    act(async () =>
      root.render(
        createElement(ProviderForm, {
          ref,
          action: 'create',
          open,
          datasetList: [{ value: 'Random', label: 'Random' }],
          profilesOptions,
          onFinish: submitted,
          onFinishFailed: release
        })
      )
    );
  await render();
  const scrollToField = form.scrollToField;
  mock.method(
    form,
    'scrollToField',
    (name: string | (string | number)[], options: any) => {
      const path = Array.isArray(name) ? name : [name];
      const element = dom.window.document.getElementById(
        `benchmark_${path.join('_')}`
      );
      scrolled.push({
        name: path,
        element,
        expanded:
          element
            ?.closest('.ant-collapse-item')
            ?.classList.contains('ant-collapse-item-active') ?? true,
        visible: isRevealed(element)
      });
      return scrollToField(name, options);
    }
  );
  await tick();
  await act(async () =>
    form.setFieldsValue({
      profile: 'Custom',
      name: 'user-benchmark',
      dataset_input_tokens: 2048,
      dataset_output_tokens: 256
    })
  );
  await tick();
  return {
    release,
    submitted,
    render,
    submit: async (delay = 350) => {
      const finished = new Promise<void>((resolve) => {
        completeSubmit = resolve;
      });
      // Form.submit() returns void. Await its actual validation callback before
      // leaving act so validation and the native auto-scroll both complete.
      await act(async () => {
        ref.current.submit();
        await finished;
      });
      completeSubmit = undefined;
      // Newly opened groups use the form's 300 ms reveal delay before scrolling.
      await tick(delay);
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('clicking a navigation tab leaves a collapsed group closed', async () => {
  const view = await renderForm();
  try {
    await toggleGroup('load');
    assert.equal(isOpen('load'), false);
    await clickTab('load');
    assert.equal(selectedTab(), 'benchmark.form.group.load');
    assert.equal(isOpen('load'), false);
    assert.equal(form.getFieldValue('dataset_input_tokens'), 2048);
  } finally {
    await view.unmount();
  }
});

test('validation opens invalid groups, scrolls the first invalid field and releases submit', async () => {
  const view = await renderForm();
  try {
    await act(async () =>
      form.setFieldsValue({
        dataset_input_tokens: undefined,
        auto_tune: false,
        stages: []
      })
    );
    await toggleGroup('dataset');
    await toggleGroup('load');
    await toggleGroup('execution');
    scrolled = [];
    await view.submit();
    assert.equal(view.release.mock.callCount(), 1);
    assert.deepEqual(
      view.release.mock.calls[0].arguments[0].errorFields.map(
        (field: any) => field.name
      ),
      [['dataset_input_tokens'], ['stages']]
    );
    assert.equal(isOpen('dataset'), true);
    assert.equal(isOpen('load'), true);
    assert.equal(isOpen('execution'), false);
    if (supportsControlledTabs) {
      assert.equal(selectedTab(), 'benchmark.form.group.dataset');
    }
    const control = dom.window.document.getElementById(
      'benchmark_dataset_input_tokens'
    )!;
    assert.ok(
      control
        .closest('.ant-form-item')
        ?.classList.contains('ant-form-item-has-error')
    );
    assert.deepEqual(scrolled[0]?.name, ['dataset_input_tokens']);
    assert.equal(scrolled[0]?.element, control);
    assert.equal(scrolled[0]?.expanded, true);
    assert.equal(scrolled[0]?.visible, true);
    assert.equal(form.getFieldValue('name'), 'user-benchmark');
  } finally {
    await view.unmount();
  }
});

test('validation scrolls the first invalid basic field while revealing later invalid groups', async () => {
  const view = await renderForm();
  try {
    await clickTab('load');
    assert.equal(selectedTab(), 'benchmark.form.group.load');
    await act(async () =>
      form.setFieldsValue({ name: undefined, dataset_input_tokens: undefined })
    );
    await toggleGroup('dataset');
    await toggleGroup('load');
    scrolled = [];
    await view.submit();
    const firstInvalid = dom.window.document.getElementById('benchmark_name');
    assert.deepEqual(scrolled[0]?.name, ['name']);
    assert.equal(scrolled[0]?.element, firstInvalid);
    assert.equal(scrolled[0]?.visible, true);
    assert.equal(isOpen('dataset'), true);
    assert.equal(isOpen('load'), false);
    if (supportsControlledTabs) {
      assert.equal(selectedTab(), 'common.title.basicInfo');
    }
    assert.equal(view.release.mock.callCount(), 1);
  } finally {
    await view.unmount();
  }
});

for (const field of ['lower_bound', 'upper_bound']) {
  test(`validation reveals a collapsed load section for an invalid ${field}`, async () => {
    const view = await renderForm();
    try {
      await act(async () =>
        form.setFieldsValue({
          auto_tune: true,
          lower_bound: field === 'lower_bound' ? 0 : 4,
          upper_bound: field === 'upper_bound' ? 2 : 8192
        })
      );
      await toggleGroup('load');
      scrolled = [];
      await view.submit();
      assert.equal(view.release.mock.callCount(), 1);
      assert.equal(isOpen('load'), true);
      assert.deepEqual(scrolled[0]?.name, [field]);
      assert.equal(scrolled[0]?.expanded, true);
      assert.equal(scrolled[0]?.visible, true);
      if (supportsControlledTabs) {
        assert.equal(selectedTab(), 'benchmark.form.group.load');
      }
    } finally {
      await view.unmount();
    }
  });
}

test('validation scrolls an invalid metadata list through its native wrapper id', async () => {
  const view = await renderForm();
  try {
    await act(async () =>
      form.setFieldsValue({ auto_tune: false, stages: [] })
    );
    await toggleGroup('load');
    scrolled = [];
    await view.submit();
    assert.equal(view.release.mock.callCount(), 1);
    assert.equal(isOpen('load'), true);
    const invalidField = group('load').querySelector(
      '.ant-form-item-has-error'
    );
    assert.ok(invalidField);
    const wrapper = dom.window.document.getElementById('benchmark_stages');
    assert.ok(wrapper);
    assert.ok(wrapper.contains(invalidField));
    assert.deepEqual(scrolled[0]?.name, ['stages']);
    assert.equal(scrolled[0]?.element, wrapper);
    assert.equal(scrolled[0]?.expanded, true);
    assert.equal(scrolled[0]?.visible, true);
    if (supportsControlledTabs) {
      assert.equal(selectedTab(), 'benchmark.form.group.load');
    }
  } finally {
    await view.unmount();
  }
});

test('an invalid SLO row reveals its group and scrolls the SLO wrapper', async () => {
  const view = await renderForm();
  try {
    await act(async () =>
      form.setFieldValue('slo_targets', [
        { metric: 'ttft', agg: 'p99', value: null }
      ])
    );
    await toggleGroup('slo');
    await toggleGroup('load');
    await toggleGroup('execution');
    scrolled = [];
    await view.submit();
    const wrapper = dom.window.document.getElementById('benchmark_slo_targets');
    assert.ok(wrapper?.querySelector('.ant-form-item-has-error'));
    assert.deepEqual(scrolled[0]?.name, ['slo_targets']);
    assert.equal(scrolled[0]?.element, wrapper);
    assert.equal(scrolled[0]?.expanded, true);
    assert.equal(scrolled[0]?.visible, true);
    assert.equal(isOpen('slo'), true);
    assert.equal(isOpen('load'), false);
    assert.equal(isOpen('execution'), false);
    if (supportsControlledTabs) {
      assert.equal(selectedTab(), 'benchmark.form.group.slo');
    }
    assert.equal(view.release.mock.callCount(), 1);
  } finally {
    await view.unmount();
  }
});

test('an invalid enabled shared prefix reveals workload and scrolls the prefix wrapper', async () => {
  const view = await renderForm();
  try {
    const title = [
      ...dom.window.document.querySelectorAll('.section-title')
    ].find((item) => item.textContent?.includes('benchmark.form.sharedPrefix'));
    const toggle = title!.querySelector('[role="switch"]') as HTMLElement;
    await act(async () => toggle.click());
    await act(async () =>
      form.setFieldValue('prefix_buckets', [
        { prefix_tokens: null, prefix_count: 1, bucket_weight: 100 }
      ])
    );
    await toggleGroup('dataset');
    await toggleGroup('load');
    await toggleGroup('execution');
    scrolled = [];
    await view.submit();
    const wrapper = dom.window.document.getElementById(
      'benchmark_prefix_buckets'
    );
    assert.ok(wrapper?.querySelector('.ant-form-item-has-error'));
    assert.deepEqual(scrolled[0]?.name, ['prefix_buckets']);
    assert.equal(scrolled[0]?.element, wrapper);
    assert.equal(scrolled[0]?.expanded, true);
    assert.equal(scrolled[0]?.visible, true);
    assert.equal(isOpen('dataset'), true);
    assert.equal(isOpen('load'), false);
    assert.equal(isOpen('execution'), false);
    assert.equal(view.release.mock.callCount(), 1);
  } finally {
    await view.unmount();
  }
});

test('a required profile error scrolls its field without opening groups', async () => {
  const view = await renderForm();
  try {
    await act(async () => form.setFieldValue('profile', undefined));
    await toggleGroup('dataset');
    await toggleGroup('load');
    await toggleGroup('execution');
    scrolled = [];
    await view.submit();
    const control = dom.window.document.getElementById('benchmark_profile')!;
    assert.ok(
      control
        .closest('.ant-form-item')
        ?.classList.contains('ant-form-item-has-error')
    );
    if (supportsControlledTabs) {
      assert.equal(selectedTab(), 'benchmark.form.group.dataset');
    }
    assert.deepEqual(scrolled[0]?.name, ['profile']);
    assert.equal(scrolled[0]?.element, control);
    assert.equal(scrolled[0]?.visible, true);
    assert.equal(isOpen('dataset'), false);
    assert.equal(isOpen('load'), false);
    assert.equal(isOpen('execution'), false);
    assert.equal(view.release.mock.callCount(), 1);
  } finally {
    await view.unmount();
  }
});

test('validation in a closed form keeps groups closed and disables auto-scroll', async () => {
  const view = await renderForm();
  try {
    await act(async () =>
      form.setFieldValue('dataset_input_tokens', undefined)
    );
    await toggleGroup('dataset');
    await view.render(false);
    scrolled = [];
    await view.submit(25);
    assert.equal(view.release.mock.callCount(), 1);
    assert.equal(isOpen('dataset'), false);
    assert.equal(scrolled.length, 0);
  } finally {
    await view.unmount();
  }
});

const holdNextRevealTimer = (context: TestContext) => {
  const schedule = globalThis.setTimeout;
  const cancel = globalThis.clearTimeout;
  let heldTimer: ReturnType<typeof setTimeout> | undefined;
  let pending: (() => void) | undefined;
  // Hold only this submission's reveal timer. React, antd and tab scrolling
  // retain their real timers, regardless of how long act takes on CI.
  context.mock.method(
    globalThis,
    'setTimeout',
    (callback: (...args: any[]) => void, delay?: number, ...args: any[]) => {
      if (delay !== 300 || heldTimer !== undefined) {
        return schedule(callback, delay, ...args);
      }
      heldTimer = schedule(() => {}, 0);
      cancel(heldTimer);
      pending = () => callback(...args);
      return heldTimer;
    }
  );
  context.mock.method(
    globalThis,
    'clearTimeout',
    (timer: ReturnType<typeof setTimeout> | number | undefined) => {
      if (timer === heldTimer) pending = undefined;
      cancel(timer);
    }
  );
  return {
    isPending: () => pending !== undefined,
    run: () => {
      const callback = pending;
      pending = undefined;
      callback?.();
    }
  };
};

test('closing the form cancels a pending validation scroll after a group opens', async (context) => {
  const view = await renderForm();
  try {
    await act(async () =>
      form.setFieldValue('dataset_input_tokens', undefined)
    );
    await toggleGroup('dataset');
    const revealTimer = holdNextRevealTimer(context);
    scrolled = [];
    await view.submit(25);
    assert.equal(view.release.mock.callCount(), 1);
    assert.equal(isOpen('dataset'), true);
    assert.equal(revealTimer.isPending(), true);
    assert.equal(scrolled.length, 0);
    await view.render(false);
    assert.equal(revealTimer.isPending(), false);
    await act(async () => revealTimer.run());
    assert.equal(scrolled.length, 0);
  } finally {
    await view.unmount();
  }
});

test(
  'selecting another tab cancels a pending validation scroll without expanding the selected group',
  { skip: !supportsControlledTabs },
  async (context) => {
    const view = await renderForm();
    try {
      await act(async () =>
        form.setFieldValue('dataset_input_tokens', undefined)
      );
      await toggleGroup('dataset');
      await toggleGroup('execution');
      const revealTimer = holdNextRevealTimer(context);
      scrolled = [];
      await view.submit(25);
      assert.equal(view.release.mock.callCount(), 1);
      assert.equal(isOpen('dataset'), true);
      assert.equal(revealTimer.isPending(), true);
      assert.equal(scrolled.length, 0);

      await clickTab('execution');
      assert.equal(selectedTab(), 'benchmark.form.group.execution');
      assert.equal(isOpen('execution'), false);
      assert.equal(revealTimer.isPending(), false);
      await act(async () => revealTimer.run());
      assert.equal(scrolled.length, 0);
      assert.equal(isOpen('dataset'), true);
      assert.equal(isOpen('execution'), false);
    } finally {
      await view.unmount();
    }
  }
);

test('successful validation submits without scrolling to a field', async () => {
  const view = await renderForm();
  try {
    scrolled = [];
    await view.submit(25);
    assert.equal(view.submitted.mock.callCount(), 1);
    assert.equal(view.release.mock.callCount(), 0);
    assert.equal(scrolled.length, 0);
  } finally {
    await view.unmount();
  }
});

test('SLO visibility changes preserve form state, disclosure state and submission', async () => {
  const view = await renderForm();
  try {
    await toggleGroup('execution');
    const distributionTitle = [
      ...dom.window.document.querySelectorAll('.section-title')
    ].find((title) =>
      title.textContent?.includes('benchmark.form.group.distribution')
    );
    const toggle = distributionTitle!.querySelector(
      '[role="switch"]'
    ) as HTMLElement;
    await act(async () => toggle.click());
    assert.ok(
      dom.window.document.getElementById('benchmark_dataset_input_stdev')
    );
    await clickTab('slo');
    assert.equal(selectedTab(), 'benchmark.form.group.slo');
    await act(async () => form.setFieldValue('profile', 'Meet Latency SLO'));
    await tick();
    assert.equal(selectedTab(), 'benchmark.form.group.slo');
    await act(async () => form.setFieldValue('profile', 'Max Throughput'));
    await tick();
    if (supportsControlledTabs) {
      assert.ok(selectedTab());
      assert.notEqual(selectedTab(), 'benchmark.form.group.slo');
    }
    const fallback = selectedTab();
    assert.equal(dom.window.document.querySelector('[data-field="slo"]'), null);
    assert.equal(form.getFieldValue('name'), 'user-benchmark');
    assert.equal(form.getFieldValue('dataset_input_tokens'), 2048);
    assert.equal(isOpen('execution'), false);
    assert.ok(
      dom.window.document.getElementById('benchmark_dataset_input_stdev')
    );
    await view.submit(25);
    assert.equal(view.submitted.mock.callCount(), 1);
    assert.equal(view.release.mock.callCount(), 0);
    await act(async () => form.setFieldValue('profile', 'Custom'));
    await tick();
    if (supportsControlledTabs) {
      assert.equal(selectedTab(), fallback);
    }
    await clickTab('slo');
    assert.equal(selectedTab(), 'benchmark.form.group.slo');
    assert.equal(isOpen('execution'), false);
    assert.equal(form.getFieldValue('dataset_input_tokens'), 2048);
    assert.ok(
      dom.window.document.getElementById('benchmark_dataset_input_stdev')
    );
    await view.submit(25);
    assert.equal(view.submitted.mock.callCount(), 2);
    assert.equal(view.release.mock.callCount(), 0);
  } finally {
    await view.unmount();
  }
});
