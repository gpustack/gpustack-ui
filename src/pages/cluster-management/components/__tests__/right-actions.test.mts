import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let plugin: any;
mock.module('@/plugins', { namedExports: { getGPUStackPlugin: () => plugin } });
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }) => id }) }
});
mock.module('@ant-design/icons', {
  namedExports: { DeleteOutlined: () => null, PlusOutlined: () => null }
});
mock.module('antd', {
  namedExports: {
    Space: ({ children, size }) =>
      createElement('div', { 'data-size': size }, children),
    Button: ({ children, disabled }) =>
      createElement('button', { disabled }, children)
  }
});
const { default: RightActions } = await import('../right-actions.tsx');
const clusters = [{ id: 7, name: 'First', is_default: true }];
const render = () =>
  renderToStaticMarkup(
    createElement(RightActions, {
      clusters,
      handleDeleteByBatch: () => {},
      handleClickPrimary: () => {},
      MonitorButton: createElement('span', null, 'monitor'),
      rowSelection: { selectedRowKeys: [] }
    })
  );

test('without a plugin the original monitoring/add/delete layout and disabled state remain', () => {
  plugin = undefined;
  assert.equal(
    render(),
    '<div data-size="16"><span>monitor</span><button>clusters.button.add</button><button disabled=""><span>common.button.delete</span></button></div>'
  );
});
test('optional contribution sits after monitoring and immediately before add, sharing the existing cluster list', () => {
  let received: any;
  plugin = {
    clusterDetail: {
      ListActions: () => createElement('span', null, 'view'),
      BeforeAddActions: (props) => {
        received = props.clusters;
        return createElement('span', null, 'extra');
      }
    }
  };
  const html = render();
  assert.equal(received, clusters);
  assert.ok(html.indexOf('view') < html.indexOf('monitor'));
  assert.ok(html.indexOf('monitor') < html.indexOf('extra'));
  assert.ok(html.indexOf('extra') < html.indexOf('clusters.button.add'));
  plugin = { clusterDetail: { ListActions: plugin.clusterDetail.ListActions } };
  assert.ok(!render().includes('extra'));
});
