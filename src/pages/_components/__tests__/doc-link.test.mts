import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let locale = 'en-US';
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ locale, formatMessage: ({ id }: any) => id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: { IconFont: () => null }
});
mock.module('antd', {
  namedExports: {
    Button: ({ href, children }: any) => createElement('a', { href }, children)
  }
});
mock.module('styled-components', {
  defaultExport: {
    div:
      () =>
      ({ children }: any) =>
        createElement('div', null, children)
  }
});

const { default: DocLink } = await import('../doc-link.tsx');

test('page documentation follows the active UI locale on every render', () => {
  for (const [language, prefix] of [
    ['en-US', ''],
    ['zh-CN', 'zh/'],
    ['ja-JP', 'ja/'],
    ['ru-RU', 'ru/'],
    ['tr-TR', 'tr/'],
    ['fr-FR', '']
  ]) {
    locale = language;
    const markup = renderToStaticMarkup(
      createElement(DocLink, {
        link: 'user-guide/usage/?q=gpu#limits'
      })
    );
    assert.ok(
      markup.includes(`href="/help/${prefix}user-guide/usage/?q=gpu#limits"`)
    );
  }
});
