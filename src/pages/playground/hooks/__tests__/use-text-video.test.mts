import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement, useRef } from 'react';
import type { VideoJob } from '../../apis';
import type { CurrentVideoTask } from '../../video/current-task-cache';

const saved = new Map<string, CurrentVideoTask>();
let create: (
  params: Record<string, unknown>,
  signal: AbortSignal
) => Promise<VideoJob>;
let query: (
  id: string,
  signal: AbortSignal,
  timeout?: number
) => Promise<VideoJob>;
let content: (id: string, signal: AbortSignal) => Promise<Blob>;
let cancel: (id: string, signal: AbortSignal) => Promise<any>;
const revoked: string[] = [];
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: (...args: any[]) => any) => fn }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    useOverlayScroller: () => ({ initialize() {} })
  }
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    createVideo: ({ data, signal }: any) => create(data, signal),
    getVideo: (id: string, signal: AbortSignal, timeout?: number) =>
      query(id, signal, timeout),
    getVideoContent: (id: string, signal: AbortSignal) => content(id, signal),
    cancelVideo: (id: string, signal: AbortSignal) => cancel(id, signal)
  }
});
mock.module(
  new URL('../../video/current-task-cache.ts', import.meta.url).href,
  {
    namedExports: {
      readCurrentVideoTask: async (user: string) => saved.get(user),
      writeCurrentVideoTask: async (user: string, record: CurrentVideoTask) => {
        saved.set(user, record);
      },
      clearCurrentVideoTask: async (user: string) => {
        saved.delete(user);
      }
    }
  }
);
mock.module(
  new URL('../../../../utils/download-stream.ts', import.meta.url).href,
  { namedExports: { readResponseError: async (e: Error) => e.message } }
);
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: { extractErrorMessage: (e: string) => e }
});

