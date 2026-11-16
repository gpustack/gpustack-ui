import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

let changeExtra: (event: { target: { value: string } }) => void;
mock.module('@gpustack/core-ui', {
  namedExports: {
    CollapsePanel: ({ items }: any) => items[0].children,
    Input: {
      TextArea: ({ value, onChange, id }: any) => {
        changeExtra = onChange;
        return createElement('textarea', { id, value, onChange });
      }
    }
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
  defaultExport: () => null
});

test('video extras validate as an optional JSON object and reset on model change', async () => {
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
    { label: 'H3', value: 'minimax-h3' },
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
      onValuesChange: current.handleOnValuesChange
    });
  };
  const change = async (value: string) => {
    await act(async () => changeExtra({ target: { value } }));
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    const extra = JSON.stringify({
      task: 't2va',
      conditions: [],
      target: { short_edge: 720, aspect_ratio: '9:16', duration_seconds: 4 }
    });
    await change(extra);
    assert.equal(current!.parameters.extra_body, extra);
    await act(async () => {
      assert.equal(
        (await current!.form.current.form.validateFields()).extra_body,
        extra
      );
    });

    for (const invalid of ['{', '[]', 'null', '"t2va"', 'false', '4']) {
      await change(invalid);
      await act(async () => {
        await assert.rejects(current!.form.current.form.validateFields(), {
          errorFields: [
            {
              name: ['extra_body'],
              errors: ['playground.video.extraParams.invalid'],
              warnings: []
            }
          ]
        });
      });
    }
    for (const optional of ['', '  ', '{}']) {
      await change(optional);
      await act(async () => {
        await current!.form.current.form.validateFields();
      });
    }

    await change(extra);
    await act(async () =>
      current!.handleOnValuesChange(
        { model: 'wan' },
        { ...current!.parameters, model: 'wan' }
      )
    );
    assert.equal(current!.parameters.extra_body, undefined);
    assert.equal(
      current!.form.current.form.getFieldValue('extra_body'),
      undefined
    );
    assert.equal(dom.window.document.querySelector('textarea')?.value, '');
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
