import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Framework hooks, the provider hook, the plugin config, core-ui, and the
// provider-logo (asset-importing) component stay stubbed. The contract
// under test is structural: the source Cascader must sit inside a
// layout-only (non-noStyle) Form.Item, which is what makes antd's Form
// context apply. The antd width mechanism itself is verified with the real
// antd Cascader in the second test.
let cascaderProps: any;
const StubField = ({ className }: any) =>
  createElement('span', { className }, null);
mock.module('@gpustack/core-ui', {
  namedExports: {
    Cascader: (props: any) => {
      cascaderProps = props;
      return createElement(StubField, { className: 'stub-cascader' });
    },
    AutoTooltip: ({ children }: any) => createElement('span', null, children),
    Input: { Input: () => createElement(StubField, null) },
    Textarea: () => createElement(StubField, null),
    IconFont: () => createElement('i', null),
    MetadataList: ({ label, dataList, children }: any) =>
      createElement(
        'div',
        { className: 'stub-metadata-list' },
        label,
        ...(dataList || []).map((item: unknown, index: number) =>
          typeof children === 'function' ? children(item, index) : null
        )
      )
  }
});
// The real component imports its logo images (svg/png), which node cannot
// load — stub the whole module before the page import.
mock.module(
  new URL(
    '../../../../maas-provider/components/provider-logo.tsx',
    import.meta.url
  ).href,
  { defaultExport: () => createElement('img', null) }
);
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module(
  new URL('../../../hooks/use-decision-service-providers.ts', import.meta.url)
    .href,
  {
    defaultExport: () => ({
      sourceOptions: []
    })
  }
);
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    LB_POLICY_PLUGINS: {
      'session-affinity': { titleId: 't', tipsId: 'p' },
      'least-load': { titleId: 't', tipsId: 'p' },
      'decision-service': { titleId: 't', tipsId: 'p' }
    },
    POLICY_WEIGHT_CONFIG: {
      decision: { min: 1, max: 20, step: 1, defaultValue: 10 },
      influence: { min: 0, max: 2, step: 0.1, defaultValue: 1 }
    }
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/'
});
// nwsapi (jsdom's selector engine) crashes compiling one of the class
// selectors antd's lazily injected validation styles carry — a jsdom bug,
// not a component bug (match[1] of a null className pattern match). It
// surfaces through getComputedStyle's sheet iteration, so wrap that: on
// the failing selector, fall back to an inert style object. This file
// asserts DOM structure, never computed styles.
const rawGetComputedStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.getComputedStyle = (elt: any, pseudoElt?: any) => {
  try {
    return rawGetComputedStyle(elt, pseudoElt);
  } catch {
    return { getPropertyValue: () => '' } as unknown as CSSStyleDeclaration;
  }
};
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  matchMedia: {
    // antd-style probes prefers-color-scheme at import time via the bare
    // global — jsdom ships none, so stub it before any component import.
    configurable: true,
    value: (media: string) => ({
      matches: false,
      media,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    })
  },
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
// antd v6 selects observe their selector for overflow; jsdom ships none.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverStub
});
Object.defineProperty(dom.window, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverStub
});
after(() => dom.window.close());
const { Form, Cascader } = await import('antd');
const { default: DecisionServiceFields } =
  await import('../decision-service-fields.tsx');

let form: any;
const Harness = () => {
  const [instance] = Form.useForm();
  useEffect(() => {
    form = instance;
  }, [instance]);
  return createElement(
    Form,
    {
      form: instance,
      initialValues: {
        plugins: {
          'decision-service': {
            enabled: true,
            providerId: 3,
            decisionModel: 'jev-large'
          }
        }
      }
    },
    createElement(DecisionServiceFields, {
      getTargetModelNames: () => ['model-a']
    })
  );
};

const render = async (node: ReturnType<typeof createElement>) => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  await act(async () => root.render(node));
  return async () => act(async () => root.unmount());
};

