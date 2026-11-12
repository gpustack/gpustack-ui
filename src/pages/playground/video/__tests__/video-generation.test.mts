import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const calls: string[] = [];
let createJob: () => Promise<any>;
let pollJob: () => Promise<any>;
const video = new Blob(['video-bytes'], { type: 'video/mp4' });

mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    createVideo: () => {
      calls.push('create');
      return createJob();
    },
    getVideo: (id: string) => {
      calls.push(`poll:${id}`);
      return pollJob();
    },
    getVideoContent: async (id: string) => {
      calls.push(`content:${id}`);
      return video;
    }
  }
});

const { generateVideo } = await import('../video-generation');
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test.beforeEach(() => {
  calls.length = 0;
  createJob = async () => ({ id: 'video-1', status: 'queued', progress: 0 });
  pollJob = async () => ({ id: 'video-1', status: 'completed', progress: 100 });
  mock.timers.enable({ apis: ['setTimeout'] });
});
test.afterEach(() => mock.timers.reset());

test('polls serially and downloads only after completion', async () => {
  const progress: (number | undefined)[] = [];
  const jobs = [
    { id: 'video-1', status: 'in_progress', progress: 42 },
    { id: 'video-1', status: 'completed', progress: 100 }
  ];
  pollJob = async () => jobs.shift();
  const result = generateVideo({}, new AbortController().signal, (p) =>
    progress.push(p)
  );
  await flush();
  assert.deepEqual(calls, ['create']);
  mock.timers.tick(2000);
  await flush();
  assert.deepEqual(calls, ['create', 'poll:video-1']);
  mock.timers.tick(2000);
  assert.equal(await result, video);
  assert.deepEqual(progress, [0, 42, 100]);
  assert.deepEqual(calls, [
    'create',
    'poll:video-1',
    'poll:video-1',
    'content:video-1'
  ]);
});

test('cancel removes the pending poll and does not download', async () => {
  const controller = new AbortController();
  const result = generateVideo({}, controller.signal, () => {});
  await flush();
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
  mock.timers.tick(10000);
  await flush();
  assert.deepEqual(calls, ['create']);
});

test('a late completed poll cannot update progress or download after cancellation', async () => {
  let complete!: (job: any) => void;
  pollJob = () => new Promise((resolve) => (complete = resolve));
  const progress: (number | undefined)[] = [];
  const controller = new AbortController();
  const result = generateVideo({}, controller.signal, (p) => progress.push(p));
  await flush();
  mock.timers.tick(2000);
  await flush();
  controller.abort();
  complete({ id: 'video-1', status: 'completed', progress: 100 });
  await assert.rejects(result, { name: 'AbortError' });
  assert.deepEqual(progress, [0]);
  assert.deepEqual(calls, ['create', 'poll:video-1']);
});

test('a completed create response can download without an extra poll', async () => {
  createJob = async () => ({ id: 'video-1', status: 'completed' });
  assert.equal(
    await generateVideo({}, new AbortController().signal, () => {}),
    video
  );
  assert.deepEqual(calls, ['create', 'content:video-1']);
});

test('failed generation displays the engine error and never downloads', async () => {
  createJob = async () => ({
    id: 'video-1',
    status: 'failed',
    error: { message: 'GPU out of memory' }
  });
  await assert.rejects(
    generateVideo({}, new AbortController().signal, () => {}),
    /GPU out of memory/
  );
  assert.deepEqual(calls, ['create']);
});

test('missing progress remains unknown and is not replaced with a fake percentage', async () => {
  createJob = async () => ({ id: 'video-1', status: 'completed' });
  const progress: (number | undefined)[] = [];
  await generateVideo({}, new AbortController().signal, (p) =>
    progress.push(p)
  );
  assert.deepEqual(progress, [undefined]);
});
