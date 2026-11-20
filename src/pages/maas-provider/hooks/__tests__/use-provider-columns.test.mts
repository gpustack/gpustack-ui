import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const empty = () => null;

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('@/config/settings', {
  namedExports: { tableSorter: () => true }
});
mock.module('@/plugins/list-extra-columns', {
  namedExports: { usePluginListColumns: () => [] }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: ({ children }: any) =>
      createElement('span', null, children),
    DropdownButtons: empty
  }
});
mock.module('antd', {
  namedExports: { Tag: ({ children }: any) => createElement('span', null, children) }
});
mock.module('../../components/provider-logo.tsx', {
  defaultExport: empty
});
mock.module('../../components/provider-models.tsx', {
  defaultExport: ({ dataList }: any) =>
    createElement('span', null, `models:${(dataList || []).length}`)
});
mock.module('../../config/index.ts', {
  namedExports: {
    rowActionList: [
      { key: 'edit' },
      { key: 'registerRoute' },
      { key: 'copy' },
      { key: 'delete' }
    ]
  }
});
mock.module('../../config/providers.ts', {
  namedExports: {
    isDecisionServiceType: () => false,
    maasProviderLabelMap: {}
  }
});

const { default: useProviderColumns } = await import('../use-provider-columns.tsx');

// Regression fixture for gpustack/gpustack#6855: a provider created via REST
// without an API key carries api_tokens: [] — the list must still render.
const tokenlessProvider: any = {
  id: 1,
  name: 'npu-bge-120-emb',
  description: null,
  builtin: false,
  config: { type: 'openai', openaiCustomUrl: 'http://192.168.10.120:8101/v1' },
  models: [{ name: 'bge-m3-npu', category: 'embedding', accessible: null }],
  api_tokens: [],
  created_at: '2026-11-20T00:00:00Z'
};

// Even a fully malformed record must not throw when its cells render.
const malformedProvider: any = {
  id: 2,
  config: null,
  models: null,
  api_tokens: null,
  created_at: null
};

test('provider columns render a tokenless provider without crashing', () => {
  let columns: any[] = [];
  const Harness = () => {
    columns = useProviderColumns(() => {}) as any;
    return null;
  };
  renderToStaticMarkup(createElement(Harness));
  assert.ok(columns.length > 0);

  for (const record of [tokenlessProvider, malformedProvider]) {
    for (const column of columns) {
      const value = record;
      // dataIndex is nested for config.type — mirror antd's lookup loosely.
      const cell =
        column.dataIndex === 'name'
          ? record.name
          : Array.isArray(column.dataIndex)
            ? record.config?.[column.dataIndex[1]]
            : record[column.dataIndex as string];
      assert.doesNotThrow(() => {
        renderToStaticMarkup(
          column.render
            ? column.render(cell, record, 0)
            : createElement('span', null, cell)
        );
      });
    }
  }

  const nameMarkup = renderToStaticMarkup(
    columns[0].render(tokenlessProvider.name, tokenlessProvider, 0)
  );
  assert.match(nameMarkup, /npu-bge-120-emb/);
});
