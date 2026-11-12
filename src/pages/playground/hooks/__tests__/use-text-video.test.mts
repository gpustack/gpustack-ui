import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement, useRef } from 'react';
import type { createVideoPollingController } from '../../video/video-polling';

const cache = new Map<string, boolean>();
let pathname = '/playground/video';
const pending: {
  signal: AbortSignal;
  progress: (value: number) => void;
  resolve: (value: Blob) => void;
  reject: (error: Error) => void;
  polling: ReturnType<typeof createVideoPollingController>;
}[] = [];

mock.module('@umijs/max', {
  namedExports: { useLocation: () => ({ pathname }) }
});
mock.module(new URL('../../../../atoms/route-cache.ts', import.meta.url).href, {
  namedExports: {
    setRouteCache: (key: string, value: boolean) => cache.set(key, value)
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: { useOverlayScroller: () => ({ initialize() {} }) }
});
mock.module(
  new URL('../../../../utils/download-stream.ts', import.meta.url).href,
  {
    namedExports: { readResponseError: async (error: Error) => error.message }
  }
);
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: { extractErrorMessage: (error: string) => error }
});
mock.module(new URL('../../video/video-generation.ts', import.meta.url).href, {
  namedExports: {
    generateVideo: (
      _parameters: unknown,
      signal: AbortSignal,
      progress: (value: number) => void,
      polling: ReturnType<typeof createVideoPollingController>
    ) =>
      new Promise<Blob>((resolve, reject) =>
        pending.push({ signal, progress, resolve, reject, polling })
      )
  }
});

test('video generation retains its route while hidden and releases it on completion, failure, cancel and unmount', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    pretendToBeVisual: true
  });
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
  const { default: useTextVideo } = await import('../use-text-video');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const route = '/playground/video';
  const video = new Blob(['video'], { type: 'video/mp4' });
  let current: ReturnType<typeof useTextVideo>;
  const Harness = ({ hidden = false }: { hidden?: boolean }) => {
    current = useTextVideo(useRef<HTMLDivElement>(null));
    return createElement('div', { hidden });
  };
  const start = async () => {
    await act(async () => {
      void current!.submitMessage({ model: 'video-model', prompt: 'A lake' });
    });
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    await start();
    assert.equal(cache.get(route), true);
    pathname = '/playground/text-to-image';
    await act(async () =>
      root.render(createElement(Harness, { hidden: true }))
    );
    assert.equal(pending[0].signal.aborted, false);
    assert.equal(cache.get(route), true);
    let resumed = false;
    const resume = pending[0].polling
      .waitUntilActive(pending[0].signal)
      .then(() => {
        resumed = true;
      });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(resumed, false);
    Object.defineProperty(dom.window.document, 'hidden', {
      configurable: true,
      value: true
    });
    pathname = '/playground/VIDEO/';
    await act(async () => root.render(createElement(Harness)));
    assert.equal(resumed, false);
    await act(async () => {
      Object.defineProperty(dom.window.document, 'hidden', {
        configurable: true,
        value: false
      });
      dom.window.document.dispatchEvent(
        new dom.window.Event('visibilitychange')
      );
      await resume;
    });
    assert.equal(resumed, true);
    assert.equal(pending.length, 1);
    await act(async () => pending[0].progress(42));
    assert.equal(current!.progress, 42);
    await act(async () => pending[0].resolve(video));
    assert.equal(cache.get(route), false);
    const resultUrl = current!.videoUrl;
    assert.ok(resultUrl.startsWith('blob:'));
    await act(async () => root.render(createElement(Harness)));
    assert.equal(current!.videoUrl, resultUrl);

    await start();
    await start();
    assert.equal(pending[1].signal.aborted, true);
    await act(async () => pending[1].reject(new Error('stale error')));
    assert.equal(cache.get(route), true);
    assert.equal(current!.loading, true);
    await act(async () => pending[2].reject(new Error('current error')));
    assert.equal(cache.get(route), false);
    assert.equal(current!.errorMessage, 'current error');

    await start();
    await act(async () => current!.handleStopConversation());
    assert.equal(pending[3].signal.aborted, true);
    assert.equal(cache.get(route), false);
    await act(async () => pending[3].resolve(video));
    assert.equal(current!.videoUrl, '');

    await start();
    await act(async () => current!.handleClear());
    assert.equal(pending[4].signal.aborted, true);
    assert.equal(cache.get(route), false);
    await act(async () => pending[4].reject(new Error('cleared error')));
    assert.equal(current!.errorMessage, '');
    await start();
  } finally {
    await act(async () => root.unmount());
    assert.equal(pending.at(-1)!.signal.aborted, true);
    assert.equal(cache.get(route), false);
    pending.at(-1)!.resolve(video);
    await new Promise<void>((resolve) => setImmediate(resolve));
    keys.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
    dom.window.close();
  }
});
