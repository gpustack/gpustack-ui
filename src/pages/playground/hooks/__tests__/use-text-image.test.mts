import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement, useRef } from 'react';

const pending: {
  signal: AbortSignal;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}[] = [];
const loadingChanges: boolean[] = [];
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
mock.module('ahooks', { namedExports: { useMemoizedFn: (fn: any) => fn } });
mock.module('@gpustack/core-ui', {
  namedExports: { useOverlayScroller: () => ({ initialize() {} }) }
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: {
    promptList: [],
    extractErrorMessage: (error: any) =>
      error.message || error.data?.message || 'error'
  }
});
const request = ({ signal }: { signal: AbortSignal }) =>
  new Promise((resolve, reject) => pending.push({ signal, resolve, reject }));
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    CREAT_IMAGE_API: '/v1/images/generations',
    createImage: request,
    editImage: request
  }
});

test('image runs isolate stale failures and completion after cancel, restart and clear', async () => {
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
  const { default: useTextImage } = await import('../use-text-image');
  const root = createRoot(dom.window.document.getElementById('root')!);
  let current: ReturnType<typeof useTextImage>;
  const Harness = () => {
    current = useTextImage({
      scroller: useRef(null),
      API: '/v1/images/generations',
      onLoadingChange: (value: boolean) => loadingChanges.push(value)
    });
    return null;
  };
  const params = { model: 'a', n: 2, size: '512x1024', prompt: 'a forest' };
  const start = async () => {
    await act(async () => {
      void current!.submitMessage(params);
    });
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    await start();
    assert.equal(current!.loading, true);
    await act(async () => current!.handleStopConversation());
    assert.equal(pending[0].signal.aborted, true);
    assert.equal(current!.loading, false);
    await start();
    await act(async () =>
      pending[0].resolve({ error: true, data: { message: 'old error' } })
    );
    assert.equal(current!.loading, true);
    assert.equal(current!.tokenResult, null);
    await act(async () =>
      pending[1].resolve({
        data: [
          { url: 'https://images.example/forest.png' },
          { b64_json: 'image-data' }
        ]
      })
    );
    assert.equal(
      current!.imageList[0].dataUrl,
      'https://images.example/forest.png'
    );
    assert.equal(
      current!.imageList[1].dataUrl,
      'data:image/png;base64,image-data'
    );
    assert.equal(current!.imageList[0].height, 1024);
    assert.equal(current!.loading, false);

    await start();
    await start();
    assert.equal(pending[2].signal.aborted, true);
    await act(async () =>
      pending[2].resolve({ data: [{ b64_json: 'stale' }] })
    );
    assert.equal(current!.loading, true);
    assert.equal(current!.imageList[0].loading, true);
    await act(async () => pending[3].reject(new Error('current error')));
    assert.equal(current!.tokenResult.errorMessage, 'current error');

    await start();
    await act(async () => current!.handleClear());
    assert.equal(pending[4].signal.aborted, true);
    await act(async () => pending[4].reject(new Error('cleared error')));
    assert.deepEqual(current!.imageList, []);
    assert.equal(current!.tokenResult, null);
    assert.equal(current!.loading, false);
    await start();
  } finally {
    await act(async () => root.unmount());
    assert.equal(pending.at(-1)!.signal.aborted, true);
    assert.equal(loadingChanges.at(-1), false);
    keys.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
    dom.window.close();
  }
});
