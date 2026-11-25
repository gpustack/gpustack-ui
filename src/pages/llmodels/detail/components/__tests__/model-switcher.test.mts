import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let select: any;
let tenant = 'tenant-a';
const onSelect = mock.fn();
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
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
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

test('the switcher stages a different model and waits for it with the current model selected', () => {
  const render = (switching: boolean) =>
    renderToStaticMarkup(
      createElement(ModelSwitcher, {
        id: 7,
        name: 'Current model',
        tenant: 'tenant-a',
        switching,
        onSelect
      })
    );
  render(false);
  assert.deepEqual(
    select.options.map(({ label }: { label: string }) => label),
    ['Current model', 'Other model']
  );
  assert.equal(select.value, 7);
  assert.equal(fetchData.mock.callCount(), 0);
  select.onOpenChange(true);
  assert.deepEqual(fetchData.mock.calls[0].arguments, [{ page: -1 }]);
  select.onSelect(7);
  assert.equal(onSelect.mock.callCount(), 0);
  select.onSelect(8);
  assert.deepEqual(onSelect.mock.calls[0].arguments, [8]);
  render(true);
  assert.equal(select.value, 7);
  assert.equal(select.loading, true);
  select.onSelect(7);
  assert.deepEqual(onSelect.mock.calls[1].arguments, [7]);

  tenant = 'tenant-b';
  select.onOpenChange(true);
  select.onSelect(8);
  assert.equal(fetchData.mock.callCount(), 1);
  assert.equal(onSelect.mock.callCount(), 2);
});
