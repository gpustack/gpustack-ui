import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TopologyWorker } from '../../../config/types';

const empty = () => null;
mock.module('@ant-design/icons', {
  namedExports: {
    ExpandAltOutlined: empty,
    InfoCircleOutlined: empty,
    LockOutlined: empty,
    ShrinkOutlined: empty,
    WarningOutlined: empty
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: ({ children, title }: any) =>
      createElement('span', { 'data-tooltip': title }, children),
    StatusDot: ({ statusValue }: any) =>
      createElement(
        'span',
        { 'data-status-dot': statusValue.status },
        statusValue.text
      )
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    topologyLayerLabel: (_intl: unknown, layer: { name: string }) => layer.name,
    // Keep the actual resource status maps while isolating unrelated cluster
    // settings that the resources configuration also imports.
    ProviderValueMap: { Docker: 'Docker', Kubernetes: 'Kubernetes' }
  }
});
mock.module(new URL('../location-cell.tsx', import.meta.url).href, {
  defaultExport: empty
});
const renderTreeNodes = (nodes: any[]): any =>
  nodes.map((node) =>
    createElement(
      'div',
      { key: node.key },
      node.title,
      node.children ? renderTreeNodes(node.children) : null
    )
  );
mock.module('antd', {
  namedExports: {
    Table: ({ columns, dataSource }: any) =>
      createElement(
        Fragment,
        null,
        dataSource.map((worker: TopologyWorker) =>
          createElement(
            'div',
            { key: worker.id },
            columns
              .find((column: any) => column.key === 'name')
              .render(worker.name, worker)
          )
        )
      ),
    Tree: ({ treeData }: any) =>
      createElement(Fragment, null, renderTreeNodes(treeData)),
    Tooltip: ({ children, title }: any) =>
      createElement('span', { 'data-tooltip': title }, children),
    Flex: ({ children, component = 'div', className, onClick }: any) =>
      createElement(component, { className, onClick }, children),
    Button: empty,
    Segmented: empty,
    Empty: empty
  }
});

const { default: LocationTable } = await import('../location-table.tsx');
const { default: TreeView, TREE_GROUPING } = await import('../tree-view.tsx');
const { NODE_LAYER } = await import('../../../config/types.ts');

const states = [
  ['not_ready', 'error', 'Not Ready'],
  ['ready', 'success', 'Ready'],
  ['unreachable', 'error', 'Unreachable'],
  ['error', 'error', 'Error'],
  ['provisioning', 'transitioning', 'Provisioning'],
  ['initializing', 'transitioning', 'Initializing'],
  ['pending', 'transitioning', 'Pending'],
  ['deleting', 'transitioning', 'Deleting'],
  ['maintenance', 'warning', 'Maintenance'],
  ['future_state', 'inactive', 'future_state']
] as const;

for (const mode of ['table', 'tree'] as const) {
  test(`${mode} keeps worker health colors and status descriptions while showing the worker name`, () => {
    for (const [state, expectedColor, expectedDescription] of states) {
      const worker: TopologyWorker = {
        id: 1,
        name: 'worker-a',
        state,
        gpus: 1,
        free_gpus: 1,
        location: {}
      };
      const markup = renderToStaticMarkup(
        mode === 'table'
          ? createElement(LocationTable, {
              workers: [worker],
              allWorkers: [worker],
              fields: [],
              selectedIds: [],
              onSelectionChange: empty,
              height: 400,
              onAssign: async () => {},
              onBusy: empty
            })
          : createElement(TreeView, {
              toolbarContainer: null,
              workers: [worker],
              fields: [],
              view: {
                layers: [],
                tree: {
                  children: [{ layer: NODE_LAYER, worker_ids: [worker.id] }]
                }
              } as any,
              grouping: TREE_GROUPING,
              onGroupingChange: empty,
              onHostClick: empty
            })
      );
      const dom = new JSDOM(markup);
      try {
        const dot = dom.window.document.querySelector('[data-status-dot]')!;
        assert.ok(dot, `${mode} renders a status dot for ${state}`);
        assert.equal(dot.getAttribute('data-status-dot'), expectedColor, state);
        assert.equal(dot.textContent, worker.name, state);
        assert.ok(
          dot
            .closest('[data-tooltip]')
            ?.getAttribute('data-tooltip')
            ?.includes(expectedDescription),
          `${mode} exposes the actual ${state} state on hover`
        );
      } finally {
        dom.window.close();
      }
    }
  });
}
