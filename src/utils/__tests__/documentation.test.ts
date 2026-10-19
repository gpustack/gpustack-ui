import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDocumentationUrl } from '../documentation';

for (const [locale, prefix] of [
  ['en-US', ''],
  ['zh-CN', 'zh/'],
  ['ja-JP', 'ja/'],
  ['ru-RU', 'ru/'],
  ['tr-TR', 'tr/'],
  ['JA_jp', 'ja/'],
  ['de-DE', ''],
  ['', '']
]) {
  test(`documentation follows ${locale || 'an unsupported empty locale'}`, () => {
    assert.equal(getDocumentationUrl('', locale), `/help/${prefix}`);
    assert.equal(
      getDocumentationUrl(
        'https://docs.gpustack.ai/latest/user-guide/usage/?q=GPU%20memory#limits',
        locale
      ),
      `/help/${prefix}user-guide/usage/?q=GPU%20memory#limits`
    );
  });
}

test('a new preference replaces an existing language without duplicating prefixes', () => {
  assert.equal(
    getDocumentationUrl('/help/zh/user-guide/sso/?h=cert#cas', 'ja-JP'),
    '/help/ja/user-guide/sso/?h=cert#cas'
  );
  assert.equal(
    getDocumentationUrl(
      'https://docs.gpustack-enterprise.ai/v2.3/ru/overview/',
      'tr-TR'
    ),
    '/help/tr/overview/'
  );
});

test('relative documentation keeps page paths, queries, and fragments', () => {
  assert.equal(
    getDocumentationUrl(
      'troubleshooting/?h=reset#reset-admin-password',
      'ru-RU'
    ),
    '/help/ru/troubleshooting/?h=reset#reset-admin-password'
  );
  assert.equal(
    getDocumentationUrl('image-selector/', 'tr-TR'),
    '/help/tr/image-selector/'
  );
});

test('third-party backend documentation keeps its original URL', () => {
  for (const link of [
    'https://docs.vllm.ai/en/stable/cli/serve/',
    'https://github.com/gpustack/llama-box?tab=readme-ov-file#usage',
    '//docs.sglang.ai/server/?q=flags#arguments',
    'https://docs.gpustack.ai/gpustack-operator/main/docs/operate/migration/'
  ]) {
    assert.equal(getDocumentationUrl(link, 'ja-JP'), link);
  }
});

test('versioned online documentation opens the corresponding bundled page', () => {
  assert.equal(
    getDocumentationUrl(
      'https://docs.gpustack.ai/2.3/ja/installation/requirements/?h=gpu#t-head-ppu',
      'tr-TR'
    ),
    '/help/tr/installation/requirements/?h=gpu#t-head-ppu'
  );
});
