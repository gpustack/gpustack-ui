import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { mock } from 'node:test';
import { promisify } from 'node:util';

mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: { CREATE_VIDEO_API: '/v1/videos' }
});

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { origin: 'http://localhost:8080' } }
});

const { generateCode, generateVideoCurlCode } = await import('../video');

test('the video API example creates, polls and downloads through instance-bound public jobs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'video-curl-'));
  try {
    const prompt = "It's snowing: $(printf injected)";
    const code = generateVideoCurlCode({
      api: '/model/proxy/v1/videos',
      modelProxy: true,
      routeID: 7,
      parameters: { model: 'video-model', prompt, seconds: 4, seed: 0 }
    });
    const script = `
set -e
curl() {
  printf '%s\\0' "$@" >> "$CURL_ARGS_FILE"
  for argument; do
    case "$argument" in http://*) url="$argument" ;; esac
  done
  case "$url" in
    */content) printf 'video-bytes' > output.mp4 ;;
    */video-1) printf '{"id":"video-1","status":"completed"}' ;;
    *) printf '{"id":"video-1","status":"queued"}' ;;
  esac
}
jq() {
  for field; do :; done
  "$NODE_BINARY" -e 'const fs = require("node:fs"); process.stdout.write(String(JSON.parse(fs.readFileSync(0, "utf8"))[process.argv[1].slice(1)]));' "$field"
}
sleep() { :; }
${code}
`;
    const result = spawnSync('/bin/bash', ['-c', script], {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_BINARY: process.execPath,
        CURL_ARGS_FILE: join(directory, 'arguments'),
        YOUR_GPUSTACK_API_KEY: 'test-key'
      }
    });
    assert.equal(result.status, 0, result.stderr);
    const args = readFileSync(join(directory, 'arguments'), 'utf8').split('\0');
    assert.deepEqual(
      args.filter((value) => value.startsWith('http://')),
      [
        'http://localhost:8080/v1/videos',
        'http://localhost:8080/v1/videos/video-1',
        'http://localhost:8080/v1/videos/video-1/content'
      ]
    );
    assert.ok(args.includes(`prompt=${prompt}`));
    assert.ok(args.includes('seed=0'));
    assert.ok(args.includes('--form-string'));
    assert.ok(!args.includes('Content-Type: application/json'));
    assert.equal(
      readFileSync(join(directory, 'output.mp4'), 'utf8'),
      'video-bytes'
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('the curl upload accepts a reference filename with spaces, commas and semicolons', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'video-upload-'));
  const image = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2]);
  const output = Buffer.from('generated-video-bytes');
  const filename = 'reference, frame;1.png';
  const referencePath = join(directory, filename);
  writeFileSync(referencePath, image);
  const received: { path?: string; body: Buffer }[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    received.push({ path: request.url, body: Buffer.concat(chunks) });
    response.setHeader('Connection', 'close');
    if (request.method === 'POST') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: 'video-1', status: 'completed' }));
    } else if (request.url === '/v1/videos/video-1/content') {
      response.setHeader('Content-Type', 'video/mp4');
      response.end(output);
    } else {
      response.writeHead(404).end();
    }
  });
  const origin = window.location.origin;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    Object.defineProperty(window.location, 'origin', {
      configurable: true,
      value: `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    });
    const { curlCode } = generateCode({
      api: '/v1/videos',
      parameters: {
        model: 'video-model',
        prompt: 'Animate this image',
        input_reference: new File([image], filename, { type: 'image/png' })
      }
    });
    const script = `
set -e
jq() {
  for field; do :; done
  "$NODE_BINARY" -e 'const fs = require("node:fs"); process.stdout.write(String(JSON.parse(fs.readFileSync(0, "utf8"))[process.argv[1].slice(1)]));' "$field"
}
${curlCode}
`;
    await promisify(execFile)('/bin/bash', ['-c', script], {
      cwd: directory,
      timeout: 10000,
      env: {
        ...process.env,
        NODE_BINARY: process.execPath,
        INPUT_REFERENCE_PATH: referencePath,
        YOUR_GPUSTACK_API_KEY: 'test-key'
      }
    });
    assert.deepEqual(
      received.map(({ path }) => path),
      ['/v1/videos', '/v1/videos/video-1/content']
    );
    assert.ok(received[0].body.includes(image));
    assert.ok(received[0].body.includes(Buffer.from(`filename="${filename}"`)));
    assert.deepEqual(readFileSync(join(directory, 'output.mp4')), output);
  } finally {
    Object.defineProperty(window.location, 'origin', {
      configurable: true,
      value: origin
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(directory, { recursive: true, force: true });
  }
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