const { default: useTextVideo } = await import('../use-text-video');
async function harness(user = 'a') {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    pretendToBeVisual: true
  });
  const globals: Record<string, unknown> = {
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
  const makeURL = mock.method(URL, 'createObjectURL', () => 'blob:video-test');
  const revokeURL = mock.method(URL, 'revokeObjectURL', (url: string) =>
    revoked.push(url)
  );
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  let current: ReturnType<typeof useTextVideo>;
  const Harness = ({ user }: { user: string }) => {
    current = useTextVideo(useRef<HTMLDivElement>(null), user);
    return null;
  };
  const render = async (value = user) => {
    await act(async () =>
      root.render(createElement(Harness, { key: value, user: value }))
    );
  };
  await render();
  return {
    get current() {
      return current!;
    },
    render,
    leave: async () => act(async () => root.render(null)),
    visibility: async (value: boolean) => {
      hidden = value;
      await act(async () => {
        dom.window.document.dispatchEvent(
          new dom.window.Event('visibilitychange')
        );
      });
    },
    close: async () => {
      await act(async () => root.unmount());
      dom.window.close();
      makeURL.mock.restore();
      revokeURL.mock.restore();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  };
}
const defaults = () => {
  saved.clear();
  revoked.length = 0;
  create = async () => ({ id: 'native-1', status: 'queued' });
  query = async (id) => ({ id, status: 'completed' });
  content = async () => new Blob(['video']);
  cancel = async (id) => ({ id, deleted: true });
};

test('one successful creation stores the unchanged ID and request; duplicate POST and concurrent tasks are blocked', async () => {
  defaults();
  let calls = 0;
  let finish!: (job: VideoJob) => void;
  create = async () => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const h = await harness();
  try {
    assert.equal(h.current.currentJob, undefined);
    const params = {
      model: 'wan',
      prompt: 'A city',
      size: '832x480',
      seconds: '4',
      seed: 123
    };
    let request!: Promise<VideoJob | undefined>;
    await act(async () => {
      request = h.current.submitMessage(params);
      void h.current.submitMessage(params);
    });
    assert.equal(calls, 1);
    await act(async () => {
      finish({ id: 'raw/engine-id', status: 'queued' });
      await request;
    });
    assert.deepEqual(saved.get('a'), { video_id: 'raw/engine-id', params });
    await act(async () => {
      await h.current.submitMessage(params);
    });
    assert.equal(calls, 1);
  } finally {
    await h.close();
  }
});

test('reload restores only this user, performs GET rather than POST, loads completed content and releases the Blob', async () => {
  defaults();
  const params = { model: 'wan', prompt: 'Saved prompt', seed: 42 };
  saved.set('a', { video_id: 'native-a', params });
  saved.set('b', { video_id: 'native-b', params: { prompt: 'Other user' } });
  let posts = 0;
  const gets: string[] = [];
  let finishStatus!: (job: VideoJob) => void;
  let finishContent!: (video: Blob) => void;
  create = async () => {
    posts++;
    throw new Error('Unexpected POST');
  };
  query = async (id, _signal, timeout) => {
    gets.push(id);
    assert.equal(timeout, 5000);
    if (id === 'native-a') {
      return new Promise((resolve) => {
        finishStatus = resolve;
      });
    }
    return { id, status: 'completed' };
  };
  content = async (id) => {
    if (id === 'native-a') {
      return new Promise((resolve) => {
        finishContent = resolve;
      });
    }
    return new Blob(['video']);
  };
  const h = await harness();
  try {
    assert.deepEqual(gets, ['native-a']);
    assert.equal(posts, 0);
    assert.equal(h.current.currentPrompt, 'Saved prompt');
    assert.deepEqual(h.current.restoredParameters, params);
    assert.equal(h.current.restoring, true);
    assert.equal(h.current.generating, false);
    await act(async () => {
      finishStatus({ id: 'native-a', status: 'completed' });
    });
    assert.equal(h.current.restoring, true);
    assert.equal(h.current.loading, true);
    assert.equal(h.current.videoUrl, '');
    await act(async () => {
      finishContent(new Blob(['video']));
    });
    assert.equal(h.current.restoring, false);
    assert.equal(h.current.videoUrl, 'blob:video-test');
    assert.equal(h.current.currentJob?.created_at, undefined);
    await h.render('b');
    assert.deepEqual(gets, ['native-a', 'native-b']);
    assert.equal(h.current.currentPrompt, 'Other user');
    assert.equal(revoked.length, 1);
    assert.equal(h.current.hasCachedTask, true);
    await act(async () => h.current.handleClearCache());
    assert.equal(saved.has('b'), false);
    assert.equal(saved.has('a'), true);
    assert.equal(h.current.hasCachedTask, false);
    assert.equal(h.current.currentJob?.id, 'native-b');
    assert.equal(h.current.videoUrl, 'blob:video-test');
    await h.render('c');
    await h.render('b');
    assert.equal(h.current.currentJob, undefined);
    assert.deepEqual(gets, ['native-a', 'native-b']);
  } finally {
    await h.close();
  }
});

test('stop aborts creation, clears the previous video, and ignores a late engine response', async () => {
  defaults();
  saved.set('a', { video_id: 'previous', params: { model: 'wan' } });
  let signal!: AbortSignal;
  let finish!: (job: VideoJob) => void;
  let deletes = 0;
  create = async (_params, requestSignal) => {
    signal = requestSignal;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  cancel = async (id) => {
    deletes++;
    return { id, deleted: true };
  };
  const h = await harness();
  try {
    assert.equal(h.current.videoUrl, 'blob:video-test');
    let request!: Promise<VideoJob | undefined>;
    await act(async () => {
      request = h.current.submitMessage({ model: 'wan', prompt: 'A city' });
    });
    assert.equal(h.current.submitting, true);
    await act(async () => h.current.handleCancel());
    assert.equal(signal.aborted, true);
    assert.equal(h.current.submitting, false);
    assert.equal(h.current.videoUrl, '');
    assert.deepEqual(revoked, ['blob:video-test']);
    await act(async () => {
      finish({ id: 'late', status: 'queued' });
      assert.equal(await request, undefined);
    });
    assert.equal(h.current.currentJob, undefined);
    assert.equal(saved.has('a'), false);
    assert.equal(deletes, 0);
  } finally {
    await h.close();
  }
});

test('pauses polling while hidden and restores the same task after unmounting', async (t) => {
  defaults();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  saved.set('a', { video_id: 'running', params: {} });
  const checks: string[] = [];
  query = async (id) => {
    checks.push(id);
    return { id, status: 'in_progress', progress: checks.length };
  };
  const createRequest = mock.fn(create);
  const cancelRequest = mock.fn(cancel);
  create = createRequest;
  cancel = cancelRequest;
  const h = await harness();
  try {
    assert.equal(checks.length, 1);
    await act(async () => t.mock.timers.tick(4999));
    assert.equal(checks.length, 1);
    await act(async () => t.mock.timers.tick(1));
    assert.equal(checks.length, 2);
    await h.visibility(true);
    await act(async () => t.mock.timers.tick(15000));
    assert.equal(checks.length, 2);
    await h.visibility(false);
    assert.equal(checks.length, 3);
    await h.leave();
    await act(async () => t.mock.timers.tick(10000));
    assert.equal(checks.length, 3);
    assert.equal(saved.get('a')?.video_id, 'running');
    await h.render();
    assert.deepEqual(checks, Array(4).fill('running'));
    assert.equal(h.current.currentJob?.progress, 4);
    assert.equal(createRequest.mock.callCount(), 0);
    assert.equal(cancelRequest.mock.callCount(), 0);
  } finally {
    await h.close();
    t.mock.timers.reset();
  }
});

test('status timeout preserves ID and progress without automatically resubmitting or retrying; returning resumes the same ID', async (t) => {
  defaults();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  saved.set('a', { video_id: 'timeout-id', params: { prompt: 'Original' } });
  let checks = 0;
  query = async (id, signal) => {
    checks++;
    if (checks === 1) return { id, status: 'in_progress', progress: 38 };
    return new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(new Error('aborted')), {
        once: true
      })
    );
  };
  const h = await harness();
  try {
    await act(async () => t.mock.timers.tick(5000));
    await act(async () => t.mock.timers.tick(5000));
    assert.match(h.current.errorMessage, /timed out/);
    assert.equal(h.current.generating, false);
    assert.equal(h.current.loading, false);
    assert.equal(h.current.restoring, false);
    assert.equal(h.current.currentJob?.progress, 38);
    assert.equal(saved.get('a')?.video_id, 'timeout-id');
    await act(async () => t.mock.timers.tick(30000));
    assert.equal(checks, 2);
    query = async (id) => {
      checks++;
      return { id, status: 'failed', error: 'Engine failed' };
    };
    await h.visibility(true);
    await h.visibility(false);
    assert.equal(h.current.currentJob?.status, 'failed');
    assert.equal(h.current.currentJob?.error, 'Engine failed');
    await act(async () => t.mock.timers.tick(15000));
    assert.equal(checks, 3);
  } finally {
    await h.close();
    t.mock.timers.reset();
  }
});

