import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: { MODEL_PROXY: '/model/proxy' }
});

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { origin: 'http://localhost:8080' } }
});

const { generateImageCode } = await import('../image');

const parameters = {
  model: 'image-model',
  prompt: 'Add "snow"\n雪',
  n: 1,
  size: '512x512',
  seed: 0,
  stream: false,
  response_format: 'b64_json'
};

function executeNodeExample(code: string) {
  const requests: {
    method: string;
    url: string;
    data: Record<string, unknown>;
    config: { headers: Record<string, string> };
  }[] = [];
  const files: string[] = [];
  const send =
    (method: string) =>
    (
      url: string,
      data: Record<string, unknown>,
      config: { headers: Record<string, string> }
    ) => {
      requests.push({ method, url, data, config });
      return Promise.resolve({ data: { data: [{ b64_json: 'image-data' }] } });
    };

  new Function('require', 'console', code)(
    (name: string) => {
      if (name === 'axios') {
        return { post: send('post'), postForm: send('postForm') };
      }
      assert.equal(name, 'fs');
      return {
        createReadStream(filename: string) {
          files.push(filename);
          return { filename };
        }
      };
    },
    { log() {} }
  );

  assert.equal(requests.length, 1);
  return { request: requests[0], files };
}

test('the image generation Node.js example posts JSON parameters', () => {
  const { nodeJsCode } = generateImageCode({
    api: '/v1/images/generations',
    parameters
  });
  const { request, files } = executeNodeExample(nodeJsCode);

  assert.equal(request.method, 'post');
  assert.equal(request.url, 'http://localhost:8080/v1/images/generations');
  assert.deepEqual(request.data, parameters);
  assert.deepEqual(request.config.headers, {
    'Content-type': 'application/json',
    Authorization: 'Bearer ${YOUR_GPUSTACK_API_KEY}'
  });
  assert.deepEqual(files, []);
});

test('the image edit Node.js example uploads an image to the supplied API', () => {
  const { nodeJsCode } = generateImageCode({
    api: '/v1/images/edits',
    parameters: { ...parameters, image: null, mask: null },
    isFormdata: true,
    edit: true
  });
  const { request, files } = executeNodeExample(nodeJsCode);

  assert.equal(request.method, 'postForm');
  assert.equal(request.url, 'http://localhost:8080/v1/images/edits');
  assert.deepEqual(request.data, {
    ...parameters,
    image: { filename: 'image.png' }
  });
  assert.deepEqual(request.config.headers, {
    Authorization: 'Bearer ${YOUR_GPUSTACK_API_KEY}'
  });
  assert.deepEqual(files, ['image.png']);
});

test('the image edit Node.js example supports an optional mask file', () => {
  const { nodeJsCode } = generateImageCode({
    api: '/v1/images/edits',
    parameters: { ...parameters, image: null, mask: null },
    isFormdata: true,
    edit: true
  });
  const { request, files } = executeNodeExample(
    nodeJsCode.replace('// data.mask =', 'data.mask =')
  );

  assert.equal(request.method, 'postForm');
  assert.deepEqual(request.data, {
    ...parameters,
    image: { filename: 'image.png' },
    mask: { filename: 'mask.png' }
  });
  assert.deepEqual(files, ['image.png', 'mask.png']);
});
