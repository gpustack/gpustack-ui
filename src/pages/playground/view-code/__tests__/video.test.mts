import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
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
const { buildVideoParameters } = await import('../../video/media-inputs');
const { createFormData } = createRequire(import.meta.url)(
  '../../../../utils/fetch-chunk-data.ts'
) as typeof import('../../../../utils/fetch-chunk-data');

test('text-only code examples omit hidden reference inputs', () => {
  const parameters = buildVideoParameters(
    {
      model: 'h3',
      task: 't2va',
      firstFrame: new File(['frame'], 'frame.png'),
      references: [{ type: 'video', source: 'https://example.com/video.mp4' }]
    },
    'A city'
  );
  const code = generateCode({ api: '/v1/videos', parameters });
  for (const value of Object.values(code)) {
    assert.doesNotMatch(
      value,
      /media_inputs|input_reference|reference_url|firstFrame|references/
    );
  }
});

test('multipart code examples support distinct image and audio uploads', async () => {
  const parameters = {
    model: 'h3',
    task: 'ref2va',
    prompt: 'A city',
    media_inputs: JSON.stringify([
      { type: 'image', role: 'reference', upload_field: 'media_0' },
      { type: 'audio', role: 'reference', upload_field: 'media_1' }
    ]),
    media_0: new File(['image'], 'image.png', { type: 'image/png' }),
    media_1: new File(['audio'], 'audio.wav', { type: 'audio/wav' })
  };
  const { curlCode, pythonCode, nodeJsCode } = generateCode({
    api: '/v1/videos',
    parameters
  });
  assert.match(curlCode, /MEDIA_0_PATH/);
  assert.match(curlCode, /MEDIA_1_PATH/);
  assert.match(pythonCode, /files\["media_0"\]/);
  assert.match(pythonCode, /files\["media_1"\]/);
  const uploads: string[] = [];
  let submitted: FormData | undefined;
  let calls = 0;
  let complete!: () => void;
  const done = new Promise<void>((resolve) => {
    complete = resolve;
  });
  new Function('require', 'fetch', 'process', 'console', nodeJsCode)(
    (name: string) => {
      if (name === 'node:timers/promises')
        return { setTimeout: async () => {} };
      if (name === 'node:path')
        return { basename: (path: string) => path.split('/').pop() };
      assert.equal(name, 'node:fs/promises');
      return {
        readFile: async (path: string) => {
          uploads.push(path);
          return Buffer.from(path);
        },
        writeFile: async () => complete()
      };
    },
    async (_: string, options?: RequestInit) => {
      calls++;
      if (calls === 1) submitted = options?.body as FormData;
      return {
        ok: true,
        json: async () => ({ id: 'job', status: 'completed' }),
        arrayBuffer: async () => new ArrayBuffer(1)
      };
    },
    {
      env: {
        YOUR_GPUSTACK_API_KEY: 'test-key',
        MEDIA_0_PATH: '/tmp/image.png',
        MEDIA_1_PATH: '/tmp/audio.wav'
      }
    },
    { log() {} }
  );
  await done;
  assert.deepEqual(uploads, ['/tmp/image.png', '/tmp/audio.wav']);
  assert.equal(submitted?.get('media_inputs'), parameters.media_inputs);
  assert.equal((submitted?.get('media_0') as File).type, 'image/png');
  assert.equal((submitted?.get('media_1') as File).type, 'audio/wav');
});

