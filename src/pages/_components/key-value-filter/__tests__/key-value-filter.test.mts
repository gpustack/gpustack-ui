import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, forwardRef, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import type { KeyValueFilterValue } from '../types';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true
});
after(() => dom.window.close());
const messages: Record<string, string> = {
  'common.filter.keyValue.placeholder': 'Filter by key and value',
  'common.filter.keyValue.key': 'Select key',
  'common.filter.keyValue.value': 'Select value',
  'common.filter.keyValue.add': 'Add filter condition',
  'common.filter.keyValue.clear': 'Clear filter conditions',
  'common.filter.keyValue.empty': '(empty value)',
  'common.filter.keyValue.chooseKeyFirst': 'Select a key first',
  'common.button.delete': 'Delete'
};
const controls = new Map<string, any>();
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);
const empty = () => null;

mock.module('@ant-design/icons', {
  namedExports: {
    CloseOutlined: empty,
    PlusOutlined: empty,
    CloseCircleFilled: empty,
    SearchOutlined: empty
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    OverlayScroller: passChildren,
    BaseSelect: (props: any) => {
      controls.set(props['aria-label'], props);
      return createElement(
        'select',
        {
          'aria-label': props['aria-label'],
          value: props.value === undefined ? '__none__' : props.value,
          disabled: props.disabled,
          onChange: (event: any) => props.onChange(event.target.value)
        },
        createElement(
          'option',
          { value: '__none__', disabled: true },
          props.placeholder
        ),
        props.options.map((option: any) =>
          createElement(
            'option',
            {
              key: option.value,
              value: option.value,
              disabled: option.disabled
            },
            option.label
          )
        )
      );
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => messages[id] || id })
  }
});
mock.module(new URL('../index.module.less', import.meta.url).href, {
  defaultExport: {}
});
mock.module('antd', {
  namedExports: {
    Flex: passChildren,
    Button: ({ children, onClick, disabled, ...props }: any) =>
      createElement(
        'button',
        { onClick, disabled, 'aria-label': props['aria-label'] },
        children
      ),
    Input: forwardRef(({ suffix, prefix, ...props }: any, ref: any) =>
      createElement(
        Fragment,
        null,
        prefix,
        createElement('input', { ...props, ref }),
        suffix
      )
    ),
    Popover: ({ children, open, onOpenChange, content }: any) =>
      createElement(
        Fragment,
        null,
        createElement('div', { onClick: () => onOpenChange(!open) }, children),
        open ? content : null
      )
  }
});

const { default: KeyValueFilter } = await import('../index.tsx');
const options = [
  { key: 'env', values: ['production', 'staging'] },
  { key: 'team', values: ['backend', 'frontend'] },
  { key: 'literal', values: ['', 'New York, US', 'a=b=c'] }
];

const mount = async (
  t: any,
  initial: KeyValueFilterValue[] = [],
  choices = options
) => {
  controls.clear();
  const changes: KeyValueFilterValue[][] = [];
  let replace!: (value: KeyValueFilterValue[]) => void;
  const root = createRoot(document.getElementById('root')!);
  const Harness = () => {
    const [value, setValue] = useState(initial);
    replace = setValue;
    return createElement(KeyValueFilter, {
      value,
      options: choices,
      onChange: (next) => {
        changes.push(next);
        setValue(next);
      }
    });
  };
  await act(async () => root.render(createElement(Harness)));
  t.after(async () => act(async () => root.unmount()));
  const trigger = () => document.querySelector<HTMLInputElement>('input')!;
  const click = async (label: string) => {
    const button = [
      ...document.querySelectorAll<HTMLButtonElement>('button')
    ].find((element) => element.getAttribute('aria-label') === label);
    assert.ok(button, `button exists: ${label}`);
    await act(async () => button.click());
  };
  const choose = async (label: string, value: string) => {
    const select = [
      ...document.querySelectorAll<HTMLSelectElement>('select')
    ].find((element) => element.getAttribute('aria-label') === label);
    assert.ok(select, `select exists: ${label}`);
    assert.equal(select.disabled, false);
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
  };
  const open = async () => act(async () => trigger().click());
  return {
    changes,
    choose,
    click,
    open,
    trigger,
    replace: async (value: KeyValueFilterValue[]) =>
      act(async () => replace(value))
  };
};