test('a restored status failure silently unlocks submission and preserves the cache until a new task is accepted', async () => {
  defaults();
  const cached = { video_id: 'previous', params: { prompt: 'Original' } };
  saved.set('a', cached);
  query = async () => {
    throw Object.assign(new Error('Status unavailable'), {
      response: { status: 503 }
    });
  };
  create = async () => {
    throw new Error('Creation unavailable');
  };
  const h = await harness();
  try {
    assert.equal(h.current.errorMessage, '');
    assert.equal(h.current.generating, false);
    assert.equal(h.current.submitting, false);
    assert.equal(h.current.restoring, false);
    assert.equal(h.current.loading, false);
    assert.deepEqual(saved.get('a'), cached);

    const params = { model: 'wan', prompt: 'New' };
    await act(async () => {
      await h.current.submitMessage(params);
    });
    assert.equal(h.current.errorMessage, 'Creation unavailable');
    assert.equal(h.current.generating, false);
    assert.deepEqual(saved.get('a'), cached);

    create = async () => ({ id: 'new', status: 'queued' });
    await act(async () => {
      await h.current.submitMessage(params);
    });
    assert.equal(h.current.errorMessage, '');
    assert.equal(h.current.generating, true);
    assert.deepEqual(saved.get('a'), { video_id: 'new', params });
  } finally {
    await h.close();
  }
});

test('a restored 404 silently clears the saved record and is not queried after re-entering', async () => {
  defaults();
  saved.set('a', {
    video_id: 'missing',
    params: { prompt: 'Keep this prompt' }
  });
  const checks: string[] = [];
  query = async (id) => {
    checks.push(id);
    throw Object.assign(new Error('Video not found'), {
      response: { status: 404 }
    });
  };
  const h = await harness();
  try {
    assert.equal(h.current.errorMessage, '');
    assert.equal(h.current.currentJob, undefined);
    assert.equal(h.current.generating, false);
    assert.equal(h.current.restoring, false);
    assert.equal(h.current.loading, false);
    assert.equal(h.current.currentPrompt, 'Keep this prompt');
    assert.equal(saved.has('a'), false);

    await h.visibility(true);
    await h.visibility(false);
    await h.render('b');
    await h.render('a');
    assert.deepEqual(checks, ['missing']);
  } finally {
    await h.close();
  }
});

