import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let rows: any[] = [];
let model: any = {};
let table: any;
const buttons: any[] = [];
const dropdowns: any[] = [];
const downloads: any[] = [];
const grafana: any[] = [];
const statuses: any[] = [];
const calls: string[] = [];
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: passthrough,
    IconFont: () => null,
    GrafanaIcon: () => null,
    DropdownButtons: (props: any) => {
      dropdowns.push(props);
      return null;
    },
    Table: (props: any) => {
      table = props;
      const { columns, dataSource } = props;
      return createElement(
        Fragment,
        null,
        dataSource.map((row: any) =>
          createElement(
            Fragment,
            { key: row.id },
            columns
              .find((column: any) => column.dataIndex === 'state')
              .render(row.state, row)
          )
        )
      );
    },
    StatusDot: ({ statusValue }: any) => {
      statuses.push(statusValue);
      return null;
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any) => {
        calls.push(id);
        return id;
      }
    })
  }
});
mock.module('antd', {
  namedExports: {
    Button: (props: any) => {
      buttons.push(props);
      return passthrough(props);
    },
    Flex: passthrough,
    Typography: { Text: passthrough }
  }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: {
    useDetail: () => ({
      model: { data: model },
      instances: { data: rows },
      resources: { data: { devices: [] } },
      scope: { instanceIds: [], role: 'all' },
      inspectDevice() {},
      setTab() {}
    })
  }
});
mock.module(
  new URL('../../components/scope-toolbar.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../../hooks/use-download-instance-logs.tsx', import.meta.url)
    .href,
  {
    defaultExport: () => ({ downloadLogs: (row: any) => downloads.push(row) })
  }
);
mock.module(
  new URL('../../../../resources/hooks/use-grafana-link.tsx', import.meta.url)
    .href,
  {
    defaultExport: () => ({
      showMonitoring: true,
      goToGrafana: (row: any) => grafana.push(row)
    })
  }
);
mock.module(
  new URL('../../components/metric-state.tsx', import.meta.url).href,
  { namedExports: { RequestNotice: () => null } }
);
mock.module(
  new URL('../../../components/view-logs-modal.tsx', import.meta.url).href,
  { defaultExport: () => null }
);
mock.module(
  new URL('../../../hooks/use-view-instance-logs.ts', import.meta.url).href,
  {
    defaultExport: () => ({
      openViewLogsModal() {},
      closeViewLogsModal() {},
      openViewLogsModalStatus: { currentData: {}, open: false }
    })
  }
);
// Use the real shared status definitions; isolate only their unrelated imports.
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    StatusMaps: {
      success: 'success',
      transitioning: 'transitioning',
      error: 'error',
      inactive: 'inactive'
    }
  }
});
mock.module(
  new URL('../../../constants/backend-parameters/index.ts', import.meta.url)
    .href,
  { namedExports: { backendOptionsMap: {} } }
);
const { default: InstancesTab } = await import('../index');

test('detail instances reuse shared status names and colors without inventing locale keys', () => {
  rows = ['running', 'starting', 'unreachable', 'unknown', 'future_state'].map(
    (state, id) => ({ id, state })
  );
  statuses.length = 0;
  renderToStaticMarkup(createElement(InstancesTab));
  assert.deepEqual(
    statuses.map((status) => [status.text, status.status]),
    [
      ['Running', 'success'],
      ['Starting', 'transitioning'],
      ['Unreachable', 'error'],
      ['Unknown', 'inactive'],
      ['Unknown', 'inactive']
    ]
  );
  assert.ok(!calls.some((key) => key.startsWith('models.table.state.')));
});

test('completed model download uses the existing instance-list success color', () => {
  rows = [
    { id: 1, state: 'downloading', download_progress: 80 },
    { id: 2, state: 'downloading', download_progress: 100 }
  ];
  statuses.length = 0;
  renderToStaticMarkup(createElement(InstancesTab));
  assert.deepEqual(
    statuses.map((status) => [status.text, status.status]),
    [
      ['Downloading', 'transitioning'],
      ['Downloading', 'success']
    ]
  );
});

test('detail instance actions preserve the actual row for log downloads and Grafana', () => {
  rows = [{ id: 17, model_id: 5, name: 'actual-instance', state: 'running' }];
  buttons.length = dropdowns.length = downloads.length = grafana.length = 0;
  renderToStaticMarkup(createElement(InstancesTab));
  const actions = table.columns.find(
    (column: any) => column.dataIndex === 'id'
  );
  renderToStaticMarkup(actions.render(null, rows[0]));
  assert.ok(dropdowns[0].items.some((item: any) => item.key === 'download'));
  assert.ok(dropdowns[0].items.some((item: any) => item.key === 'grafana'));
  dropdowns[0].onSelect('download');
  dropdowns[0].onSelect('grafana');
  assert.equal(downloads[0], rows[0]);
  assert.equal(grafana[0], rows[0]);
});

test('Router shows only its explicit role declaration and never an inherited engine or ambiguous instance version', () => {
  model = {
    backend: 'vLLM',
    backend_version: '0.33.0',
    roles: [{ name: 'router', backend: null, backend_version: null }]
  };
  renderToStaticMarkup(createElement(InstancesTab));
  const backend = table.columns.find(
    (column: any) => column.dataIndex === 'backend'
  );
  const router = { role: 'router', backend: 'vLLM', backend_version: '0.33.0' };
  assert.equal(backend.render(null, router), 'Router');
  model.roles[0] = {
    name: 'router',
    backend: 'declared-router',
    backend_version: '1.2.3'
  };
  renderToStaticMarkup(createElement(InstancesTab));
  assert.equal(
    table.columns
      .find((column: any) => column.dataIndex === 'backend')
      .render(null, router),
    'declared-router 1.2.3'
  );
  model.roles[0] = { name: 'router', backend: null, backend_version: '1.2.3' };
  renderToStaticMarkup(createElement(InstancesTab));
  assert.equal(
    table.columns
      .find((column: any) => column.dataIndex === 'backend')
      .render(null, router),
    'Router 1.2.3'
  );
});

test('Prefill and Decode retain ordinary role/model backend inheritance', () => {
  model = {
    backend: 'vLLM',
    backend_version: '0.33.0',
    roles: [
      { name: 'prefill', backend: null, backend_version: null },
      { name: 'decode', backend: 'SGLang', backend_version: '0.5.0' }
    ]
  };
  renderToStaticMarkup(createElement(InstancesTab));
  const backend = table.columns.find(
    (column: any) => column.dataIndex === 'backend'
  );
  assert.equal(backend.render(null, { role: 'prefill' }), 'vLLM 0.33.0');
  assert.equal(backend.render(null, { role: 'decode' }), 'SGLang 0.5.0');
  assert.equal(
    backend.render(null, {
      role: 'decode',
      backend: 'reported-engine',
      backend_version: '2.0'
    }),
    'reported-engine 2.0'
  );
});
