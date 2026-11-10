import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

mock.module('@umijs/max', {
  namedExports: {
    useSearchParams: () => [new URLSearchParams('model=b')]
  }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: (...args: any[]) => any) => fn }
});
mock.module(new URL('../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { generateRandomNumber: () => 1234 }
});

test('image parameters honor an explicit panel model while retaining URL defaults and custom sizes', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const keys = ['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'];
  const descriptors = keys.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  keys.forEach((key) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
    });
  });
  const { createRoot } = await import('react-dom/client');
  const { useInitImageMeta } = await import('../use-init-image');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const modelList = [
    {
      label: 'a',
      value: 'a',
      meta: { default_width: 512, default_height: 512 }
    },
    {
      label: 'b',
      value: 'b',
      meta: { default_width: 1024, default_height: 1024 }
    },
    {
      label: 'c',
      value: 'c',
      meta: { default_width: 768, default_height: 1024 }
    }
  ];
  let current: ReturnType<typeof useInitImageMeta>;
  const Harness = ({ model }: { model?: string }) => {
    current = useInitImageMeta({ modelList, model }, { type: 'create' });
    return null;
  };
  try {
    await act(async () =>
      root.render(createElement(Harness, { key: 'standalone' }))
    );
    assert.equal(current!.parameters.model, 'b');
    assert.equal(current!.parameters.size, '1024x1024');

    await act(async () =>
      root.render(createElement(Harness, { key: 'panel', model: 'c' }))
    );
    assert.equal(current!.parameters.model, 'c');
    assert.equal(current!.parameters.size, '768x1024');
    await act(async () =>
      current!.handleOnValuesChange(
        { size: 'custom' },
        { ...current!.parameters, size: 'custom' }
      )
    );
    assert.equal(current!.parameters.width, 768);
    assert.equal(current!.parameters.height, 1024);
    assert.ok(current!.paramsConfig.some(({ name }) => name === 'width'));
    await act(async () =>
      current!.handleOnValuesChange(
        { size: '512x512' },
        { ...current!.parameters, size: '512x512' }
      )
    );
    assert.equal(current!.parameters.size, '512x512');
    assert.ok(!current!.paramsConfig.some(({ name }) => name === 'width'));
    await act(async () => current!.handleOnModelChange('a'));
    assert.equal(current!.parameters.model, 'a');
    assert.equal(current!.parameters.size, '512x512');

    await act(async () =>
      root.render(createElement(Harness, { key: 'empty', model: '' }))
    );
    assert.equal(current!.parameters.model, '');
  } finally {
    await act(async () => root.unmount());
    keys.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
    dom.window.close();
  }
});

test('shared image parameters preserve zero seeds and validate target dimensions', async () => {
  const { buildImageParameters, getImageParameterErrors } =
    await import('../../images/parameters');
  const parameters = {
    model: 'a',
    n: 1,
    size: 'custom',
    width: 512,
    height: 1024,
    seed: 0,
    random_seed: false,
    preview: 'fast',
    response_format: 'b64_json'
  };
  const request = buildImageParameters(parameters, 'a forest');
  assert.equal(request.seed, 0);
  assert.equal(request.size, '512x1024');
  assert.equal(request.stream, false);
  assert.equal('width' in request, false);
  assert.equal('random_seed' in request, false);
  assert.equal(
    buildImageParameters({ ...parameters, random_seed: true }, 'a forest').seed,
    1234
  );
  assert.deepEqual(
    getImageParameterErrors(
      parameters,
      { max_width: 512, max_height: 512 },
      []
    ),
    ['height']
  );
});