test('a status 404 leaves a newer task already saved by another tab', async () => {
  defaults();
  saved.set('a', { video_id: 'missing', params: {} });
  let failStatus!: (error: Error) => void;
  query = async () =>
    new Promise((_resolve, reject) => {
      failStatus = reject;
    });
  const h = await harness();
  try {
    const newerTask = { video_id: 'newer', params: {} };
    saved.set('a', newerTask);
    await act(async () => {
      failStatus(
        Object.assign(new Error('Video not found'), {
          response: { status: 404 }
        })
      );
    });
    assert.equal(h.current.currentJob, undefined);
    assert.equal(h.current.errorMessage, '');
    assert.deepEqual(saved.get('a'), newerTask);
  } finally {
    await h.close();
  }
});

test('restored engine failures stay silent and later status responses show engine details', async () => {
  for (const status of ['failed', 'expired', 'cancelled'] as const) {
    defaults();
    const cached = { video_id: 'terminal', params: { prompt: 'Original' } };
    const error = { message: 'Engine failed' };
    saved.set('a', cached);
    query = async (id) => ({ id, status, error });
    const h = await harness();
    try {
      assert.equal(h.current.currentJob?.error, undefined);
      assert.equal(
        h.current.currentJob?.status,
        status === 'failed' ? undefined : status
      );
      assert.equal(h.current.errorMessage, '');
      assert.equal(h.current.generating, false);
      assert.equal(h.current.restoring, false);
      assert.deepEqual(saved.get('a'), cached);

      await h.visibility(true);
      await h.visibility(false);
      assert.equal(h.current.currentJob?.status, status);
      assert.deepEqual(h.current.currentJob?.error, error);
    } finally {
      await h.close();
    }
  }
});

test('restored content failure is silent and an explicit retry shows the download error', async () => {
  defaults();
  const cached = { video_id: 'completed', params: { prompt: 'Original' } };
  saved.set('a', cached);
  const downloads: string[] = [];
  content = async (id) => {
    downloads.push(id);
    throw new Error('Content unavailable');
  };
  const h = await harness();
  try {
    assert.deepEqual(downloads, ['completed']);
    assert.equal(h.current.errorMessage, '');
    assert.equal(h.current.contentError?.message, undefined);
    assert.equal(h.current.loading, false);
    assert.equal(h.current.restoring, false);
    assert.equal(h.current.generating, false);
    assert.deepEqual(saved.get('a'), cached);

    await act(async () => h.current.handleRetryContent());
    assert.deepEqual(downloads, ['completed', 'completed']);
    assert.equal(h.current.contentError?.message, 'Content unavailable');
    assert.equal(h.current.loading, false);

    const params = { prompt: 'New' };
    create = async () => ({ id: 'new', status: 'completed' });
    await act(async () => {
      await h.current.submitMessage(params);
    });
    assert.deepEqual(downloads, ['completed', 'completed', 'new']);
    assert.equal(h.current.contentError?.message, 'Content unavailable');
    assert.deepEqual(saved.get('a'), { video_id: 'new', params });
  } finally {
    await h.close();
  }
});

