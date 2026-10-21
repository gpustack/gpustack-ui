import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ListItem } from '../../config/types';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
let statusValue: any;
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: passChildren,
    CopyButton: empty,
    DropdownButtons: empty,
    IconFont: empty,
    icons: {},
    StatusTag: (props: any) => {
      statusValue = props.statusValue;
      return createElement('span', null, statusValue.text);
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useAccess: () => ({}),
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', { namedExports: { Button: empty } });
mock.module('@ant-design/icons', { namedExports: { ExportOutlined: empty } });
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: { error: 'error', success: 'success' } }
});
mock.module(
  new URL('../../../hooks/use-creator-column.tsx', import.meta.url).href,
  {
    defaultExport: () => []
  }
);
mock.module(
  new URL('../../../../../plugins/list-extra-columns.ts', import.meta.url).href,
  {
    namedExports: { usePluginListColumns: () => [] }
  }
);
mock.module(
  new URL('../../components/utilization-cell.tsx', import.meta.url).href,
  {
    defaultExport: empty
  }
);
mock.module(
  new URL('../../utils/render-instance-type.tsx', import.meta.url).href,
  {
    namedExports: { renderInstanceType: empty }
  }
);
const { default: useInstancesColumns } =
  await import('../use-instances-columns.tsx');
const StatusCell = ({ record }: { record: ListItem }) => {
  const columns = useInstancesColumns({
    handleSelect() {},
    clusterList: [],
    sortOrder: [],
    metrics: {}
  });
  return columns.find((column) => column.key === 'status')!.render!(
    undefined,
    record,
    0
  );
};

test('the real instance status column passes the Failed label, error color, and complete failure message to StatusTag', () => {
  const phaseMessage =
    'UnexpectedAdmissionError: Pod was rejected: no healthy devices present';
  renderToStaticMarkup(
    createElement(StatusCell, {
      record: { status: { phase: 'Failed', phaseMessage } } as ListItem
    })
  );
  assert.deepEqual(statusValue, {
    status: 'error',
    text: 'Failed',
    message: phaseMessage
  });
});

test('a failed instance without a returned message still renders its Failed state', () => {
  renderToStaticMarkup(
    createElement(StatusCell, {
      record: { status: { phase: 'Failed', phaseMessage: null } } as ListItem
    })
  );
  assert.deepEqual(statusValue, {
    status: 'error',
    text: 'Failed',
    message: ''
  });
});
