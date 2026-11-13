import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let context: any;
const tables: any[] = [];
mock.module('@gpustack/core-ui', {
  namedExports: {
    SectionTitle: ({ children }: any) =>
      createElement('strong', null, children),
    DropdownButtons: ({ items, onSelect }: any) =>
      createElement('button', {
        'aria-label': items[0].label,
        onClick: () => onSelect(items[0].key)
      }),
    Table: (props: any) => {
      tables.push(props);
      return createElement(
        'div',
        { 'data-resource-table': true },
        props.dataSource.map((device: any) =>
          createElement(
            'div',
            {
              key: device.id,
              'data-device-row': device.id
            },
            props.columns.map((column: any) =>
              createElement(
                'div',
                {
                  key: column.dataIndex
                },
                column.render
                  ? column.render(device[column.dataIndex], device)
                  : device[column.dataIndex]
              )
            )
          )
        )
      );
    }
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
mock.module(
  new URL('../../components/hardware-content.tsx', import.meta.url).href,
  {
    namedExports: { ResourceSummary: () => createElement(Fragment) }
  }
);
mock.module(
  new URL('../../components/scope-toolbar.tsx', import.meta.url).href,
  {
    defaultExport: () => createElement(Fragment)
  }
);
const { default: GPUResourcesTab } = await import('../index');

const prepare = () => {
  tables.length = 0;
  const first = {
    id: 'opaque-a',
    worker_id: 1,
    worker_name: 'worker-a',
    name: 'NVIDIA A100',
    index: 0,
    chip_index: 0,
    scope: 'physical_gpu',
    model_instance_ids: [7, 8],
    history_available: true,
    current: { gpu_utilization: 0, gpu_power: 0 },
    reason: null
  };
  const second = {
    ...first,
    id: 'opaque-b',
    index: 1,
    chip_index: 2,
    scope: 'partition',
    model_instance_ids: [7],
    history_available: false,
    current: {
      gpu_utilization: null,
      gpu_memory_used: null,
      gpu_memory_total: null
    }
  };
  context = {
    resources: {
      loading: false,
      data: { available: true, reason: null, devices: [first, second] }
    },
    instances: { data: [{ id: 7, name: 'decode-a', role: 'decode' }] },
    inspectDevice: mock.fn()
  };
};

test('GPU resources use one compact row per authorized physical device without duplicate instance cards', () => {
  prepare();
  const html = renderToStaticMarkup(createElement(GPUResourcesTab));
  assert.equal(tables.length, 1);
  assert.equal(tables[0].dataSource.length, 2);
  assert.equal((html.match(/data-device-row=/g) || []).length, 2);
  assert.ok(html.includes('--seal-table-row-min-height:52px'));
  assert.ok(!html.includes('ant-progress'));
  assert.ok(html.includes('decode-a'));
  assert.ok(html.includes('#8'));
  assert.ok(html.includes('worker-a'));
  assert.ok(html.includes('modelMonitoring.current'));
  assert.ok(!html.includes('modelMonitoring.liveResourceSnapshot'));
  assert.ok(!html.includes('modelMonitoring.sharedHardware'));
  assert.deepEqual(tables[0].scroll, { x: true });
});

test('compact readings retain real zeroes, missing values and explicit partition chips', () => {
  prepare();
  const html = renderToStaticMarkup(createElement(GPUResourcesTab));
  const table = tables[0];
  const column = (name: string) =>
    table.columns.find((item: any) => item.dataIndex === name);
  assert.equal(
    column('gpu_utilization').render(null, table.dataSource[0]),
    '0 %'
  );
  assert.equal(column('gpu_power').render(null, table.dataSource[0]), '0 W');
  assert.equal(
    column('gpu_temperature').render(null, table.dataSource[0]),
    '— °C'
  );
  assert.equal(
    column('gpu_memory').render(null, table.dataSource[1]),
    '— / — GiB'
  );
  assert.ok(html.includes('GPU 0'));
  assert.ok(!html.includes('modelMonitoring.chip 0'));
  assert.ok(html.includes('modelMonitoring.chip 2'));
});

test('compact device action forwards the exact visible device to the existing Drawer', () => {
  prepare();
  renderToStaticMarkup(createElement(GPUResourcesTab));
  const table = tables[0];
  const action = table.columns.find((item: any) => item.dataIndex === 'id');
  const button = action.render(null, table.dataSource[1]);
  assert.equal(button.props.items[0].label, 'modelMonitoring.viewDetails');
  button.props.onSelect('details');
  assert.equal(context.inspectDevice.mock.calls.length, 1);
  assert.equal(
    context.inspectDevice.mock.calls[0].arguments[0],
    context.resources.data.devices[1]
  );
});

test('an unavailable GPU inventory keeps its scoped state and boolean loading value', () => {
  prepare();
  context.resources.data = {
    available: false,
    reason: 'resource_not_visible',
    devices: []
  };
  const html = renderToStaticMarkup(createElement(GPUResourcesTab));
  assert.equal(tables.length, 1);
  assert.equal(tables[0].dataSource.length, 0);
  assert.equal(tables[0].loading, false);
  assert.ok(html.includes('modelMonitoring.state.resource_not_visible'));
});
