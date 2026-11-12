import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test, { mock } from 'node:test';

mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: { MODEL_PROXY: '/model/proxy' }
});

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { origin: 'http://localhost:8080' } }
});

const { generateCode, generateVideoCurlCode } = await import('../video');

test('the generic video curl example posts multipart fields without executing prompt text', () => {
  const prompt = "It's snowing: $(printf injected)";
  const code = generateVideoCurlCode({
    api: '/v1/videos',
    modelProxy: true,
    routeID: 7,
    parameters: { model: 'video-model', prompt, seconds: 4, seed: 0 }
  });
  const result = spawnSync(
    '/bin/bash',
    ['-c', 'curl() { printf "%s\\0" "$@"; };\n' + code],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        YOUR_API_PATH: 'v1/videos',
        YOUR_GPUSTACK_API_KEY: 'test-key'
      }
    }
  );
  assert.equal(result.status, 0, result.stderr);
  const args = result.stdout.split('\0');
  assert.ok(args.includes('http://localhost:8080/model/proxy/7/v1/videos'));
  assert.ok(args.includes(`prompt=${prompt}`));
  assert.ok(args.includes('seed=0'));
  assert.ok(args.includes('--form-string'));
  assert.ok(!args.includes('Content-Type: application/json'));
});

test('the video Node.js example creates, polls and downloads through the video endpoint', async () => {
  const parameters = { model: 'video-model', prompt: 'A lake', seconds: 4 };
  const { nodeJsCode } = generateCode({ api: '/v1/videos', parameters });
  const calls: { url: string; options?: RequestInit }[] = [];
  const writes: unknown[][] = [];
  const errors: unknown[] = [];
  const body = new Uint8Array([1, 2, 3]);
  const fetchMock = async (url: string, options?: RequestInit) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        id: 'video-1',
        status: calls.length === 1 ? 'queued' : 'completed'
      }),
      arrayBuffer: async () => body.buffer
    };
  };
  new Function('require', 'fetch', 'process', 'console', nodeJsCode)(
    (name: string) => {
      if (name === 'node:timers/promises') {
        return { setTimeout: async () => {} };
      }
      assert.equal(name, 'node:fs/promises');
      return { writeFile: async (...args: unknown[]) => writes.push(args) };
    },
    fetchMock,
    { env: { YOUR_GPUSTACK_API_KEY: 'test-key' } },
    { log() {}, error: (...args: unknown[]) => errors.push(args) }
  );
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(errors, []);
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      'http://localhost:8080/v1/videos',
      'http://localhost:8080/v1/videos/video-1',
      'http://localhost:8080/v1/videos/video-1/content'
    ]
  );
  assert.equal(calls[0].options?.method, 'POST');
  assert.deepEqual(
    Object.fromEntries((calls[0].options?.body as FormData).entries()),
    { model: 'video-model', prompt: 'A lake', seconds: '4' }
  );
  assert.equal(writes[0][0], 'output.mp4');
  assert.deepEqual([...(writes[0][1] as Buffer)], [...body]);
});
