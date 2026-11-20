import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

let changeReference: (event: { target: { value: string } }) => void;
mock.module('@gpustack/core-ui', {
  namedExports: {
    CollapsePanel: ({ items }: any) =>
      createElement(
        'div',
        { 'data-testid': 'advanced-settings' },
        items[0].children
      )
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
    useSearchParams: () => [new URLSearchParams()]
  }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: (...args: any[]) => any) => fn }
});
mock.module(new URL('../../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { generateRandomNumber: () => 1234 }
});
mock.module(
  new URL('../../../components/model-select.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../../components/params-fields.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(new URL('../reference-image-input.tsx', import.meta.url).href, {
  defaultExport: ({ value, onChange, id }: any) => {
    changeReference = onChange;
    return createElement('input', { id, value: value ?? '', onChange });
  }
});

test('video settings omit raw JSON controls and retain validated reference inputs for compatible models', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    pretendToBeVisual: true
  });
  const values = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    ShadowRoot: dom.window.ShadowRoot,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true
  };
  const descriptors = Object.keys(values).map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  Object.defineProperty(dom.window, 'matchMedia', {
    value: () => ({ matches: false, addListener() {}, removeListener() {} })
  });
  const { createRoot } = await import('react-dom/client');
  const { default: DataForm } = await import('../index');
  const { useInitVideoMeta } =
    await import('../../../hooks/use-init-video-meta');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const modelList = [
    {
      label: 'H3',
      value: 'minimax-h3',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: ['t2va'],
          default_task: 't2va'
        }
      }
    },
    { label: 'Wan', value: 'wan' }
  ];
  let current: ReturnType<typeof useInitVideoMeta>;
  const Harness = () => {
    current = useInitVideoMeta({ modelList }, { type: 'create' });
    return createElement(DataForm, {
      ref: current.form,
      initialValues: current.initialValues,
      paramsConfig: current.paramsConfig,
      modelList,
      meta: current.modelMeta,
      onValuesChange: current.handleOnValuesChange
    });
  };
  const change = async (value: string) => {
    await act(async () => changeReference({ target: { value } }));
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.equal(dom.window.document.querySelector('textarea'), null);
    assert.equal(
      dom.window.document.querySelector('[data-testid="advanced-settings"]'),
      null
    );
    await act(async () =>
      current!.handleOnValuesChange({ model: 'wan' }, { model: 'wan' })
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid="advanced-settings"]')
    );
    assert.equal(dom.window.document.querySelector('textarea'), null);
    const reference = 'https://example.com/reference.png';
    await change(reference);
    assert.equal(current!.parameters.referenceImage, reference);
    await act(async () => {
      assert.equal(
        (await current!.form.current.form.validateFields()).referenceImage,
        reference
      );
    });

    for (const invalid of ['invalid URL', 'ftp://example.com/reference.png']) {
      await change(invalid);
      await act(async () => {
        await assert.rejects(current!.form.current.form.validateFields(), {
          errorFields: [
            {
              name: ['referenceImage'],
              errors: ['playground.params.refImage.invalid'],
              warnings: []
            }
          ]
        });
      });
    }
    await change(reference);
    await act(async () =>
      current!.handleOnValuesChange(
        { model: 'minimax-h3' },
        { ...current!.parameters, model: 'minimax-h3' }
      )
    );
    assert.equal(current!.parameters.referenceImage, undefined);
    assert.equal(
      current!.form.current.form.getFieldValue('referenceImage'),
      undefined
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="advanced-settings"]'),
      null
    );
  } finally {
    await act(async () => root.unmount());
    Object.keys(values).forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
    dom.window.close();
  }
});
