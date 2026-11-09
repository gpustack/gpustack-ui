import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { createElement as h } from 'react';

// Request-path regression harness for the image assets feature: uploading
// an image must ride the systemone request as BOTH `assets` (placeholder
// map with raw base64) and a top-level `images` array of FULL data URLs
// (upstream vLLM rejects anything else), with the opt-in
// TypeSafe-Danger-Zone-Images header attached. Without images, none of
// the three may appear. Also pins the non-destructive state injection:
// an object-shaped state is preserved verbatim on upload.

const calls: { payload: any; options?: any }[] = [];
const editors = new Map<string, any>();
let uploadProps: { handleUpdateImgList: (list: any[]) => void } | null = null;
let thumbProps: { onDelete?: (uid: any) => void; dataList?: any[] } | null =
  null;

const fromRoot = (path: string) =>
  new URL(`../../../../${path}`, import.meta.url).href;

// --- module mocks (registered before the page import) ----------------------
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: { id: string }) => id
    }),
    useSearchParams: () => [new URLSearchParams('model=model-a')]
  }
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    SYSTEMONE_API: '/v1/systemone',
    CREAT_IMAGE_API: '/v1-openai/images/generations',
    MODEL_PROXY: '/model/proxy',
    OPENAI_COMPATIBLE: 'v1-openai',
    GPUSTACK_API_BASE_URL: '/gpustack',
    decisionQuery: (payload: any, options?: any) => {
      calls.push({ payload, options });
      return Promise.resolve({
        model: 'model-a',
        answers: {},
        usage: { input_tokens: 1, output_tokens: 1 }
      });
    }
  }
});
// JSDOM does not provide layout; browser checks cover measured Splitter sizes.
mock.module('ahooks', { namedExports: { useSize: () => undefined } });
mock.module('@gpustack/core-ui/json-editor', {
  namedExports: {
    JsonEditor: (props: any) => {
      editors.set(props.path, props);
      return null;
    }
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
    CopyButton: () => null,

    Select: (props: Record<string, any>) =>
      h('input', {
        'data-testid': 'model-select',
        value: props.value ?? '',
        onChange: (event: any) => props.onChange?.(event.target.value)
      })
  }
});
// Upload stub: exposes the page's upload callback so the test can inject a
// base64 image without the real antd Upload/file-reader machinery.
mock.module(new URL('../../components/upload-img', import.meta.url).href, {
  defaultExport: (props: any) => {
    uploadProps = props;
    return h(
      'button',
      { 'data-testid': 'upload-stub', type: 'button' },
      'upload'
    );
  }
});
mock.module(new URL('../../components/thumb-img', import.meta.url).href, {
  defaultExport: (props: any) => {
    thumbProps = props;
    return h(
      'button',
      {
        'data-testid': 'delete-image',
        type: 'button',
        onClick: () => props.onDelete?.(props.dataList?.[0]?.uid)
      },
      'delete'
    );
  }
});
mock.module(new URL('../../style/decision.less', import.meta.url).href, {
  defaultExport: {}
});
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

const PNG_DATA_URL = 'data:image/png;base64,QUJD';