const pluginValue = (name: string) =>
  form.getFieldValue(['plugins', 'decision-service', name]);

test('the enabled source cascader renders inside its own layout Form.Item', async () => {
  const unmount = await render(createElement(Harness));
  try {
    const sourceCascader = dom.window.document.querySelector('.stub-cascader');
    assert.ok(sourceCascader, 'source cascader rendered');
    // A non-noStyle Form.Item wrapper is what carries antd's standard item
    // margin; without it the cascader sat flush against the textarea below,
    // and its inner .ant-cascader lost width:100%.
    const item = sourceCascader.closest('.ant-form-item');
    assert.ok(item, 'source cascader must live inside a .ant-form-item');

    // The manual decision-model input is gone: picking the source is the
    // whole interaction and the engine alias is derived from the child row.
    const autoComplete = dom.window.document.querySelector('.stub-auto');
    assert.equal(
      autoComplete,
      null,
      'no manual decision-model input is rendered'
    );

    // The surfaced providerId error stays inside the source cascader's item
    // so it hugs the control while the item margin separates the next field.
    const paragraph = dom.window.document.querySelector('.ant-typography');
    assert.ok(paragraph, 'error paragraph rendered');
    assert.equal(paragraph.closest('.ant-form-item'), item);
  } finally {
    await unmount();
  }
});

test('antd applies Cascader width:100% only through a Form.Item context', async () => {
  const unmount = await render(
    createElement(
      Form,
      null,
      createElement(Form.Item, null, createElement(Cascader)),
      createElement(Cascader, { key: 'bare' })
    )
  );
  try {
    const cascaders = [
      ...dom.window.document.querySelectorAll<HTMLElement>('.ant-cascader')
    ];
    assert.equal(cascaders.length, 2);
    assert.match(
      cascaders[0].className,
      /ant-select-in-form-item/,
      'in-Form.Item cascader gets the full-width class (antd cascader reuses the select classes)'
    );
    assert.doesNotMatch(
      cascaders[1].className,
      /ant-select-in-form-item/,
      'bare cascader stays content-width — why the wrapper exists'
    );
  } finally {
    await unmount();
  }
});

test('a picked child decomposes into providerId XOR modelId plus the alias', async () => {
  const unmount = await render(createElement(Harness));
  try {
    // Edit-mode seed: provider + engine resolve to a stand-in path while the
    // sources are still loading (the mocked hook returns no options).
    assert.deepEqual(cascaderProps.value, [3, 'jev-large']);

    // A provider engine row writes providerId + the engine alias.
    await act(async () => {
      cascaderProps.onChange(
        [7, 'jev-pro'],
        [
          { value: 7, label: 'TypeSafe' },
          {
            value: 'jev-pro',
            label: 'jev-pro',
            data: { provider_id: 7, decision_model: 'jev-pro' }
          }
        ]
      );
    });
    assert.equal(pluginValue('providerId'), 7);
    assert.equal(pluginValue('modelId'), undefined);
    assert.equal(pluginValue('decisionModel'), 'jev-pro');

    // A local deployment row writes modelId and seeds the alias with its name.
    await act(async () => {
      cascaderProps.onChange(
        ['deployments', 12],
        [
          { value: 'deployments', label: 'Local deployments' },
          { value: 12, label: 'dep-12', data: { model_id: 12 } }
        ]
      );
    });
    assert.equal(pluginValue('modelId'), 12);
    assert.equal(pluginValue('providerId'), undefined);
    assert.equal(pluginValue('decisionModel'), 'dep-12');

    // Clearing empties all three.
    await act(async () => {
      cascaderProps.onChange([], []);
    });
    assert.equal(pluginValue('modelId'), undefined);
    assert.equal(pluginValue('providerId'), undefined);
    assert.equal(pluginValue('decisionModel'), undefined);
  } finally {
    await unmount();
  }
});

