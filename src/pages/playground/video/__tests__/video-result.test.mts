import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement as h } from 'react';
import type { VideoJob } from '../../apis';

let pathname = '/playground/video';
const text = ({ children }: any) => h('span', null, children);
mock.module('@umijs/max', {
  namedExports: {
    useLocation: () => ({ pathname }),
    useIntl: () => ({ locale: 'en-US', formatMessage: ({ id }: any) => id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertInfo: ({ message }: any) => h('span', { role: 'alert' }, message),
    StatusDot: ({ statusValue }: any) => h('span', null, statusValue.text)
  }
});
mock.module('antd', {
  namedExports: {
    Flex: ({ children, className }: any) => h('div', { className }, children),
    Button: ({ children, onClick, disabled }: any) =>
      h('button', { onClick, disabled }, children),
    Typography: { Text: text },
    Spin: () => h('span', { role: 'progressbar' })
  }
});
mock.module('@ant-design/icons', {
  namedExports: {
    LoadingOutlined: () => null,
    VideoCameraOutlined: () => null
  }
});
mock.module(new URL('../video.module.less', import.meta.url).href, {
  defaultExport: {
    centeredResult: 'centeredResult',
    pendingMedia: 'pendingMedia',
    videoStatus: 'videoStatus'
  }
});
const { default: VideoResult } = await import('../video-result');

test('one result renders queued/generating/progress/playback, and pauses the player on route or tab changes', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    pretendToBeVisual: true
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true
  };
  const previous = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { configurable: true, value });
  let hidden = false;
  Object.defineProperty(dom.window.document, 'hidden', { get: () => hidden });
  let pauses = 0;
  const pause = mock.method(
    dom.window.HTMLMediaElement.prototype,
    'pause',
    () => {
      pauses++;
    }
  );
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const doc = dom.window.document;
  const render = async (
    job?: VideoJob,
    url = '',
    loading = false,
    generating = job?.status === 'queued' || job?.status === 'in_progress',
    contentError: { message?: string } | null = null
  ) =>
    act(async () =>
      root.render(
        h(VideoResult, {
          job,
          generating,
          url,
          loading,
          contentError,
          onRetryContent() {},
          onPlaybackError() {}
        })
      )
    );
  try {
    await render();
    assert.match(doc.body.textContent!, /playground.video.empty.tips/);
    await render({ id: 'native', status: 'queued' });
    assert.equal(doc.querySelector('[role=progressbar]'), null);
    const player = doc.querySelector('video')!;
    assert.ok(player);
    assert.equal(player.controls, true);
    assert.equal(player.tabIndex, -1);
    assert.equal(player.getAttribute('aria-hidden'), 'true');
    assert.equal(player.hasAttribute('src'), false);
    assert.match(doc.body.textContent!, /status.queued/);
    assert.equal(doc.querySelector('button'), null);
    await render({ id: 'native', status: 'in_progress', progress: 0 });
    assert.ok(doc.querySelector('[role=progressbar]'));
    assert.ok(doc.querySelector('.centeredResult .pendingMedia .videoStatus'));
    assert.equal(doc.querySelector('video'), player);
    assert.match(doc.body.textContent!, /playground.video.generating/);
    assert.doesNotMatch(doc.body.textContent!, /0%/);
    await render({ id: 'native', status: 'in_progress', progress: 35.5 });
    const status = doc.querySelector('.videoStatus')!;
    assert.equal(status.textContent, '36%');
    assert.ok(status.querySelector('[role=progressbar]'));
    for (const status of ['queued', 'in_progress'] as const) {
      await render({ id: 'native', status }, '', false, false);
      assert.equal(doc.getElementById('root')?.firstChild, null);
    }
    await render(
      {
        id: 'native',
        status: 'completed',
        prompt: 'A city',
        created_at: 1795500000,
        backend: 'vLLM'
      },
      'blob:video'
    );
    const completedPlayer = doc.querySelector<HTMLVideoElement>(
      '.centeredResult video'
    )!;
    assert.ok(completedPlayer);
    assert.equal(completedPlayer.controls, true);
    assert.equal(completedPlayer.preload, 'metadata');
    assert.equal(completedPlayer.hasAttribute('tabindex'), false);
    assert.equal(completedPlayer.getAttribute('src'), 'blob:video');
    assert.equal(completedPlayer.style.visibility, 'hidden');
    await act(async () => {
      completedPlayer.dispatchEvent(new dom.window.Event('loadedmetadata'));
    });
    assert.equal(completedPlayer.style.visibility, '');
    assert.equal(doc.querySelector('.videoStatus'), null);
    assert.equal(doc.querySelector('button'), null);
    assert.equal(doc.body.textContent, 'vLLM');

    Object.defineProperty(completedPlayer, 'paused', { value: false });
    await render({ id: 'native', status: 'completed' }, 'blob:video', true);
    const pendingPlayer = doc.querySelector('video')!;
    assert.notEqual(pendingPlayer, completedPlayer);
    assert.equal(pendingPlayer.hasAttribute('src'), false);
    assert.equal(pauses, 1);

    pathname = '/models';
    await render({ id: 'native', status: 'completed' }, 'blob:video');
    assert.equal(pauses, 2);
    pathname = '/playground/video';
    await render({ id: 'native', status: 'completed' }, 'blob:video');
    hidden = true;
    doc.dispatchEvent(new dom.window.Event('visibilitychange'));
    assert.equal(pauses, 3);
    await render({
      id: 'native',
      status: 'failed',
      error: { message: 'Generation failed' }
    });
    assert.equal(
      doc.querySelector('[role=alert]')?.textContent,
      'Generation failed'
    );
    assert.equal(doc.querySelector('button'), null);
    const completedJob = { id: 'native', status: 'completed' } as const;
    await render(completedJob, '', false, false, {});
    assert.equal(doc.querySelector('[role=alert]'), null);
    assert.equal(
      doc.querySelector('button')?.textContent,
      'common.button.retry'
    );
    await render(completedJob, '', false, false, {
      message: 'Content unavailable'
    });
    assert.equal(
      doc.querySelector('[role=alert]')?.textContent,
      'Content unavailable'
    );
  } finally {
    await act(async () => root.unmount());
    pause.mock.restore();
    dom.window.close();
    pathname = '/playground/video';
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
