import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { createElement as h } from 'react';

// P1 regression harness: switching models while a run is in flight must
// cancel (and invalidate) that run — the old model's late success or
// failure can no longer update answers, meta, error, or loading.

interface PendingRequest {
  payload: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}
const pending: PendingRequest[] = [];

// Each requestSource() call is recorded so the test can assert which run
// was canceled and which token stayed current.
const createdSources: {
  token: {};
  cancelCalls: number;
  cancel: () => void;
}[] = [];

const fromRoot = (path: string) =>
  new URL(`../../../../${path}`, import.meta.url).href;

// --- module mocks (registered before the page import) ----------------------
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: { id: string }) => id
    }),
    // The page preselects this model declaratively from the param.
    useSearchParams: () => [new URLSearchParams('model=model-a')]
  }
});
mock.module('@monaco-editor/react', {
  defaultExport: () => null
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    SYSTEMONE_API: '/v1/systemone',
    CREAT_IMAGE_API: '/v1-openai/images/generations',
    MODEL_PROXY: '/model/proxy',
    OPENAI_COMPATIBLE: 'v1-openai',
    GPUSTACK_API_BASE_URL: '/gpustack',
    // Every run stays pending until the test resolves/rejects it.
    decisionQuery: (payload: any) =>
      new Promise((resolve, reject) => {
        pending.push({ payload, resolve, reject });
      })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertInfo: ({ message }: { message?: React.ReactNode }) =>
      h('div', { 'data-testid': 'alert' }, message),
    IconFont: (props: Record<string, any>) =>
      h('span', { 'data-iconfont': props.type }),
    // Mimic the real OverlayScrollbars initialization (moves the host's
    // children into its viewport) like the token-strip harness.
    useOverlayScroller: () => ({
      initialize: (el: HTMLElement) => {
        const viewport = el.ownerDocument.createElement('div');
        viewport.className = 'os-viewport';
        while (el.firstChild) {
          viewport.appendChild(el.firstChild);
        }
        el.appendChild(viewport);
      },
      updateScrollerPosition: () => {}
    }),
    useRequestToken: () => () => {
      const source = {
        token: {},
        cancelCalls: 0,
        cancel: () => {
          source.cancelCalls += 1;
        }
      };
      createdSources.push(source as any);
      return source;
    },
    CommandViewer: () => null,
    Select: (props: Record<string, any>) =>
      h('input', {
        'data-testid': 'model-select',
        value: props.value ?? '',
        onChange: (event: any) => props.onChange?.(event.target.value)
      })
  }
});
mock.module(new URL('../../style/decision.less', import.meta.url).href, {
  defaultExport: {}
});
mock.module(new URL('../../style/ground-llm.less', import.meta.url).href, {
  defaultExport: {}
});
mock.module(
  new URL('../../style/params-container.module.less', import.meta.url).href,
  {
    defaultExport: { wrapper: 'wrapper', box: 'box', collapsed: 'collapsed' }
  }
);
mock.module(
  new URL('../../style/reference-params.less', import.meta.url).href,
  {
    defaultExport: {}
  }
);
mock.module(fromRoot('hooks/use-user-settings.ts'), {
  defaultExport: () => ({ isDarkTheme: false })
});

test('switching models cancels the in-flight run and ignores its late result', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/'
  });
  const defined = new Map<string, PropertyDescriptor | undefined>();
  const globals = [
    'window',
    'document',
    'navigator',
    'IS_REACT_ACT_ENVIRONMENT',
    ...Object.getOwnPropertyNames(dom.window).filter(
      (key) => !(key in globalThis)
    )
  ];
  const descriptors = globals.map((key) => {
    defined.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    return defined.get(key);
  });
  Object.defineProperties(
    globalThis,
    Object.fromEntries(
      globals.map((key) => [
        key,
        {
          configurable: true,
          value:
            key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
        }
      ])
    )
  );
  try {
    (dom.window as any).matchMedia ??= (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    });
    (globalThis as any).ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    const { act } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { default: GroundDecision } = await import('../page');

    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
      root.render(
        h(GroundDecision, {
          modelList: [
            { value: 'model-a', label: 'model-a' },
            { value: 'model-b', label: 'model-b' },
            { value: 'model-c', label: 'model-c' }
          ],
          loaded: true
        })
      );
    });

    const primaryButton = () =>
      Array.from(container.querySelectorAll('button')).find((button) =>
        button.className.includes('ant-btn-primary')
      );
    const stopButton = () =>
      container.querySelector('button[aria-label="common.button.stop"]');
    const setModelSelectValue = (value: string) => {
      const input = container.querySelector('[data-testid="model-select"]')!;
      const setter = Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        'value'
      )?.set;
      setter?.call(input, value);
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    };

    // 1. A model-a run goes in flight and stays pending.
    await act(async () => {
      primaryButton()!.click();
    });
    assert.equal(pending.length, 1, 'the run was submitted');
    assert.equal(pending[0].payload.model, 'model-a');
    assert.ok(stopButton(), 'the run is in flight');
    assert.equal(createdSources[0].cancelCalls, 0);

    // 2. Switching to model-b cancels and invalidates the run, resets the
    //    answers, and ends loading.
    await act(async () => {
      setModelSelectValue('model-b');
    });
    assert.equal(
      createdSources[0].cancelCalls,
      1,
      'the model-a run was canceled'
    );
    assert.ok(!stopButton(), 'loading ended with the switch');
    assert.match(
      container.textContent || '',
      /playground\.decision\.answers\.placeholder/,
      'answers were reset to the placeholder'
    );

    // 3. model-a's late success must not land.
    await act(async () => {
      pending[0].resolve({
        answers: { department: { type: 'choice' } },
        usage: { input_tokens: 1, output_tokens: 1 }
      });
    });
    assert.doesNotMatch(
      container.textContent || '',
      /department/,
      'the stale answer is ignored'
    );
    assert.doesNotMatch(
      container.textContent || '',
      /playground\.tokenusage/,
      'the stale token strip is ignored'
    );

    // 4. A model-b run, then another switch — and the late FAILURE of the
    //    canceled run must not surface either.
    await act(async () => {
      primaryButton()!.click();
    });
    assert.equal(pending.length, 2);
    assert.equal(pending[1].payload.model, 'model-b');
    await act(async () => {
      setModelSelectValue('model-c');
    });
    assert.equal(
      createdSources[1].cancelCalls,
      1,
      'the model-b run was canceled'
    );
    await act(async () => {
      pending[1].reject({
        message: 'canceled',
        response: { data: { error: { message: 'model-b exploded' } } }
      });
    });
    assert.doesNotMatch(
      container.textContent || '',
      /model-b exploded/,
      'the stale failure is ignored'
    );
    assert.ok(!stopButton(), 'ready to run model-c');

    await act(async () => {
      root.unmount();
    });
  } finally {
    globals.forEach((key) => {
      const descriptor = defined.get(key);
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete (globalThis as any)[key];
      }
    });
  }
});