test('the video API example creates, polls and downloads using the requested model route', () => {
  const directory = mkdtempSync(join(tmpdir(), 'video-curl-'));
  try {
    const prompt = "It's snowing: $(printf injected)";
    const parameters = buildVideoParameters(
      { model: 'video-model', seconds: 4, seed: 0, task: 't2va' },
      prompt,
      undefined,
      {
        sampling: { flag: false, note: prompt },
        schedule: [0, null, [true]],
        optional: null
      }
    );
    const code = generateVideoCurlCode({
      api: '/model/proxy/v1/videos',
      modelProxy: true,
      routeID: 7,
      parameters
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
    assert.ok(args.includes('task=t2va'));
    for (const [name, value] of createFormData(parameters)) {
      assert.ok(args.includes(`${name}=${value}`));
    }
    assert.equal(
      args.some((arg) => arg.startsWith('optional=')),
      false
    );
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
  const parameters = {
    model: 'video-model',
    prompt: 'A lake',
    seconds: 4,
    task: 't2va',
    sampling: { flag: false, quote: "It's snowing" },
    schedule: [0, null, [true]],
    optional: null
  };
  const { nodeJsCode, pythonCode } = generateCode({
    api: '/v1/videos',
    parameters
  });
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
  for (const call of calls.slice(1)) {
    assert.equal(
      new Headers(call.options?.headers).get('X-GPUStack-Model'),
      null
    );
  }
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
    Object.fromEntries(createFormData(parameters))
  );
  for (const [key, value] of createFormData(parameters)) {
    assert.ok(
      pythonCode.includes(`${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    );
  }
  assert.doesNotMatch(pythonCode, /"optional"|str\(value\)/);
  assert.equal(writes[0][0], 'output.mp4');
  assert.deepEqual([...(writes[0][1] as Buffer)], [...body]);
});

test('MiniMax H3 code examples emit native engine fields and inline base64 uploads', async () => {
  const firstFrame = new File(['image'], 'first.png', { type: 'image/png' });
  const parameters = {
    model: 'h3',
    task: 'fl2va',
    size: '1280x720',
    seconds: 4,
    prompt: 'Smooth transition',
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
    ]),
    media_0: firstFrame
  };
  const sglangMeta = {
    family: 'minimax_h3',
    request_profile: 'sglang_h3' as const,
    tasks: ['t2va', 'fl2va'],
    default_task: 't2va',
    default_size: '768x1344',
    media_inputs: { fl2va: { keyframes: true, max_items: 2 } }
  };
  const { curlCode, pythonCode, nodeJsCode } = generateCode({
    api: '/v1/videos',
    parameters,
    videoMeta: sglangMeta
  });
  for (const snippet of [curlCode, pythonCode, nodeJsCode]) {
    assert.doesNotMatch(snippet, /media_inputs/);
    assert.match(snippet, /conditions/);
    assert.match(snippet, /MEDIA_0_PATH/);
  }
  assert.match(pythonCode, /import base64/);

  let submitted: FormData | undefined;
  let complete!: () => void;
  const done = new Promise<void>((resolve) => {
    complete = resolve;
  });
  new Function('require', 'fetch', 'process', 'console', nodeJsCode)(
    (name: string) => {
      if (name === 'node:timers/promises')
        return { setTimeout: async () => {} };
      assert.equal(name, 'node:fs/promises');
      return {
        readFile: async (path: string) => {
          assert.equal(path, '/tmp/first.png');
          return Buffer.from('image');
        },
        writeFile: async () => complete()
      };
    },
    async (_: string, options?: RequestInit) => {
      if (options?.method === 'POST') submitted = options.body as FormData;
      return {
        ok: true,
        json: async () => ({ id: 'gpustack_5-12_job', status: 'completed' }),
        arrayBuffer: async () => new ArrayBuffer(1)
      };
    },
    {
      env: {
        YOUR_GPUSTACK_API_KEY: 'test-key',
        MEDIA_0_PATH: '/tmp/first.png'
      }
    },
    { log() {} }
  );
  await done;
  assert.equal(submitted?.get('media_inputs'), null);
  assert.deepEqual(JSON.parse(String(submitted?.get('target'))), {
    short_edge: 720,
    aspect_ratio: '16:9',
    duration_seconds: 4
  });
  assert.deepEqual(JSON.parse(String(submitted?.get('conditions'))), [
    {
      type: 'image',
      role: 'keyframe',
      frame_index: 0,
      uri: 'data:image/png;base64,aW1hZ2U='
    },
    {
      type: 'image',
      role: 'keyframe',
      frame_index: -1,
      uri: 'https://example.com/last.png'
    }
  ]);
});
