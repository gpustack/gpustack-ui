import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

// Exercise the installed transport, including its actual retry timer and
// accumulated XHR response contract, without importing browser UI components.
const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
  Worker: {
    configurable: true,
    value: class {
      constructor() {
        throw new Error('Text watches must not allocate a JSON worker');
      }
    }
  }
});
after(() => dom.window.close());
const requests: { options: any; reject: (reason: any) => void }[] = [];
const transportURL = new URL(
  './lib/hooks/use-chunk-request.es.js',
  import.meta.resolve('@gpustack/core-ui')
);
mock.module(new URL('useCoreUIContext.es.js', transportURL).href, {
  defaultExport: () => ({
    services: {
      request: (_url: string, options: any) =>
        new Promise((_resolve, reject) => requests.push({ options, reject }))
    }
  })
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: { WatchEventType: { CREATE: 1, UPDATE: 2, DELETE: 3 } }
});
const { createPaginatedWatchStream } =
  await import('../../utils/paginated-watch.ts');
const { default: useChunkRequest } = await import(transportURL.href);
const { createRoot } = await import('react-dom/client');

for (const replay of [
  '',
  JSON.stringify({ type: 1, data: { id: 200, name: 'survivor' } }) + '\n\n'
]) {
  test(`shared transport reconciles once after retry resumes with ${replay ? 'known rows' : 'an empty replay'}`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    requests.length = 0;
    let transport!: ReturnType<typeof useChunkRequest>;
    function Harness() {
      transport = useChunkRequest();
      return null;
    }
    const root = createRoot(document.getElementById('root')!);
    let disposed = false;
    const dispose = async () => {
      if (disposed) return;
      disposed = true;
      await act(async () => root.unmount());
    };
    t.after(dispose);
    await act(async () => root.render(createElement(Harness)));
    const onEvents = mock.fn();
    const reconcile = mock.fn();
    const stream = createPaginatedWatchStream(onEvents, reconcile);
    await act(async () => {
      transport.setChunkRequest({ url: '/workers', ...stream });
    });
    const progress = async (index: number, response: string) =>
      act(async () => {
        await requests[index].options.onDownloadProgress({
          loaded: response.length,
          currentTarget: { response, readyState: 3 }
        });
      });
    await progress(
      0,
      JSON.stringify({
        type: 1,
        data: { id: 197, name: 'removed during backoff' }
      }) + '\n\n'
    );
    assert.equal(reconcile.mock.callCount(), 0);
    await act(async () => {
      requests[0].reject(new Error('connection lost'));
    });
    assert.equal(reconcile.mock.callCount(), 0);
    await act(async () => t.mock.timers.tick(1999));
    assert.equal(requests.length, 1);
    await act(async () => t.mock.timers.tick(1));
    assert.equal(requests.length, 2);
    assert.equal(reconcile.mock.callCount(), 0);
    await progress(1, replay || '\n\n');
    assert.equal(reconcile.mock.callCount(), 1);
    await progress(1, (replay || '\n\n') + '\n\n');
    assert.equal(reconcile.mock.callCount(), 1);
    if (replay)
      assert.equal(
        onEvents.mock.calls.at(-1)!.arguments[0][0].collection[0].id,
        200
      );
    await act(async () => {
      requests[1].reject(new Error('connection lost again'));
    });
    await dispose();
    await act(async () => t.mock.timers.tick(30000));
    assert.equal(requests.length, 2);
  });
}
