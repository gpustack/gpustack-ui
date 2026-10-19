import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentationPaths } from '../../constants/documentation';
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
      getDocumentationUrl('user-guide/usage/?q=GPU%20memory#limits', locale),
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
    getDocumentationUrl('v2.3/ru/overview/', 'tr-TR'),
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

test('shared documentation entries keep their page, query, and fragment', () => {
  for (const [name, path] of Object.entries(documentationPaths)) {
    assert.equal(getDocumentationUrl(path, 'ja-JP'), `/help/ja/${path}`, name);
  }
});

test('versioned documentation paths open the corresponding bundled page', () => {
  for (const version of ['latest', '2.3', 'v2.3']) {
    assert.equal(
      getDocumentationUrl(
        `${version}/ja/installation/requirements/?h=gpu#t-head-ppu`,
        'tr-TR'
      ),
      '/help/tr/installation/requirements/?h=gpu#t-head-ppu'
    );
  }
});

test('a documentation root preserves its query and fragment', () => {
  assert.equal(
    getDocumentationUrl('/help/zh/?q=GPU%20memory#overview', 'ru-RU'),
    '/help/ru/?q=GPU%20memory#overview'
  );
  assert.equal(
    getDocumentationUrl('/latest#overview', 'tr-TR'),
    '/help/tr/#overview'
  );
});