test('a stored source id without its engine alias is rejected until re-picked', async () => {
  const unmount = await render(createElement(Harness));
  try {
    // The Harness seeds providerId 3 + alias 'jev-large'; dropping the
    // alias mimics a persisted config whose payload would omit
    // decisionModel and silently skip JEV routing (gpustack/gpustack#6353).
    await act(async () => {
      form.setFieldValue(
        ['plugins', 'decision-service', 'decisionModel'],
        undefined
      );
    });
    let rejected = false;
    await act(async () => {
      await form
        .validateFields([['plugins', 'decision-service', 'providerId']])
        .catch(() => {
          rejected = true;
        });
    });
    assert.ok(rejected, 'validation rejects an id without the alias');
    assert.match(
      form
        .getFieldError(['plugins', 'decision-service', 'providerId'])
        .join(' '),
      /routes\.lb\.systemone\.provider\.required/
    );

    // Re-picking a child row restores the alias and passes validation.
    await act(async () => {
      cascaderProps.onChange(
        [7, 'jev-pro'],
        [
          { value: 7, label: 'TypeSafe' },
          {
            value: 'jev-pro',
            label: 'jev-pro',
            data: { provider_id: 7, decision_model: 'jev-pro' }
          }
        ]
      );
    });
    let passed = true;
    await act(async () => {
      await form
        .validateFields([['plugins', 'decision-service', 'providerId']])
        .catch(() => {
          passed = false;
        });
    });
    assert.ok(passed, 'a complete pick passes validation');
  } finally {
    await unmount();
  }
});

test('a persisted both-ids state is rejected until one source is re-picked', async () => {
  const unmount = await render(createElement(Harness));
  try {
    // The server's exactly-one rule would 422 a payload carrying both ids;
    // a legacy/persisted both-set form state must be caught client-side.
    await act(async () => {
      form.setFieldValue(['plugins', 'decision-service', 'modelId'], 12);
    });
    let rejected = false;
    await act(async () => {
      await form
        .validateFields([['plugins', 'decision-service', 'providerId']])
        .catch(() => {
          rejected = true;
        });
    });
    assert.ok(rejected, 'validation rejects providerId and modelId together');
    assert.match(
      form
        .getFieldError(['plugins', 'decision-service', 'providerId'])
        .join(' '),
      /routes\.lb\.systemone\.provider\.required/
    );

    // Re-picking any single child row clears the other id and passes.
    await act(async () => {
      cascaderProps.onChange(
        [7, 'jev-pro'],
        [
          { value: 7, label: 'TypeSafe' },
          {
            value: 'jev-pro',
            label: 'jev-pro',
            data: { provider_id: 7, decision_model: 'jev-pro' }
          }
        ]
      );
    });
    let passed = true;
    await act(async () => {
      await form
        .validateFields([['plugins', 'decision-service', 'providerId']])
        .catch(() => {
          passed = false;
        });
    });
    assert.ok(passed, 'a single re-picked source passes validation');
  } finally {
    await unmount();
  }
});

test('the dropdown uses the floating body placement, not the pinned one', async () => {
  const unmount = await render(createElement(Harness));
  try {
    // The pinned `.cascader-popup-wrapper` assumes a popup parented to the
    // trigger (`inset: 53px` relative to it); this cascader renders the
    // popup at document.body (the LB card clips parented popups), where
    // that pin would drop the dropdown at the top-left of the page.
    assert.match(
      cascaderProps.classNames?.popup?.root || '',
      /cascader-popup-floating/,
      'popup root must use the floating variant'
    );
    assert.doesNotMatch(
      cascaderProps.classNames?.popup?.root || '',
      /cascader-popup-wrapper/,
      'the pinned variant pins at body top-left without a parented container'
    );
    assert.equal(
      cascaderProps.getPopupContainer,
      undefined,
      'a parented container would be clipped by the LB card overflow'
    );
  } finally {
    await unmount();
  }
});
