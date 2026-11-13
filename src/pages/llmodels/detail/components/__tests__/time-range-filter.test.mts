import dayjs from 'dayjs';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<div id="root"></div>');
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'Node'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'window' ? dom.window : (dom.window as any)[key]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true
});
after(() => dom.window.close());
let picker: any;
mock.module('@ant-design/icons', {
  namedExports: { CalendarOutlined: () => null }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    BaseSelect: (props: any) =>
      createElement(
        'select',
        {
          id: props.id,
          'aria-label': props['aria-label'],
          value: props.value,
          onChange: (event: any) => props.onChange(event.target.value)
        },
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
      )
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values: any) =>
        id + (values ? JSON.stringify(values) : '')
    })
  }
});
mock.module('antd', {
  namedExports: {
    Flex: ({ children }: any) => createElement('div', {}, children),
    Typography: {
      Text: ({ children, role }: any) =>
        createElement('span', { role }, children)
    },
    Tooltip: ({ children }: any) => children,
    Button: (props: any) =>
      createElement(
        'button',
        {
          'aria-label': props['aria-label'],
          disabled: props.disabled,
          onClick: props.onClick
        },
        props.children
      ),
    DatePicker: {
      RangePicker: (props: any) => {
        picker = props;
        return createElement('div', { 'data-picker': true });
      }
    },
    Modal: (props: any) =>
      props.open
        ? createElement(
            'div',
            { role: 'dialog' },
            props.children,
            createElement(
              'button',
              {
                'data-apply': true,
                disabled: props.okButtonProps.disabled,
                onClick: props.onOk
              },
              props.okText
            )
          )
        : null
  }
});
let context: any;
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
const { createRoot } = await import('react-dom/client');
const { default: TimeRangeFilter } = await import('../time-range-filter');
const mount = async (capabilities?: any) => {
  const changeScope = mock.fn();
  context = {
    scope: {
      window: '1h',
      instanceIds: [7],
      role: 'decode',
      view: 'instances'
    },
    changeScope,
    capabilities: capabilities
      ? { data: capabilities, stale: false }
      : undefined
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(TimeRangeFilter)));
  return { changeScope, unmount: () => act(async () => root.unmount()) };
};
const capability = {
  min_query_seconds: 300,
  max_query_seconds: 604800,
  retention_seconds: 900,
  retention_known: true,
  retention_size_based: false,
  supports_custom_range: true
};

test('quick ranges use the service span cap independently from a shorter configured retention', async (t) => {
  const view = await mount(capability);
  t.after(view.unmount);
  const option =
    document.querySelector<HTMLOptionElement>('option[value="1h"]')!;
  assert.equal(option.disabled, false);
  const select = document.querySelector<HTMLSelectElement>('select')!;
  await act(async () => {
    select.value = '6h';
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  assert.deepEqual(view.changeScope.mock.calls.at(-1)?.arguments, [
    { window: '6h' }
  ]);
  assert.ok(
    !document.body.textContent?.includes('modelMonitoring.queryRangeLimit')
  );
  assert.ok(
    !document.body.textContent?.includes(
      'modelMonitoring.retentionConfiguredTime'
    )
  );
});

test('custom range is a draft until Apply, and then sends integer fixed endpoints only', async (t) => {
  const view = await mount(capability);
  t.after(view.unmount);
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="modelMonitoring.customTimeRange"]'
      )!
      .click()
  );
  assert.equal(view.changeScope.mock.calls.length, 0);
  assert.equal(picker.needConfirm, false);
  const dialog = document.querySelector('[role="dialog"]')!;
  assert.ok(dialog.textContent?.includes('"duration":"15m"'));
  assert.ok(dialog.textContent?.includes('"maximum":"7d"'));
  await act(async () => picker.onChange([dayjs(1000000), dayjs(4600000)]));
  await act(async () =>
    document.querySelector<HTMLButtonElement>('button[data-apply]')!.click()
  );
  assert.deepEqual(view.changeScope.mock.calls.at(-1)?.arguments, [
    { start: 1000, end: 4600 }
  ]);
  assert.equal(document.querySelector('[role="dialog"]'), null);
});

test('invalid, future, short and oversized drafts cannot issue scope changes', async (t) => {
  const view = await mount(capability);
  t.after(view.unmount);
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="modelMonitoring.customTimeRange"]'
      )!
      .click()
  );
  const now = Math.floor(Date.now() / 1000);
  for (const [start, end, error] of [
    [1000, 1200, 'tooShort'],
    [4600, 1000, 'invalid'],
    [now, now + 3600, 'future'],
    [1000, 605801, 'tooLong']
  ] as const) {
    await act(async () =>
      picker.onChange([dayjs(start * 1000), dayjs(end * 1000)])
    );
    const apply =
      document.querySelector<HTMLButtonElement>('button[data-apply]')!;
    assert.equal(apply.disabled, true);
    assert.ok(
      document
        .querySelector('[role="alert"]')
        ?.textContent?.includes(`timeRangeError.${error}`)
    );
    await act(async () => apply.click());
  }
  assert.equal(view.changeScope.mock.calls.length, 0);
});

test('an unknown backend keeps quick ranges but disables unsupported custom selection', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  assert.equal(
    document.querySelector<HTMLOptionElement>('option[value="custom"]')!
      .disabled,
    true
  );
  const custom = document.querySelector<HTMLButtonElement>(
    'button[aria-label="modelMonitoring.customTimeRange"]'
  )!;
  assert.equal(custom.disabled, true);
  await act(async () => custom.click());
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.ok(
    !document.body.textContent?.includes('modelMonitoring.retentionUnknown')
  );
});