test('clearing the cached record preserves the task and an active video download', async () => {
  defaults();
  create = async () => ({ id: 'new', status: 'completed' });
  let finish!: (value: Blob) => void;
  let signal!: AbortSignal;
  let deletes = 0;
  content = async (_id, value) => {
    signal = value;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  cancel = async () => {
    deletes++;
    return { id: 'new', deleted: true };
  };
  const h = await harness();
  try {
    await act(async () => {
      await h.current.submitMessage({ prompt: 'A city' });
    });
    assert.equal(h.current.loading, true);
    assert.equal(h.current.hasCachedTask, true);
    await act(async () => h.current.handleClearCache());
    assert.equal(signal.aborted, false);
    assert.equal(h.current.loading, true);
    await act(async () => finish(new Blob(['video'])));
    assert.equal(h.current.videoUrl, 'blob:video-test');
    assert.equal(h.current.currentJob?.id, 'new');
    assert.equal(deletes, 0);
    assert.equal(saved.has('a'), false);
  } finally {
    await h.close();
  }
});

test('clearing the cache keeps polling and leaves the record empty after completion', async (t) => {
  defaults();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  saved.set('a', { video_id: 'running', params: {} });
  let checks = 0;
  query = async (id) => ({
    id,
    status: ++checks === 1 ? 'in_progress' : 'completed'
  });
  const h = await harness();
  try {
    await act(async () => h.current.handleClearCache());
    assert.equal(h.current.generating, true);
    assert.equal(h.current.currentJob?.id, 'running');
    assert.equal(saved.has('a'), false);
    await act(async () => t.mock.timers.tick(5000));
    assert.equal(checks, 2);
    assert.equal(h.current.currentJob?.status, 'completed');
    assert.equal(h.current.videoUrl, 'blob:video-test');
    assert.equal(saved.has('a'), false);
  } finally {
    await h.close();
  }
});

test('cancel clears the current result for both native success shapes and keeps the ID on failure', async () => {
  for (const result of [{ deleted: true }, { status: 'deleted' }]) {
    defaults();
    saved.set('a', { video_id: 'running', params: {} });
    query = async (id) => ({ id, status: 'in_progress' });
    const h = await harness();
    try {
      cancel = async () => {
        throw new Error('Unavailable');
      };
      await act(async () => {
        await h.current.handleCancel();
      });
      assert.equal(saved.get('a')?.video_id, 'running');
      assert.equal(h.current.currentJob?.status, 'in_progress');
      assert.match(h.current.errorMessage, /Unavailable/);
      cancel = async (id) => ({ id, ...result });
      if (result.status) {
        await act(async () => h.current.handleClearCache());
        saved.set('a', { video_id: 'newer', params: {} });
      }
      await act(async () => {
        await h.current.handleCancel();
      });
      assert.equal(h.current.currentJob, undefined);
      assert.equal(h.current.generating, false);
      assert.equal(h.current.errorMessage, '');
      assert.equal(
        saved.get('a')?.video_id,
        result.status ? 'newer' : undefined
      );
    } finally {
      await h.close();
    }
  }
});

test('a failed new POST keeps the previous saved request; successful creation overwrites one slot', async () => {
  defaults();
  const old = { video_id: 'old', params: { prompt: 'Old' } };
  saved.set('a', old);
  query = async (id) => ({ id, status: 'failed' });
  const h = await harness();
  try {
    create = async () => {
      throw new Error('Creation failed');
    };
    await act(async () => {
      await h.current.submitMessage({ prompt: 'New' });
    });
    assert.deepEqual(saved.get('a'), old);
    create = async () => ({ id: 'new-native', status: 'queued' });
    await act(async () => {
      await h.current.submitMessage({ prompt: 'New', seed: 7 });
    });
    assert.equal(saved.size, 1);
    assert.deepEqual(saved.get('a'), {
      video_id: 'new-native',
      params: { prompt: 'New', seed: 7 }
    });
  } finally {
    await h.close();
  }
});

test('adapts MiniMax H3 parameters on wire while persisting canonical UI parameters', async () => {
  defaults();
  const firstFrame = new File(['image'], 'first.png', { type: 'image/png' });
  let sent: Record<string, unknown> | undefined;
  create = async (data) => {
    sent = data;
    return { id: 'gpustack_5-12_job', status: 'queued' };
  };
  const h = await harness();
  try {
    const canonical = {
      model: 'h3',
      task: 'fl2va',
      size: '1280x720',
      seconds: 4,
      prompt: 'Animate',
      media_inputs: JSON.stringify([
        {
          type: 'image',
          role: 'keyframe',
          frame_index: 0,
          upload_field: 'media_0'
        }
      ]),
      media_0: firstFrame
    };
    await act(async () => {
      await h.current.submitMessage(canonical, {
        family: 'minimax_h3',
        request_profile: 'sglang_h3',
        tasks: ['t2va', 'fl2va'],
        default_task: 't2va',
        default_size: '768x1344',
        media_inputs: { fl2va: { keyframes: true, max_items: 2 } }
      });
    });
    assert.equal(sent?.media_inputs, undefined);
    assert.equal(sent?.media_0, undefined);
    assert.deepEqual(sent?.target, {
      short_edge: 720,
      aspect_ratio: '16:9',
      duration_seconds: 4
    });
    assert.deepEqual(sent?.conditions, [
      {
        type: 'image',
        role: 'keyframe',
        frame_index: 0,
        uri: 'data:image/png;base64,aW1hZ2U='
      }
    ]);
    assert.deepEqual(saved.get('a'), {
      video_id: 'gpustack_5-12_job',
      params: canonical
    });
  } finally {
    await h.close();
  }
});
