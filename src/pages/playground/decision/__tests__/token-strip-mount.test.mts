import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { createElement as h } from 'react';

// Regression harness for the token-strip insertBefore crash:
// OverlayScrollbars (useOverlayScroller's initialize) restructures the scroll
// host after mount — it moves the host's children into its viewport. The
// strip used to mount as a NEW direct child of the scroll host on the first
// successful run, and React's insertBefore then targeted a sibling the
// scroller had moved away:
//   Failed to execute 'insertBefore' on 'Node': The node before which the
//   new node is to be inserted is not a child of this node.
// Answers keep a stable content wrapper in their scroll host; token usage
// lives in the header and remains visible when the answers are collapsed.
// A DOM ownership regression propagates out of act() and fails this test.

const decisionResponse = {
  model: 'jev-1.13.0',
  answers: {
    department: {
      type: 'choice',
      choice: 'returns',
      confidence: 1,
      probabilities: { returns: 0.65, billing: 0.35 }
    }
  },
  usage: { input_tokens: 120, output_tokens: 8 }
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
    decisionQuery: async () => decisionResponse
  }
});
// JSDOM does not provide layout; browser checks cover measured Splitter sizes.
mock.module('ahooks', { namedExports: { useSize: () => undefined } });
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
    // Mimic the real OverlayScrollbars initialization: after mount it moves
    // the host's children into its own viewport element, so React can no
    // longer insert or remove direct children of the host.
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
    useRequestToken: () => () => ({ token: {}, cancel: () => {} }),
    CopyButton: () => null,

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
// Brought in by the image tray (ThumbImg → SingleImage); the page imports it
// transitively, so its stylesheet needs a stub too.
mock.module(new URL('../../style/thumb-img.less', import.meta.url).href, {
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

test('answer usage mounts in the header without crashing the scroll region', async () => {
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

    // Input and answers have separate scroll hosts. The mock moves each
    // host's children just as the real OverlayScrollbars does after mount.
    const answerScroll =
      container.querySelector<HTMLElement>('.answers-scroll');
    assert.ok(answerScroll, 'the answers scroll region is rendered');
    const answerToggle = () =>
      container.querySelector<HTMLButtonElement>('.answers-header button')!;
    assert.equal(answerToggle().getAttribute('aria-expanded'), 'true');
    assert.equal(answerScroll.hidden, false, 'answers are expanded by default');
    await act(async () => answerToggle().click());
    assert.equal(answerToggle().getAttribute('aria-expanded'), 'false');

    const primaryButton = () =>
      Array.from(container.querySelectorAll('button')).find((button) =>
        button.className.includes('ant-btn-primary')
      );
    assert.ok(primaryButton(), 'the submit button is rendered');

    // Before the wrapper fix this click crashed the commit with
    // insertBefore — the strip mounted as a NEW direct child of the
    // restructured scroll host.
    await act(async () => {
      primaryButton()!.click();
    });
    assert.equal(
      answerToggle().getAttribute('aria-expanded'),
      'true',
      'running reveals the answers panel'
    );

    assert.match(
      container.textContent || '',
      /department/,
      'the answer card is rendered'
    );
    assert.match(
      container.textContent || '',
      /playground\.tokenusage/,
      'the token strip is rendered'
    );
    const answerHeader = container.querySelector('.answers-header')!;
    const usage = answerHeader.querySelector('.reference-params');
    assert.ok(usage, 'usage is rendered in the answer header');
    assert.equal(
      answerScroll.querySelector('.reference-params'),
      null,
      'usage is outside the scrolling answer body'
    );

    await act(async () => answerToggle().click());
    assert.equal(answerScroll.hidden, true, 'collapsing hides the body');
    assert.equal(
      answerHeader.querySelector('.reference-params'),
      usage,
      'usage remains in the header when the body is collapsed'
    );
    await act(async () => answerToggle().click());
    assert.equal(answerScroll.hidden, false, 'expanding restores the body');
    assert.match(
      answerScroll.textContent || '',
      /department/,
      'the result survives collapsing'
    );

    const separator = container.querySelector<HTMLButtonElement>(
      'button[role="separator"]'
    )!;
    await act(async () =>
      separator.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', {
          key: 'ArrowUp',
          bubbles: true
        })
      )
    );
    assert.equal(separator.getAttribute('aria-valuenow'), '144');
    await act(async () =>
      separator.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      )
    );
    assert.equal(separator.getAttribute('aria-valuenow'), '120');

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
