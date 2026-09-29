import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
// Use the same formatter dependency as Umi's locale provider.
const { createIntl } = require(
  require.resolve('react-intl', {
    paths: [require.resolve('@umijs/plugins/package.json')]
  })
);
const dom = new JSDOM('');
Object.defineProperty(globalThis, 'DOMParser', {
  configurable: true,
  value: dom.window.DOMParser
});

for (const locale of ['en-US', 'zh-CN', 'ja-JP', 'ru-RU', 'tr-TR']) {
  const { default: messages } = await import(
    `../../../../../../locales/${locale}/model-revisions.ts`
  );
  for (const rollback of [false, true]) {
    test(`${locale} renders the ${rollback ? 'rollback' : 'history'} title with styled values`, () => {
      const intl = createIntl({
        locale,
        messages,
        onError: (error: unknown) => {
          throw error;
        }
      });
      const name = 'qwen3-0.6b';
      const title = intl.formatMessage(
        {
          id: `models.revisions.${rollback ? 'reviewRollback' : 'titleWithName'}`
        },
        {
          name: createElement('strong', { 'data-model': true }, name),
          revision: createElement('strong', { 'data-revision': true }, 'v2')
        }
      );
      const container = dom.window.document.createElement('div');
      container.innerHTML = renderToStaticMarkup(title);
      const expected =
        locale === 'zh-CN'
          ? rollback
            ? `将 ${name} 回滚到 v2`
            : `修订历史 · ${name}`
          : rollback
            ? `Roll back ${name} to v2`
            : `Revision history · ${name}`;
      assert.equal(container.textContent, expected);
      assert.equal(container.querySelector('[data-model]')?.textContent, name);
      assert.equal(
        container.querySelector('[data-revision]')?.textContent,
        rollback ? 'v2' : undefined
      );
    });
  }
}
