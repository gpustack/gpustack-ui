import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../locales/zh-CN/benchmark';

const translations = (messages as any).default ?? messages;
let members: Record<string, any> = {};
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: Record<string, string> = {}) =>
        Object.entries(values).reduce(
          (text, [key, value]) => text.replaceAll(`{${key}}`, value),
          translations[id] || id
        )
    })
  }
});
mock.module('antd', {
  namedExports: {
    Alert: ({ title, description, type }: any) =>
      createElement(
        'div',
        { role: 'alert', 'data-type': type },
        title,
        description
      )
  }
});
mock.module(new URL('../../config/detail-context.ts', import.meta.url).href, {
  namedExports: {
    useDetailContext: () => ({
      detailData: { snapshot: { instances: members } }
    })
  }
});

const { default: ConfigSourceAlert } = await import('../config-source-alert');
const render = () => renderToStaticMarkup(createElement(ConfigSourceAlert));

test('recorded startup configurations and reports without provenance show no fallback alert', () => {
  for (const config_source of [undefined, null, 'instance_snapshot']) {
    members = { one: { name: 'recorded-instance', config_source } };
    assert.equal(render(), '');
  }
  members = {};
  assert.equal(render(), '');
});

test('mixed PD groups identify only members using current model configuration', () => {
  members = {
    prefill: { name: 'old-prefill', config_source: 'current_model' },
    decode: { name: 'new-decode', config_source: 'instance_snapshot' },
    router: { name: 'old-router', config_source: 'current_model' }
  };
  const html = render();
  assert.match(html, /role="alert"/);
  assert.match(html, /data-type="warning"/);
  assert.match(html, /启动配置未记录/);
  assert.match(html, /old-prefill/);
  assert.match(html, /old-router/);
  assert.doesNotMatch(html, /new-decode/);
  assert.match(html, /创建基准测试时/);
  assert.match(html, /仅供参考/);
});

test('a single legacy instance can show the configuration reference notice', () => {
  members = {
    one: { name: 'legacy-instance', config_source: 'current_model' }
  };
  assert.match(render(), /legacy-instance/);
});