test('keys and dependent values are searchable existing choices; a key alone does not filter', async (t) => {
  const { open, choose, changes } = await mount(t);
  await open();
  assert.equal(controls.get('Select key 1').suffixIcon, undefined);
  assert.equal(
    renderToStaticMarkup(controls.get('Select value 1').suffixIcon),
    ''
  );
  assert.equal(controls.get('Select value 1').disabled, undefined);
  assert.equal(
    controls.get('Select value 1').notFoundContent,
    'Select a key first'
  );
  await choose('Select key 1', 'env');
  assert.deepEqual(changes, []);
  const value = controls.get('Select value 1');
  assert.equal(value.suffixIcon, undefined);
  assert.deepEqual(
    value.options.map((item: any) => item.value),
    ['production', 'staging']
  );
  for (const label of ['Select key 1', 'Select value 1']) {
    assert.equal(controls.get(label).showSearch, true);
    assert.equal(controls.get(label).optionFilterProp, 'label');
    assert.equal(controls.get(label).mode, undefined);
  }
  await choose('Select value 1', 'production');
  assert.deepEqual(changes, [[{ key: 'env', value: 'production' }]]);
});

test('empty key and value candidates suppress their dropdown icons', async (t) => {
  const { open } = await mount(t, [], []);
  await open();
  for (const label of ['Select key 1', 'Select value 1']) {
    assert.deepEqual(controls.get(label).options, []);
    assert.equal(renderToStaticMarkup(controls.get(label).suffixIcon), '');
  }
});

test('adding, editing and deleting rows emits only complete conditions', async (t) => {
  const { open, choose, changes, click } = await mount(t, [
    { key: 'env', value: 'production' }
  ]);
  await open();
  await click('Add filter condition');
  assert.deepEqual(changes, []);
  await choose('Select key 2', 'team');
  await choose('Select value 2', 'backend');
  assert.deepEqual(changes.at(-1), [
    { key: 'env', value: 'production' },
    { key: 'team', value: 'backend' }
  ]);
  await choose('Select key 1', 'literal');
  assert.equal(controls.get('Select value 1').value, undefined);
  assert.deepEqual(changes.at(-1), [{ key: 'team', value: 'backend' }]);
  await choose('Select value 1', 'a=b=c');
  assert.deepEqual(changes.at(-1), [
    { key: 'literal', value: 'a=b=c' },
    { key: 'team', value: 'backend' }
  ]);
  await click('Delete 2');
  assert.deepEqual(changes.at(-1), [{ key: 'literal', value: 'a=b=c' }]);
});

for (const value of ['', 'New York, US', 'a=b=c']) {
  test(`preserves literal value ${JSON.stringify(value)}`, async (t) => {
    const { open, choose, changes } = await mount(t);
    await open();
    await choose('Select key 1', 'literal');
    await choose('Select value 1', value);
    assert.deepEqual(changes, [[{ key: 'literal', value }]]);
  });
}

test('deleting draft rows does not emit queries and identical pairs cannot be selected twice', async (t) => {
  const { open, choose, click, changes } = await mount(t, [
    { key: 'env', value: 'production' }
  ]);
  await open();
  await click('Add filter condition');
  await choose('Select key 2', 'env');
  assert.equal(
    controls
      .get('Select value 2')
      .options.find((item: any) => item.value === 'production').disabled,
    true
  );
  await click('Delete 2');
  assert.deepEqual(changes, []);
});

test('external value replacements reset drafts and retain missing active options', async (t) => {
  const { open, click, replace, trigger } = await mount(t, [
    { key: 'env', value: 'production' }
  ]);
  await open();
  await click('Add filter condition');
  await replace([{ key: 'removed-key', value: 'removed-value' }]);
  assert.equal(document.querySelectorAll('select').length, 2);
  assert.equal(trigger().value, 'removed-key: removed-value');
  assert.deepEqual(controls.get('Select value 1').options, [
    { value: 'removed-value', label: 'removed-value', disabled: false }
  ]);
});

test('property insertion order does not drop drafts or emit unchanged filters', async (t) => {
  const { open, click, changes } = await mount(t, [
    { value: 'production', key: 'env' }
  ]);
  await open();
  await click('Add filter condition');
  assert.equal(document.querySelectorAll('select').length, 4);
  assert.deepEqual(changes, []);
});

test('clear removes every condition, closes the popover and focuses the trigger', async (t) => {
  const { open, click, changes, trigger } = await mount(t, [
    { key: 'env', value: 'production' },
    { key: 'team', value: 'backend' }
  ]);
  await open();
  await click('Clear filter conditions');
  assert.deepEqual(changes, [[]]);
  assert.equal(trigger().value, '');
  assert.equal(trigger().getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, trigger());
});

test('keyboard opening and Escape preserve applied values and discard drafts', async (t) => {
  const { trigger, click, open, changes } = await mount(t, [
    { key: 'env', value: 'production' }
  ]);
  await act(async () =>
    trigger().dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    )
  );
  assert.equal(controls.get('Select key 1').autoFocus, true);
  await click('Add filter condition');
  await act(async () =>
    document.querySelector('[role="dialog"]')!.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })
    )
  );
  assert.equal(trigger().getAttribute('aria-expanded'), 'false');
  assert.deepEqual(changes, []);
  await open();
  assert.equal(document.querySelectorAll('select').length, 2);
});