test('image requests carry assets + full data-URL images + the opt-in header', async () => {
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
          modelList: [{ value: 'model-a', label: 'model-a' }],
          loaded: true
        })
      );
    });

    const runButton = () =>
      Array.from(container.querySelectorAll('button')).find((button) =>
        button.className.includes('ant-btn-primary')
      );
    const sampleStateBefore = editors.get(
      'playground-decision-state.json'
    )?.value;

    // 1. Upload one image through the stubbed affordance.
    await act(async () => {
      uploadProps?.handleUpdateImgList([{ dataUrl: PNG_DATA_URL }]);
    });
    // Non-destructive injection: the seeded OBJECT state is preserved
    // verbatim (the placeholder has nothing to append to).
    assert.equal(
      editors.get('playground-decision-state.json')?.value,
      sampleStateBefore,
      'an object-shaped state is not overwritten by an upload'
    );

    // 2. Run with the image: assets map + full data-URL images + header.
    await act(async () => {
      runButton()?.click();
    });
    assert.equal(calls.length, 1);
    const withImage = calls[0];
    assert.deepEqual(withImage.payload.assets, {
      'img-1': { type: 'image', format: 'png', data_base64: 'QUJD' }
    });
    assert.deepEqual(withImage.payload.images, [PNG_DATA_URL]);
    assert.equal(
      withImage.options?.headers?.['TypeSafe-Danger-Zone-Images'],
      'true'
    );

    // 3. Clear the assets panel and run again: no assets / images / header.
    const assetsClear = () =>
      Array.from(
        container.querySelectorAll('.assets-panel button[aria-label]')
      ).find(
        (button) => button.getAttribute('aria-label') === 'common.button.clear'
      );
    await act(async () => {
      assetsClear()?.click();
    });
    await act(async () => {
      runButton()?.click();
    });
    assert.equal(calls.length, 2);
    const withoutImage = calls[1];
    assert.equal(withoutImage.payload.assets, undefined);
    assert.equal(withoutImage.payload.images, undefined);
    assert.equal(
      withoutImage.options?.headers?.['TypeSafe-Danger-Zone-Images'],
      undefined
    );
  } finally {
    for (const [key, descriptor] of defined) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete (globalThis as any)[key];
      }
    }
    descriptors;
  }
});

test('placeholder allocation avoids in-use tokens; deletion strips precisely', async () => {
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
    // The page's delete-warning uses App.useApp(); render inside <App> so
    // the message API exists in the test DOM.
    const { App } = await import('antd');

    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
      root.render(
        h(
          App,
          null,
          h(GroundDecision, {
            modelList: [{ value: 'model-a', label: 'model-a' }],
            loaded: true
          })
        )
      );
    });

    // Questions with in-use tokens: KEY "img-1", escaped reference
    // "\u0069mg-1" (decodes to img-1), and a longer token img-10. Odd
    // one-space indentation on purpose — formatting must survive.
    const questionsText =
      '{"img-1": {"type": "choice", ' +
      '"instructions": "see \\u0069mg-1 and img-10", ' +
      '"criteria": {"a": "ref img-10"}}}';
    const setQuestions = async (text: string) => {
      await act(async () => {
        editors.get('playground-decision-questions.json')?.onChange?.(text);
      });
    };
    await setQuestions(questionsText);

    // Allocation must avoid img-1 (key + escaped reference) and img-10.
    await act(async () => {
      uploadProps?.handleUpdateImgList([
        { dataUrl: 'data:image/png;base64,QUJD' }
      ]);
    });
    const runButton = () =>
      Array.from(container.querySelectorAll('button')).find((button) =>
        button.className.includes('ant-btn-primary')
      );
    await act(async () => {
      runButton()?.click();
    });
    const allocated = Object.keys(
      calls[calls.length - 1].payload.assets || {}
    )[0];
    assert.ok(
      allocated && allocated !== 'img-1' && allocated !== 'img-10',
      `allocation avoided in-use tokens (got ${allocated})`
    );

    // Reference the allocated placeholder with a RAW token, then delete the
    // image: deletion removes ONLY the tray entry — the editors' text is
    // never edited, but a warning tells the user the questions still
    // reference the deleted placeholder (leftover tokens are the user's to
    // clean; auto-stripping JSON risks corrupting unrelated content).
    const withRef = questionsText.replace(
      'see \\u0069mg-1 and img-10',
      `see ${allocated} and img-10`
    );
    await setQuestions(withRef);
    await act(async () => {
      container
        .querySelector('[data-testid="delete-image"]')
        ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    const after = editors.get('playground-decision-questions.json')?.value;
    assert.equal(
      after,
      withRef,
      'deleting an image leaves the editor text byte-for-byte untouched'
    );
    assert.ok(
      after.includes('"img-1":'),
      'the img-1 KEY is untouched by the delete'
    );
    // The warning renders into a portal on <body>; give it a beat.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    assert.ok(
      dom.window.document.body.textContent?.includes(
        'playground.decision.assets.deletedStillReferenced'
      ),
      'a warning is shown when the questions still reference the deleted image'
    );
  } finally {
    for (const [key, descriptor] of defined) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete (globalThis as any)[key];
      }
    }
    descriptors;
  }
});
