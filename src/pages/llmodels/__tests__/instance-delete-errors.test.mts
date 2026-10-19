import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const errorToast = mock.fn();
const confirmDelete = mock.fn();
const queryDetail = mock.fn(async (_id: number): Promise<any> => ({}));
const deleteInstance = mock.fn();
const fetchCatalog = mock.fn(async () => []);
const row = { id: 1, model_id: 2, name: 'instance' };
let instanceAction: (action: string, row: any) => Promise<void>;
let childAction: (action: string, row: any) => void;

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id }),
    useNavigate: () => empty,
    useSearchParams: () => [new URLSearchParams()]
  }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: unknown) => fn }
});
mock.module('jotai', {
  namedExports: { useAtom: () => [{}, empty] }
});
mock.module('antd', {
  namedExports: {
    Button: empty,
    Space: empty,
    ConfigProvider: passChildren,
    Table: empty,
    message: { error: errorToast }
  }
});
mock.module('@ant-design/icons', {
  namedExports: { DownOutlined: empty }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    DeleteModal: empty,
    DropdownActions: empty,
    DropdownButtons: empty,
    FilterBar: empty,
    IconFont: empty,
    NoResult: empty,
    PageTools: empty,
    Table: ({ renderChildren }: any) => renderChildren([], { parent: {} }),
    useBodyScroll: () => ({}),
    useExpandedRowKeys: () => ({ expandedRowKeys: [] }),
    useTableRowSelection: () => ({ selectedRowKeys: [] })
  }
});

const moduleMock = (path: string, exports: any) =>
  mock.module(new URL(path, import.meta.url).href, exports);
moduleMock('../../../atoms/models.ts', {
  namedExports: { modelsExpandKeysAtom: {}, modelsSessionAtom: {} }
});
moduleMock('../../../config/index.ts', { namedExports: { PageAction: {} } });
moduleMock('../../../config/settings.ts', {
  namedExports: { PaginationKey: {}, TABLE_SORT_DIRECTIONS: [] }
});
moduleMock('../../../utils/index.ts', {
  namedExports: { handleBatchRequest: empty }
});
moduleMock('../../../hooks/use-table-fetch.ts', {
  defaultExport: () => ({
    dataSource: { dataList: [] },
    queryParams: {},
    handleDelete: confirmDelete
  })
});
moduleMock('../../_components/page-box.tsx', { defaultExport: passChildren });
moduleMock('../../model-routes/config/index.ts', {
  namedExports: { TargetStatusValueMap: {} }
});
moduleMock('../../model-routes/hooks/use-open-playground.ts', {
  defaultExport: () => ({})
});
moduleMock('../../resources/hooks/use-grafana-link.tsx', {
  defaultExport: () => ({ ActionButton: empty })
});
moduleMock('../apis/index.ts', {
  namedExports: {
    MODEL_INSTANCE_API: '',
    MODELS_API: '',
    createModel: empty,
    deleteModel: empty,
    deleteModelInstance: deleteInstance,
    queryModelDetail: queryDetail,
    queryModelInstancesList: empty,
    queryModelsInstances: empty,
    updateModel: empty,
    updateModelLifecycle: empty
  }
});
moduleMock('../config/index.ts', {
  namedExports: { status: {}, modelSourceMap: {} }
});
moduleMock('../config/button-actions.ts', {
  namedExports: { ButtonList: [], modalConfig: {}, sourceOptions: [] }
});
moduleMock('../config/deploments-context.ts', {
  namedExports: {
    useDeploymentsContext: () => ({ clusterList: [], workerList: [] })
  }
});
moduleMock('../hooks/use-query-pd-modes.ts', {
  namedExports: { fetchCatalog }
});
moduleMock('../hooks/use-edit-deployment.ts', {
  defaultExport: () => ({ openEditModalStatus: { currentData: {} } })
});
moduleMock('../hooks/use-export-deployments.ts', { defaultExport: () => ({}) });
moduleMock('../hooks/use-run-benchmark.ts', {
  namedExports: { useBenchmarkTargetInstance: () => ({}) }
});
moduleMock('../hooks/use-view-instance-logs.ts', {
  defaultExport: () => ({ openViewLogsModalStatus: { currentData: {} } })
});
moduleMock('../hooks/use-no-resource-result.tsx', {
  defaultExport: () => ({})
});
moduleMock('../hooks/use-models-columns.tsx', { defaultExport: () => [] });
moduleMock('../services/use-query-model-list.ts', {
  defaultExport: () => ({ dataList: [] })
});
moduleMock('../instance-view/use-instance-columns.tsx', {
  defaultExport: ({ handleSelect }: any) => {
    instanceAction = handleSelect;
    return [];
  }
});
moduleMock('../components/instance/instances.tsx', {
  defaultExport: ({ handleChildSelect }: any) => {
    childAction = handleChildSelect;
    return null;
  }
});
moduleMock('../components/deployment/revisions/hooks/use-model-revisions.ts', {
  defaultExport: () => ({})
});
for (const path of [
  '../instance-view/left-filters.tsx',
  '../components/view-logs-modal.tsx',
  '../components/deployment/deploy-modal.tsx',
  '../components/deployment/import-yaml-modal.tsx',
  '../components/deployment/update-modal.tsx',
  '../components/deployment/revisions/revision-history-drawer.tsx'
]) {
  moduleMock(path, { defaultExport: empty });
}

const { default: InstanceView } = await import('../instance-view/index.tsx');
const { default: Models } = await import('../components/table-list.tsx');

for (const view of ['instances', 'deployment children']) {
  for (const [name, error, expected] of [
    ['timeout', new Error('Request timed out'), 'Request timed out'],
    ['network error', new Error('Network Error'), 'Network Error'],
    ['missing message', {}, 'common.delete.fail'],
    ['HTTP error', { response: { status: 403 } }, undefined]
  ] as const) {
    test(`${view}: ${name} aborts deletion and reports transport failures`, async () => {
      errorToast.mock.resetCalls();
      confirmDelete.mock.resetCalls();
      deleteInstance.mock.resetCalls();
      fetchCatalog.mock.resetCalls();
      queryDetail.mock.mockImplementation(async () => {
        throw error;
      });
      if (view === 'instances') {
        renderToStaticMarkup(createElement(InstanceView));
        await instanceAction('delete', row);
      } else {
        renderToStaticMarkup(
          createElement(Models, {
            dataSource: [],
            queryParams: {},
            sortOrder: [],
            loadend: false
          } as any)
        );
        childAction('delete', row);
        await Promise.resolve();
      }
      assert.deepEqual(
        errorToast.mock.calls.map((call) => call.arguments),
        expected ? [[expected]] : []
      );
      assert.equal(confirmDelete.mock.callCount(), 0);
      assert.equal(deleteInstance.mock.callCount(), 0);
      assert.equal(fetchCatalog.mock.callCount(), 0);
    });
  }
}
