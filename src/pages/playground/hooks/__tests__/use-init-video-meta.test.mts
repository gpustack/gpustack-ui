import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

mock.module('@umijs/max', {
  namedExports: { useSearchParams: () => [new URLSearchParams()] }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: (...args: any[]) => any) => fn }
});
mock.module(new URL('../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { generateRandomNumber: () => 1234 }
});

test('video capabilities populate task and duration while model changes clear the selected task', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const keys = ['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'];
  const descriptors = keys.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  keys.forEach((key) =>
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
    })
  );
  const { createRoot } = await import('react-dom/client');
  const { useInitVideoMeta } = await import('../use-init-video-meta');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const modelList = [
    {
      label: 'Custom H3 alias',
      value: 'alias',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: ['t2va'],
          default_task: 't2va',
          default_size: '768x1344',
          resolutions: ['768x1344', '1344x768'],
          duration: { min: 4, max: 15, default: 4 }
        }
      }
    },
    { label: 'Wan', value: 'wan' },
    {
      label: 'Reference H3',
      value: 'ref',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: [],
          default_task: null,
          default_size: '768x1344',
          duration: { min: 4, max: 15, default: 4 }
        }
      }
    }
  ];
  let current: ReturnType<typeof useInitVideoMeta>;
  const Harness = () => {
    current = useInitVideoMeta({ modelList }, { type: 'create' });
    return null;
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.equal(current!.parameters.model, 'alias');
    assert.equal(current!.parameters.task, 't2va');
    assert.equal(current!.parameters.size, '768x1344');
    assert.equal(current!.parameters.seconds, 4);
    assert.deepEqual(
      current!.videoSizeOptions.map(({ value }) => value),
      ['768x1344', '1344x768']
    );
    const duration = current!.paramsConfig.find(
      ({ name }) => name === 'seconds'
    );
    assert.equal(duration?.type, 'InputNumber');
    assert.deepEqual(duration?.attrs, {
      min: 4,
      max: 15,
      step: 1,
      precision: 0
    });
    assert.deepEqual(
      current!.paramsConfig.find(({ name }) => name === 'task')?.options,
      [{ label: 't2va', value: 't2va' }]
    );
    await act(async () =>
      current!.handleOnValuesChange({ model: 'wan' }, { model: 'wan' })
    );
    assert.equal(current!.parameters.task, undefined);
    assert.equal(current!.parameters.size, '720x1280');
    assert.ok(
      !current!.videoSizeOptions.some(({ value }) => value === '768x1344')
    );
    assert.ok(!current!.paramsConfig.some(({ name }) => name === 'task'));
    await act(async () =>
      current!.handleOnValuesChange({ model: 'ref' }, { model: 'ref' })
    );
    assert.equal(current!.parameters.task, undefined);
    assert.equal(
      current!.paramsConfig.find(({ name }) => name === 'task')?.disabled,
      true
    );
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
