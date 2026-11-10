import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { createIntl } = require(
  require.resolve('react-intl', {
    paths: [require.resolve('@umijs/plugins/package.json')]
  })
);
const translations = await Promise.all(
  ['en-US', 'zh-CN', 'ja-JP', 'ru-RU', 'tr-TR'].map(async (locale) => ({
    locale,
    messages: (await import(`../${locale}/models.ts`)).default
  }))
);
for (const { locale, messages } of translations) {
  test(`${locale} preserves Router command templates in translated help`, () => {
    const intl = createIntl({
      locale,
      messages,
      onError: (error: unknown) => {
        throw error;
      }
    });
    const message = (key: string) =>
      intl.formatMessage({ id: `models.form.roles.router.command.${key}` });
    for (const key of [
      'auto.placeholder',
      'custom.placeholder',
      'managed.tips',
      'custom.tips',
      'manual.tips',
      'help',
      'title',
      'examples',
      'variables',
      'copy',
      'example.current',
      'example.generic',
      'example.join',
      'example.note',
      'example.generic.note',
      'vars.workerIp',
      'vars.port',
      'vars.ports',
      'vars.peers',
      'vars.peerUrl',
      'vars.peerAddress',
      'vars.peerPorts',
      'vars.urls',
      'vars.modelName',
      'syntax',
      'membership'
    ])
      assert.ok(message(key));
    assert.ok(message('managed.tips').length < 200);
    assert.ok(message('auto.placeholder').length < 100);
    assert.ok(!message('auto.placeholder').includes('{%'));
    assert.ok(!message('managed.tips').includes('router_args'));
  });
}
