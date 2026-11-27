import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

let seed = 1000;
mock.module('@umijs/max', {
  namedExports: { useSearchParams: () => [new URLSearchParams()] }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: (...args: any[]) => any) => fn }
});
mock.module(new URL('../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { generateRandomNumber: () => ++seed }
});

test('video resolution groups, custom values, model changes and seed modes remain coherent', async () => {
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
      label: 'H3 alias',
      value: 'alias',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: ['t2va', 'fl2va'],
          default_task: 't2va',
          default_size: '768x1344',
          resolutions: ['1792x768', '768x1344'],
          duration: { min: 4, max: 15, default: 4 },
          media_inputs: { fl2va: { keyframes: true, max_items: 2 } }
        }
      }
    },
    { label: 'Wan', value: 'wan' },
    {
      label: 'Bounded model',
      value: 'bounded',
      meta: {
        default_width: 832,
        default_height: 480,
        max_width: 832,
        max_height: 480
      }
    }
  ];
  let current: ReturnType<typeof useInitVideoMeta>;
  const Harness = () => {
    current = useInitVideoMeta({ modelList }, { type: 'create' });
    return null;
  };
  const change = async (values: Record<string, unknown>) => {
    await act(async () =>
      current!.handleOnValuesChange(values, {
        ...current!.parameters,
        ...values
      })
    );
  };
  const field = (name: string) =>
    current!.paramsConfig.find((item) => item.name === name);
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.equal(current!.parameters.model, 'alias');
    assert.equal(current!.parameters.task, 't2va');
    assert.equal(current!.parameters.aspectRatio, '9:16');
    assert.equal(current!.parameters.size, '768x1344');
    assert.equal(current!.parameters.random_seed, true);
    assert.equal(field('size')?.type, 'Select');
    assert.equal(current!.videoSizeOptions.length, 21);
    assert.ok(
      !field('aspectRatio')?.options?.some(
        (option) => option.value === 'default'
      )
    );
    assert.ok(
      !current!.videoSizeOptions.some(({ value }) => value === '1792x768')
    );
    assert.equal(field('seconds')?.attrs?.min, 4);
    assert.equal(field('seconds')?.attrs?.max, 15);
    assert.deepEqual(field('seconds')?.rules, [
      { required: true, type: 'integer', min: 4, max: 15 }
    ]);
    assert.equal(current!.parameters.seconds, 4);

    await change({ aspectRatio: '16:9' });
    assert.deepEqual(
      field('size')?.options?.map(({ value }) => value),
      ['832x480', '1280x704', '1280x720', '1344x768', '1920x1080', '3840x2160']
    );
    await change({ size: '1280x720' });
    await change({ aspectRatio: '9:16' });
    assert.equal(current!.parameters.size, '720x1280');
    assert.deepEqual(
      field('size')?.options?.map(({ value }) => value),
      ['480x832', '704x1280', '720x1280', '768x1344', '1080x1920', '2160x3840']
    );

    await change({ aspectRatio: '1:1' });
    assert.equal(current!.parameters.size, '768x768');
    assert.equal(field('size')?.type, 'Select');
    assert.equal(field('size')?.options?.length, 3);

    await change({ aspectRatio: 'custom' });
    assert.equal(field('size'), undefined);
    assert.equal(current!.parameters.size, 'custom');
    assert.equal(current!.parameters.width, 768);
    assert.equal(current!.parameters.height, 768);
    assert.equal(field('width')?.type, 'Slider');
    assert.equal(field('width')?.attrs?.max, 4096);
    await change({ width: 960, height: 544 });
    await change({ aspectRatio: '16:9' });
    assert.equal(field('width'), undefined);
    await change({ aspectRatio: 'custom' });
    assert.equal(current!.parameters.width, 960);
    assert.equal(current!.parameters.height, 544);
    assert.equal(
      current!.paramsConfig.filter(({ name }) => name === 'width').length,
      1
    );
    await change({ aspectRatio: '16:9' });
    assert.equal(current!.parameters.size, '832x480');
    assert.equal(field('size')?.type, 'Select');
    assert.equal(field('width'), undefined);

    let prepared: Record<string, any>;
    await act(async () => {
      prepared = current!.prepareParameters();
    });
    const firstSeed = prepared!.seed;
    await act(async () => {
      prepared = current!.prepareParameters();
    });
    assert.notEqual(prepared!.seed, firstSeed);
    assert.equal(current!.parameters.seed, prepared!.seed);
    await change({ random_seed: false, seed: 0 });
    assert.equal(current!.prepareParameters().seed, 0);
    assert.equal(current!.prepareParameters().seed, 0);

    await change({ task: 'fl2va' });
    assert.equal(current!.parameters.aspectRatio, '9:16');
    assert.equal(current!.parameters.size, '768x1344');
    assert.equal(field('aspectRatio')?.disabled, false);
    assert.equal(field('size')?.type, 'Select');
    assert.ok(!field('size')?.disabled);
    await change({ aspectRatio: '16:9' });
    await change({ size: '1344x768' });
    assert.equal(current!.parameters.size, '1344x768');
    await change({ aspectRatio: 'custom', width: 960, height: 544 });
    assert.equal(field('width')?.type, 'Slider');
    assert.equal(current!.parameters.size, 'custom');
    await change({ firstFrame: 'https://example.com/first.png' });
    await change({ task: 't2va' });
    assert.equal(current!.parameters.aspectRatio, '9:16');
    assert.equal(current!.parameters.firstFrame, undefined);
    assert.equal(field('aspectRatio')?.disabled, false);

    await change({ model: 'wan' });
    assert.equal(field('seconds')?.type, 'InputNumber');
    assert.equal(field('seconds')?.attrs?.min, 1);
    assert.equal(field('seconds')?.attrs?.max, 3600);
    assert.deepEqual(field('seconds')?.rules, [
      { required: true, type: 'integer', min: 1, max: 3600 }
    ]);
    assert.equal(current!.parameters.seconds, 4);
    assert.equal(current!.parameters.task, undefined);
    assert.equal(current!.parameters.aspectRatio, '16:9');
    assert.equal(current!.parameters.random_seed, false);
    assert.equal(current!.parameters.seed, 0);
    assert.equal(current!.videoSizeOptions.length, 21);
    await change({ aspectRatio: 'custom' });
    assert.equal(current!.parameters.width, 832);
    assert.equal(current!.parameters.height, 480);

    await change({ model: 'bounded' });
    assert.deepEqual(
      current!.videoSizeOptions.map(({ value }) => value),
      ['832x480']
    );
    await change({ aspectRatio: '16:9' });
    assert.equal(current!.parameters.size, '832x480');
    assert.equal(field('size')?.type, 'Select');
    assert.equal(field('size')?.options?.length, 1);
    await change({ aspectRatio: 'custom' });
    assert.equal(field('width')?.attrs?.max, 832);
    assert.equal(field('height')?.attrs?.max, 480);

    const unknownBounds = current!.extractIMGMeta({
      max_width: 900,
      max_height: 500
    });
    assert.equal(unknownBounds.form.size, '832x480');
    assert.ok(
      !unknownBounds.sizeOptions.some(({ value }) => value === '900x500')
    );

    let restored: ReturnType<typeof current.restoreParameters>;
    await act(async () => {
      restored = current!.restoreParameters({
        model: 'wan',
        seconds: '8',
        size: '1280x720',
        seed: 0,
        media_inputs: '[{"upload_field":"media_0"}]',
        media_0: new File(['image'], 'image.png'),
        sampling: { temperature: 0.5, steps: [1, null, false] },
        extra_params: { engine_option: 'fast' }
      });
    });
    assert.deepEqual(restored!, { mediaRequired: true });
    assert.equal(current!.parameters.model, 'wan');
    assert.equal(current!.parameters.seconds, 8);
    assert.deepEqual(JSON.parse(current!.parameters.advancedParameters), {
      sampling: { temperature: 0.5, steps: [1, null, false] },
      extra_params: { engine_option: 'fast' }
    });
    assert.equal(current!.parameters.aspectRatio, '16:9');
    assert.equal(current!.parameters.size, '1280x720');
    assert.equal(current!.parameters.random_seed, false);
    assert.equal(current!.prepareParameters().seed, 0);
    assert.deepEqual(current!.parameters.references, []);
    assert.equal(current!.parameters.firstFrame, undefined);
    const previous = current!.parameters;
    await act(async () => {
      restored = current!.restoreParameters({ model: 'missing', seed: 999 });
    });
    assert.equal(restored!, false);
    assert.equal(current!.parameters, previous);
    await act(async () => {
      restored = current!.restoreParameters({ model: 'alias', task: 'ref2va' });
    });
    assert.equal(restored!, false);
    assert.equal(current!.parameters, previous);
    await act(async () => {
      restored = current!.restoreParameters({
        model: 'wan',
        size: '913x517',
        seed: '42',
        seconds: 3600.5
      });
    });
    assert.equal(current!.parameters.aspectRatio, 'custom');
    assert.equal(current!.parameters.size, 'custom');
    assert.equal(current!.parameters.width, 913);
    assert.equal(current!.parameters.height, 517);
    assert.equal(current!.parameters.seed, 42);
    assert.equal(current!.parameters.seconds, 3600);
    assert.equal(field('width')?.type, 'Slider');
    await change({ aspectRatio: '16:9' });
    await change({ aspectRatio: 'custom' });
    assert.equal(current!.parameters.width, 913);
    assert.equal(current!.parameters.height, 517);
    await act(async () => {
      restored = current!.restoreParameters({
        model: 'alias',
        task: 'fl2va',
        size: '1280x720',
        seconds: 18.5,
        seed: 7
      });
    });
    assert.deepEqual(restored!, { mediaRequired: true });
    assert.equal(current!.parameters.seconds, 15);
    assert.equal(current!.parameters.aspectRatio, '16:9');
    assert.equal(current!.parameters.size, '1280x720');
    assert.equal(current!.parameters.task, 'fl2va');
    assert.equal(current!.parameters.firstFrame, undefined);
    assert.ok(!field('size')?.disabled);
    await act(async () => {
      restored = current!.restoreParameters({
        model: 'alias',
        task: 'fl2va',
        size: '960x544'
      });
    });
    assert.equal(current!.parameters.aspectRatio, 'custom');
    assert.equal(current!.parameters.width, 960);
    assert.equal(current!.parameters.height, 544);
    assert.equal(field('height')?.type, 'Slider');
    const firstFrame = new File(['frame'], 'first.png', { type: 'image/png' });
    await act(async () => {
      current!.restoreParameters({
        model: 'alias',
        task: 'fl2va',
        size: '1280x720',
        seed: 9,
        media_0: firstFrame,
        media_inputs: JSON.stringify([
          {
            type: 'image',
            role: 'keyframe',
            frame_index: 0,
            upload_field: 'media_0'
          },
          {
            type: 'image',
            role: 'keyframe',
            frame_index: -1,
            uri: 'https://example.com/last.png'
          }
        ])
      });
    });
    assert.equal(current!.parameters.firstFrame, firstFrame);
    assert.equal(current!.parameters.lastFrame, 'https://example.com/last.png');
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
