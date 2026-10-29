import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { createElement as h } from 'react';

// Regression harness for the systemone 501 body:
//   {"error":{"code":501,"message":"This model is not a decision model","type":"not_supported_error"}}
// The real page is rendered with stubbed editors and a decisionQuery that
// rejects with the axios-shaped error umi's request rejects with; submitting
// must surface the message instead of crashing the tree. If the crash exists,
// the error propagates out of act() and fails this test with the real stack.

const errorBody = {
  error: {
    code: 501,
    message: 'This model is not a decision model',
    type: 'not_supported_error'
  }
};
const axiosLikeError = {
  message: 'Request failed with status code 501',
  name: 'AxiosError',
  code: 'ERR_BAD_RESPONSE',
  response: {
    status: 501,
    statusText: 'Not Implemented',
    data: errorBody
  }
};

const fromRoot = (path: string) =>
  new URL(`../../../../${path}`, import.meta.url).href;

// --- module mocks (registered before the page import) ----------------------
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: { id: string }) => id
    }),
    useSearchParams: () => [new URLSearchParams('model=jev-1.13.0')]
  }
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    SYSTEMONE_API: '/v1/systemone',
    CREAT_IMAGE_API: '/v1-openai/images/generations',
    MODEL_PROXY: '/model/proxy',
    OPENAI_COMPATIBLE: 'v1-openai',
    GPUSTACK_API_BASE_URL: '/gpustack',
    decisionQuery: async () => {
      throw axiosLikeError;
    }
  }
});
mock.module('@gpustack/core-ui/json-editor', {
  namedExports: {
    JsonEditor: () => null
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertInfo: ({ message }: { message?: React.ReactNode }) =>
      h('div', { 'data-testid': 'alert' }, message),
    IconFont: (props: Record<string, any>) =>
      h('span', { 'data-iconfont': props.type }),
    useOverlayScroller: () => ({
      initialize: () => {},
      updateScrollerPosition: () => {}
    }),
    useRequestToken: () => () => ({ token: {}, cancel: () => {} }),
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

test('a systemone 501 surfaces as a message instead of crashing the page', async () => {
  // A real origin (not about:blank) so jsdom enables localStorage.
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/'
  });
  // Expose the jsdom realm on globalThis: rc-util's isDOM() and friends
  // instanceof-check global constructors (HTMLElement, SVGElement, ...), so
  // enumerate the window instead of hand-picking classes.
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
    // jsdom lacks a few browser APIs the component tree touches.
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
          modelList: [{ value: 'jev-1.13.0', label: 'jev-1.13.0' }],
          loaded: true
        })
      );
    });

    const primaryButton = () =>
      Array.from(container.querySelectorAll('button')).find((button) =>
        button.className.includes('ant-btn-primary')
      );
    assert.ok(primaryButton(), 'the submit button is rendered');

    await act(async () => {
      primaryButton()!.click();
    });

    assert.match(
      container.textContent || '',
      /This model is not a decision model/,
      'the engine message is rendered inline'
    );
    assert.ok(primaryButton(), 'the submit button is back after the failure');

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
