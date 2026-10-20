import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import type { TopologyKnownKey } from '../../../../config/types';
import type { KeyVocabulary, KnownKeyGroup } from '../key-editor';

const empty = () => null;
let autocompleteOptions: KnownKeyGroup[] = [];
mock.module('@ant-design/icons', {
  namedExports: { CheckOutlined: empty }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module('antd', {
  namedExports: {
    AutoComplete: ({ options, onSelect }: any) => {
      autocompleteOptions = options;
      return createElement(
        'div',
        null,
        options.flatMap((group: KnownKeyGroup) =>
          group.options.map((option) =>
            createElement(
              'button',
              {
                key: option.value,
                disabled: option.disabled,
                onClick: () => onSelect(option.value)
              },
              option.value
            )
          )
        )
      );
    },
    Button: ({ onClick, disabled }: any) =>
      createElement('button', { onClick, disabled }, 'Confirm'),
    Flex: ({ children }: any) => createElement('div', null, children)
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const { createRoot } = await import('react-dom/client');
const { CUSTOM_FIELD, KeyEditor, labelKeyOptions } =
  await import('../key-editor.tsx');

const known: TopologyKnownKey[] = [
  {
    key: 'topology/zone',
    vendor: 'Topology',
    fits: ['zone']
  },
  {
    key: 'vendor.com/shared',
    vendor: 'Vendor',
    fits: ['zone'],
    note: 'Known shared label'
  },
  {
    key: 'hardware/rack',
    vendor: 'Hardware',
    fits: ['rack']
  },
  {
    key: 'rack-only',
    vendor: 'Topology',
    fits: ['rack']
  },
  {
    key: 'common-key',
    vendor: 'Vendor',
    fits: []
  }
];
const workerLabels = [
  {
    'z-last': 'z',
    'a-first': 'a',
    'vendor.com/shared': 'shared',
    'hardware/rack': 'R1',
    'empty-value': ''
  },
  { 'a-first': 'another', 'vendor.com/shared': 'shared-again' }
];
const vocabulary: KeyVocabulary = { known, workerLabels };
const workerKeys = [
  'a-first',
  'empty-value',
  'hardware/rack',
  'vendor.com/shared',
  'z-last'
];
const flatten = (groups: KnownKeyGroup[]) =>
  groups.flatMap((group) => group.options);

test('actual worker keys are offered first, sorted and deduplicated across workers and presets', () => {
  const groups = labelKeyOptions(vocabulary, 'zone', [], 'Worker labels');
  assert.equal(groups[0].label, 'Worker labels');
  assert.deepEqual(
    groups[0].options.map((option) => option.value),
    workerKeys
  );
  const options = flatten(groups);
  assert.equal(
    options.filter((option) => option.value === 'vendor.com/shared').length,
    1
  );
  assert.equal(
    options.find((option) => option.value === 'vendor.com/shared')?.note,
    'Known shared label'
  );
  // Fits filters preset suggestions, never a label that is already on a worker.
  assert.ok(options.some((option) => option.value === 'hardware/rack'));
  assert.ok(options.some((option) => option.value === 'empty-value'));
});

test('existing keys stay visible but disabled, while remaining presets retain fits and vendor grouping', () => {
  const groups = labelKeyOptions(
    vocabulary,
    'zone',
    ['a-first', 'topology/zone'],
    'Worker labels'
  );
  const options = flatten(groups);
  assert.equal(
    options.find((option) => option.value === 'a-first')?.disabled,
    true
  );
  assert.equal(
    options.find((option) => option.value === 'topology/zone')?.disabled,
    true
  );
  assert.equal(
    options.find((option) => option.value === 'z-last')?.disabled,
    false
  );
  assert.ok(!options.some((option) => option.value === 'rack-only'));
  assert.deepEqual(
    groups.slice(1).map((group) => ({
      label: group.label,
      keys: group.options.map((option) => option.value)
    })),
    [
      { label: 'Topology', keys: ['topology/zone'] },
      { label: 'Vendor', keys: ['common-key'] }
    ]
  );
});

test('without worker label keys, suitable vendor presets remain available without an empty worker group', () => {
  for (const labels of [[], [{}]]) {
    const groups = labelKeyOptions(
      { known, workerLabels: labels },
      'zone',
      [],
      'Worker labels'
    );
    assert.deepEqual(
      groups.map((group) => ({
        label: group.label,
        keys: group.options.map((option) => option.value)
      })),
      [
        { label: 'Topology', keys: ['topology/zone'] },
        { label: 'Vendor', keys: ['vendor.com/shared', 'common-key'] }
      ]
    );
  }
});

test('custom layers can choose presets intended for any semantic layer name', () => {
  const groups = labelKeyOptions(
    { known, workerLabels: [] },
    CUSTOM_FIELD,
    [],
    'Worker labels'
  );
  assert.deepEqual(
    flatten(groups)
      .map((option) => option.value)
      .sort(),
    known.map((item) => item.key).sort()
  );
});

test('KeyEditor passes real worker keys to the picker and selecting one adds it', async (t) => {
  const onAdd = mock.fn();
  const onCancel = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => {
    await act(async () => root.unmount());
  });
  await act(async () => {
    root.render(
      createElement(KeyEditor, {
        fieldId: 'zone',
        vocabulary,
        existing: ['vendor.com/shared'],
        onAdd,
        onCancel
      })
    );
  });
  assert.deepEqual(
    autocompleteOptions[0].options.map((option) => option.value),
    workerKeys
  );
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
  assert.equal(
    buttons.find((button) => button.textContent === 'vendor.com/shared')
      ?.disabled,
    true
  );
  const workerOption = buttons.find(
    (button) => button.textContent === 'a-first'
  );
  assert.ok(workerOption);
  await act(async () => workerOption.click());
  assert.deepEqual(onAdd.mock.calls[0].arguments, ['a-first']);
  assert.equal(onCancel.mock.callCount(), 0);
});
