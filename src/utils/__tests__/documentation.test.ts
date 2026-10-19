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

for (const path of [
  '12-factor-app/',
  '3d-models/',
  '2.3/upgrade/?q=GPU%20memory#overview',
  'v2-topic/'
]) {
  test(`documentation preserves numeric or version-like page path ${path}`, () => {
    for (const [locale, prefix] of [
      ['en-US', ''],
      ['zh-CN', 'zh/'],
      ['ja-JP', 'ja/'],
      ['ru-RU', 'ru/'],
      ['tr-TR', 'tr/'],
      ['de-DE', '']
    ]) {
      assert.equal(getDocumentationUrl(path, locale), `/help/${prefix}${path}`);
    }
  });
}

test('shared documentation entries keep their page, query, and fragment', () => {
  for (const [name, path] of Object.entries(documentationPaths)) {
    assert.equal(getDocumentationUrl(path, 'ja-JP'), `/help/ja/${path}`, name);
  }
});

test('a documentation root preserves its query and fragment', () => {
  assert.equal(
    getDocumentationUrl('?q=GPU%20memory#overview', 'ru-RU'),
    '/help/ru/?q=GPU%20memory#overview'
  );
  assert.equal(getDocumentationUrl('#overview', 'tr-TR'), '/help/tr/#overview');
});
