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
const mount = async (t: any) => {
  inputs.clear();
  const onLabelChange = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  await act(async () => {
    root.render(
      createElement(WorkerFilters, {
        label: ['region=beijing'],
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

for (const value of [
  'region=beijing',
  'Region=Beijing',
  'region=',
  'city=New York',
  'url=http://host:8000?a=b',
  '',
  'region',
  'beijing',
  'region beijing',
  'region:beijing',
  '=beijing',
  ' '
]) {
  test(`forwards committed labels without validation: ${JSON.stringify(value)}`, async (t) => {
    const { onLabelChange, change } = await mount(t);
    const labels = value === '' ? [] : [value];
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
  await change(['region:beijing']);
  await change([]);
  assert.deepEqual(
    onLabelChange.mock.calls.map((call) => call.arguments),
    [[['region:beijing']], [[]]]
  );
  assert.equal(inputs.get('resources.filter.label').status, undefined);
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
