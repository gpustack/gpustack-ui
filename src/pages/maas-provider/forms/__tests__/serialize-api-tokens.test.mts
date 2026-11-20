import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

mock.module('@/config', {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit', COPY: 'copy' }
  }
});

const {
  buildProviderSubmitPayload,
  default: serializeApiTokens,
  isSavedTokenless
} = await import('../serialize-api-tokens.ts');

// Regression fixture for gpustack/gpustack#6855: a tokenless provider
// (self-hosted, no-auth endpoint) must omit api_tokens on submit — the
// backend validator rejects an explicit empty array.
const tokenlessValues: any = {
  name: 'npu-bge-120-emb',
  api_key: '',
  api_tokens: [],
  config: { type: 'openai', openaiCustomUrl: 'http://192.168.10.120:8101/v1' },
  models: [{ name: 'bge-m3-npu', category: 'embedding', accessible: null }]
};

const tokenlessProvider: any = {
  id: 1,
  name: 'npu-bge-120-emb',
  api_tokens: [],
  config: { type: 'openai' }
};

test('tokenless providers omit api_tokens instead of sending []', () => {
  for (const action of ['create', 'edit', 'copy']) {
    assert.equal(
      serializeApiTokens(tokenlessValues, tokenlessProvider, action),
      undefined
    );
  }
  // whitespace-only credentials count as tokenless too
  assert.equal(
    serializeApiTokens(
      { ...tokenlessValues, api_key: '  ', api_tokens: [' '] } as any,
      tokenlessProvider,
      'create'
    ),
    undefined
  );
});

test('real tokens still serialize (create: input, edit: hash passthrough)', () => {
  assert.deepEqual(
    serializeApiTokens(
      { ...tokenlessValues, api_key: 'sk-new' } as any,
      undefined,
      'create'
    ),
    [{ input: 'sk-new' }]
  );
  assert.deepEqual(
    serializeApiTokens(
      { ...tokenlessValues, api_key: 'hash-1', api_tokens: ['hash-2'] } as any,
      { ...tokenlessProvider, api_tokens: [{ hash: 'hash-1' }, { hash: 'x' }] },
      'edit'
    ),
    [{ hash: 'hash-1' }, { input: 'hash-2' }]
  );
});

test('the final request JSON omits api_tokens and api_key for tokenless providers (create/edit/copy)', () => {
  for (const action of ['create', 'edit', 'copy']) {
    const payload = buildProviderSubmitPayload(
      tokenlessValues,
      tokenlessProvider,
      action,
      {}
    );
    const json = JSON.parse(JSON.stringify(payload));
    assert.ok(!('api_tokens' in json), `${action}: api_tokens must be omitted`);
    assert.ok(!('api_key' in json), `${action}: raw api_key must not leak`);
    assert.equal(json.config.openaiCustomUrl, 'http://192.168.10.120:8101/v1');
    assert.deepEqual(json.models, [
      { name: 'bge-m3-npu', category: 'embedding', accessible: null }
    ]);
    if (action === 'copy') {
      assert.equal(json.clone_from_id, 1);
    } else {
      assert.ok(!('clone_from_id' in json));
    }
  }
});

test('the final request JSON carries serialized tokens when a key exists', () => {
  const json = JSON.parse(
    JSON.stringify(
      buildProviderSubmitPayload(
        { ...tokenlessValues, api_key: 'sk-new', api_tokens: [''] } as any,
        undefined,
        'create',
        {}
      )
    )
  );
  assert.deepEqual(json.api_tokens, [{ input: 'sk-new' }]);
  assert.ok(!('api_key' in json));
});

test('isSavedTokenless gates pull/test for saved tokenless providers only', () => {
  assert.equal(isSavedTokenless('edit', tokenlessProvider, ''), true);
  assert.equal(isSavedTokenless('copy', tokenlessProvider, undefined), true);
  // create flow, a typed key, or a provider with stored tokens are all fine
  assert.equal(isSavedTokenless('create', tokenlessProvider, ''), false);
  assert.equal(isSavedTokenless('edit', tokenlessProvider, 'sk-typed'), false);
  assert.equal(
    isSavedTokenless('edit', { ...tokenlessProvider, api_tokens: [{ hash: 'h' }] }, ''),
    false
  );
});
