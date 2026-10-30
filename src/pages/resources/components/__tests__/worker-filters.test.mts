import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const inputs = new Map<string, any>();

mock.module('@ant-design/icons', {
  namedExports: { SearchOutlined: empty, SyncOutlined: empty }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: (props: any) => {
      inputs.set(props['aria-label'], props);
      return null;
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    Button: passChildren,
    Flex: passChildren,
    Input: (props: any) => {
      inputs.set(props['aria-label'], props);
      return null;
    }
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true
});
after(() => dom.window.close());

const WorkerFilters = (await import('../worker-filters.tsx')).default;
const labelOptions = [
  { value: 'arch=amd64', label: 'arch: amd64' },
  { value: 'city=New York, US', label: 'city: New York, US' },
  { value: 'url=http://host?a=b', label: 'url: http://host?a=b' },
  { value: 'region=', label: 'region: ' }
];
const mount = async (t: any) => {
  inputs.clear();
  const onLabelChange = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  await act(async () => {
    root.render(
      createElement(WorkerFilters, {
        label: ['region=beijing'],
        labelOptions,
        showCluster: true,
        clusterOptions: [],
        onNameChange: empty,
        onLabelChange,
        onClusterChange: empty,
        onRefresh: empty
      })
    );
  });
  t.after(async () => act(async () => root.unmount()));
  const change = async (value: string[]) => {
    await act(async () => inputs.get('resources.filter.label').onChange(value));
  };
  return { onLabelChange, change };
};

for (const labels of [
  ['arch=amd64'],
  ['arch=amd64', 'city=New York, US'],
  ['region='],
  ['url=http://host?a=b'],
  []
]) {
  test(`selects existing labels without requiring typed syntax: ${JSON.stringify(labels)}`, async (t) => {
    const { onLabelChange, change } = await mount(t);
    await change(labels);
    assert.deepEqual(
      onLabelChange.mock.calls.map((call) => call.arguments),
      [[labels]]
    );
    assert.equal(inputs.get('resources.filter.label').status, undefined);
    assert.equal(
      inputs.get('resources.filter.label')['aria-invalid'],
      undefined
    );
  });
}

test('clearing label input clears the active filter', async (t) => {
  const { onLabelChange, change } = await mount(t);
  await change(['arch=amd64']);
  await change([]);
  assert.deepEqual(
    onLabelChange.mock.calls.map((call) => call.arguments),
    [[['arch=amd64']], [[]]]
  );
  assert.equal(inputs.get('resources.filter.label').status, undefined);
});

test('offers searchable existing choices and readable selected labels', async (t) => {
  await mount(t);
  const select = inputs.get('resources.filter.label');
  assert.equal(select.mode, 'multiple');
  assert.deepEqual(select.options, labelOptions);
  assert.equal(select.showSearch, true);
  assert.equal(select.optionFilterProp, 'label');
  assert.equal(select.labelRender({ value: 'arch=amd64' }), 'arch: amd64');
});

test('adding and removing label tags preserves complete values', async (t) => {
  const { onLabelChange, change } = await mount(t);
  await change(['arch=amd64', 'city=New York, US', 'url=http://host?a=b']);
  await change(['arch=amd64', 'url=http://host?a=b']);
  await change([]);
  assert.deepEqual(
    onLabelChange.mock.calls.map((call) => call.arguments),
    [
      [['arch=amd64', 'city=New York, US', 'url=http://host?a=b']],
      [['arch=amd64', 'url=http://host?a=b']],
      [[]]
    ]
  );
  assert.equal(inputs.get('resources.filter.label').tokenSeparators, undefined);
});
