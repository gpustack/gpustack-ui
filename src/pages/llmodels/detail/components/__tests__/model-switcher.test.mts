import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let select: any;
let tenant = 'tenant-a';
const setSearchParams = mock.fn();
const fetchData = mock.fn(async () => []);
const dataList = [
  { id: 7, value: 7, label: 'Stale name' },
  { id: 8, value: 8, label: 'Other model' }
];

mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: () => null,
    BaseSelect: (props: any) => {
      select = props;
      return null;
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
    useSearchParams: () => [new URLSearchParams(), setSearchParams]
  }
});
mock.module(
  new URL('../../hooks/use-monitoring-data.ts', import.meta.url).href,
  {
    namedExports: { tenantKey: () => tenant }
  }
);
mock.module(
  new URL('../../../services/use-query-model-list.ts', import.meta.url).href,
  { defaultExport: () => ({ dataList, loading: false, fetchData }) }
);
const { default: ModelSwitcher } = await import('../model-switcher');

test('opens the scoped model list and replaces the detail URL for a different model', () => {
  renderToStaticMarkup(
    createElement(ModelSwitcher, { id: 7, name: 'Current model', tenant })
  );
  assert.deepEqual(
    select.options.map(({ label }: { label: string }) => label),
    ['Current model', 'Other model']
  );
  assert.equal(select.value, 7);
  assert.equal(fetchData.mock.callCount(), 0);
  select.onOpenChange(true);
  assert.deepEqual(fetchData.mock.calls[0].arguments, [{ page: -1 }]);
  select.onChange(7);
  assert.equal(setSearchParams.mock.callCount(), 0);
  select.onChange(8);
  assert.deepEqual(setSearchParams.mock.calls[0].arguments, [
    { id: '8' },
    { replace: true }
  ]);

  tenant = 'tenant-b';
  select.onOpenChange(true);
  select.onChange(8);
  assert.equal(fetchData.mock.callCount(), 1);
  assert.equal(setSearchParams.mock.callCount(), 1);
});
