import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { mock } from 'node:test';
import {
  forwardRef,
  createElement as h,
  useImperativeHandle,
  useRef
} from 'react';

let search = '';
let nextId = 0;
const requests: { url: string; method: string; data: any }[] = [];
const noop = () => {};
const childrenOnly = ({ children }: any) => children;

// Avoid loading the ahooks barrel's unrelated browser integrations in Node.
const require = createRequire(import.meta.url);
mock.module('ahooks', {
  namedExports: {
    useMemoizedFn: require('ahooks/lib/useMemoizedFn').default
  }
});

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: { id: string }) => id
    }),
    useSearchParams: () => [new URLSearchParams(search)],
    request: async (url: string, options: any) => {
      requests.push({ url, method: options.method, data: options.data });
      return url.endsWith('/embeddings')
        ? { data: [{ embedding: [0, 1] }, { embedding: [1, 0] }], usage: {} }
        : { results: [{ index: 0, relevance_score: 0.5 }], usage: {} };
    }
  }
});

// Keep the real pages, forms, ModelSelect, parameter hook and API adapters.
// Only replace visual controls and browser-only output/scroll machinery.
mock.module('@gpustack/core-ui', {
  namedExports: {
    Select: forwardRef<HTMLSelectElement, any>((props, ref) =>
      h(
        'select',
        {
          ref,
          id: props.id,
          'aria-label': 'Model',
          value: props.value ?? '',
          onChange: (event: any) => props.onChange?.(event.target.value)
        },
        props.options.map((option: any) =>
          h('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    FieldComponent: (props: any) =>
      h('input', {
        'aria-label': props.label,
        type: 'number',
        value: props.value ?? '',
        onChange: (event: any) => props.onChange?.(Number(event.target.value))
      }),
    InputNumber: () => null,
    AlertInfo: () => null,
    HighlightCode: () => null,
    IconFont: () => null,
    ResizePanel: forwardRef((_props: any, _ref) => _props.children),
    useOverlayScroller: () => ({
      initialize: noop,
      updateScrollerPosition: noop
    }),
    useRequestToken: () => () => ({ token: {}, cancel: noop })
  }
});
mock.module('@gpustack/core-ui/charts', {
  namedExports: { ScatterChart: () => null }
});
mock.module('styled-components', {
  defaultExport: Object.assign((component: any) => () => component, {
    div: () => 'div'
  })
});
mock.module(new URL('../components/input-list.tsx', import.meta.url).href, {
  defaultExport: forwardRef((_props, ref) => {
    useImperativeHandle(ref, () => ({ setMessageId: () => ++nextId }));
    return null;
  })
});
mock.module(
  new URL('../components/right-container.tsx', import.meta.url).href,
  {
    defaultExport: childrenOnly
  }
);
mock.module(new URL('../components/token-usage.tsx', import.meta.url).href, {
  defaultExport: () => null
});
mock.module(
  new URL('../components/view-common-code.tsx', import.meta.url).href,
  {
    defaultExport: () => null
  }
);
mock.module(new URL('../hooks/use-embedding-worker.ts', import.meta.url).href, {
  defaultExport: () => {
    const workerRef = useRef<any>({});
    return {
      workerRef,
      createWorker: noop,
      terminateWorker: noop,
      postMessage: () =>
        workerRef.current.onmessage?.({
          data: {
            scatterData: [],
            embeddingData: { code: '[]', copyValue: '[]' }
          }
        })
    };
  }
});
for (const stylesheet of [
  'ground-llm.less',
  'rerank.less',
  'system-message-wrap.less'
]) {
  mock.module(new URL(`../style/${stylesheet}`, import.meta.url).href, {
    defaultExport: {}
  });
}

const modelList = [
  { value: 'model-a', label: 'Model A', meta: {} },
  { value: 'model-b', label: 'Model B', meta: {} }
];

for (const playground of ['embedding', 'rerank'] as const) {
  for (const preselectFromUrl of [false, true]) {
    test(`${playground} submits the selected model after switching ${preselectFromUrl ? 'from a URL-preselected model' : 'from the default model'}`, async () => {
      search = preselectFromUrl ? 'model=model-b' : '';
      requests.length = 0;
      const dom = new JSDOM('<!doctype html><div id="root"></div>', {
        url: `http://localhost/?${search}`
      });
      const globals = [
        'window',
        'document',
        'navigator',
        'IS_REACT_ACT_ENVIRONMENT',
        ...Object.getOwnPropertyNames(dom.window).filter(
          (key) => !(key in globalThis)
        )
      ];
      const saved = globals.map((key) =>
        Object.getOwnPropertyDescriptor(globalThis, key)
      );
      globals.forEach((key) =>
        Object.defineProperty(globalThis, key, {
          configurable: true,
          value:
            key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
        })
      );
      dom.window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: noop,
        removeListener: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false
      });

      const { act } = await import('react');
      const { createRoot } = await import('react-dom/client');
      const { default: Page } =
        playground === 'embedding'
          ? await import('../embedding/page')
          : await import('../rerank/page');
      const container = dom.window.document.getElementById('root')!;
      const root = createRoot(container);
      try {
        await act(async () => root.render(h(Page, { modelList })));
        const select = container.querySelector<HTMLSelectElement>(
          'select[aria-label="Model"]'
        )!;
        const initialModel = preselectFromUrl ? 'model-b' : 'model-a';
        const otherModel = preselectFromUrl ? 'model-a' : 'model-b';
        assert.equal(select.value, initialModel);

        const submit = async (expectedModel: string) => {
          const count = requests.length;
          const button = container.querySelector<HTMLButtonElement>(
            playground === 'embedding'
              ? 'button.ant-btn-primary'
              : 'button.ant-input-search-btn'
          );
          assert.ok(button, 'the page has a submit button');
          await act(async () => button.click());
          assert.equal(requests.length, count + 1);
          const request = requests.at(-1)!;
          assert.equal(
            request.url,
            playground === 'embedding' ? '/v1/embeddings' : '/v1/rerank'
          );
          assert.equal(request.method, 'POST');
          assert.equal(request.data.model, expectedModel);
          if (playground === 'embedding') {
            assert.ok(request.data.input.length >= 2);
          } else {
            assert.ok(request.data.query);
            assert.ok(request.data.documents.length > 0);
            assert.equal(request.data.top_n, 3);
          }
        };
        const changeModel = async (model: string) => {
          await act(async () => {
            select.value = model;
            select.dispatchEvent(
              new dom.window.Event('change', { bubbles: true })
            );
          });
          assert.equal(select.value, model);
        };

        await submit(initialModel);
        // No other parameter edits between selecting a model and submitting:
        // those edits could accidentally copy the new model into parameters.
        await changeModel(otherModel);
        await submit(otherModel);
        await changeModel(initialModel);
        await submit(initialModel);
      } finally {
        await act(async () => root.unmount());
        globals.forEach((key, index) => {
          const descriptor = saved[index];
          if (descriptor) Object.defineProperty(globalThis, key, descriptor);
          else delete (globalThis as any)[key];
        });
        dom.window.close();
      }
    });
  }
}
