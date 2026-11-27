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
let compact = false;
const dates: any[] = [];
const times: any[] = [];
const DatePicker = Object.assign(
  (props: any) => {
    const index = props['aria-label'].includes('rangeStart') ? 0 : 1;
    dates[index] = props;
    return createElement('input', {
      'aria-label': props['aria-label'],
      value: props.value?.format(props.format) || '',
      readOnly: true
    });
  },
  {
    RangePicker: (props: any) => {
      picker = props;
      return createElement('div', { 'data-picker': true });
    }
  }
);
mock.module('@ant-design/icons', {
  namedExports: { CalendarOutlined: () => null }
});
mock.module('@gpustack/core-ui', {
  namedExports: { BaseSelect: () => null }
});
mock.module(
  new URL(
    '../../../../_components/monitoring/time-range-presets.module.less',
    import.meta.url
  ).href,
  { defaultExport: {} }
);
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
    Grid: { useBreakpoint: () => ({ xs: compact }) },
    Flex: ({ children, role, 'aria-label': label }: any) =>
      createElement('div', { role, 'aria-label': label }, children),
    Segmented: ({ options, value, onChange, 'aria-label': label }: any) =>
      createElement(
        'div',
        { role: 'radiogroup', 'aria-label': label },
        options.map((option: any) =>
          createElement(
            'label',
            { key: option.value },
            createElement('input', {
              type: 'radio',
              name: label,
              value: option.value,
              checked: option.value === value,
              disabled: option.disabled,
              onChange: () => onChange(option.value)
            }),
            option.label
          )
        )
      ),
    Dropdown: ({ children, menu }: any) =>
      createElement(
        'div',
        null,
        children,
        createElement(
          'div',
          { role: 'menu' },
          menu.items.map((item: any) =>
            createElement(
              'button',
              {
                key: item.key,
                'data-range': item.key,
                role: 'menuitem',
                disabled: item.disabled,
                onClick: () => menu.onClick({ key: item.key })
              },
              item.label
            )
          )
        )
      ),
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
    DatePicker,
    TimePicker: (props: any) => {
      const index = props['aria-label'].includes('rangeStart') ? 0 : 1;
      times[index] = props;
      return createElement('input', {
        'aria-label': props['aria-label'],
        value: props.value?.format(props.format) || '',
        readOnly: true
      });
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
const mount = async (capabilities?: any, mobile = false) => {
  compact = mobile;
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
const customRange = () =>
  document.querySelector<HTMLButtonElement>('button[data-range="custom"]')!;
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
  const radios = [
    ...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')
  ];
  assert.deepEqual(
    radios.map((radio) => radio.value),
    ['15m', '1h', '24h', '7d']
  );
  assert.equal(radios.find((radio) => radio.value === '1h')?.checked, true);
  await act(async () => radios.find((radio) => radio.value === '24h')!.click());
  assert.deepEqual(view.changeScope.mock.calls.at(-1)?.arguments, [
    { window: '24h' }
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
  await act(async () => customRange().click());
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
  await act(async () => customRange().click());
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
  assert.equal(customRange().disabled, true);
  await act(async () => customRange().click());
  const otherRange = document.querySelector<HTMLButtonElement>(
    'button[data-range="6h"]'
  )!;
  assert.equal(otherRange.disabled, false);
  await act(async () => otherRange.click());
  assert.deepEqual(view.changeScope.mock.calls.at(-1)?.arguments, [
    { window: '6h' }
  ]);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.ok(
    !document.body.textContent?.includes('modelMonitoring.retentionUnknown')
  );
});

test('compact endpoint panels preserve the other date/time part and only Apply changes the scope', async (t) => {
  const view = await mount(capability, true);
  t.after(view.unmount);
  await act(async () => customRange().click());
  assert.equal(document.querySelector('[data-picker]'), null);
  assert.equal(document.querySelectorAll('[role="dialog"] input').length, 4);
  const startTime = dates[0].value.format('HH:mm:ss');
  await act(async () => dates[0].onChange(dayjs('2020-02-29')));
  assert.equal(dates[0].value.format('YYYY-MM-DD'), '2020-02-29');
  assert.equal(dates[0].value.format('HH:mm:ss'), startTime);
  await act(async () => times[0].onChange(dayjs('2026-11-16T10:11:12')));
  assert.equal(
    dates[0].value.format('YYYY-MM-DD HH:mm:ss'),
    '2020-02-29 10:11:12'
  );
  await act(async () => dates[1].onChange(dayjs('2020-02-29')));
  await act(async () => times[1].onChange(dayjs('2026-11-16T11:12:13')));
  assert.equal(view.changeScope.mock.callCount(), 0);
  await act(async () =>
    document.querySelector<HTMLButtonElement>('button[data-apply]')!.click()
  );
  assert.deepEqual(view.changeScope.mock.calls.at(-1)?.arguments, [
    {
      start: dayjs('2020-02-29T10:11:12').unix(),
      end: dayjs('2020-02-29T11:12:13').unix()
    }
  ]);
});

test('compact fields keep future and invalid endpoints unapplied, with the same service span validation', async (t) => {
  const view = await mount(capability, true);
  t.after(view.unmount);
  await act(async () => customRange().click());
  for (const [start, end, error] of [
    ['2020-02-29T10:00:00', '2020-02-29T10:02:00', 'tooShort'],
    ['2020-02-29T11:00:00', '2020-02-29T10:00:00', 'invalid'],
    ['2020-02-29T10:00:00', '2020-03-08T10:00:00', 'tooLong'],
    [dayjs().format(), dayjs().add(1, 'hour').format(), 'future']
  ]) {
    for (const [index, value] of [start, end].entries()) {
      await act(async () => dates[index].onChange(dayjs(value)));
      await act(async () => times[index].onChange(dayjs(value)));
    }
    assert.equal(
      document.querySelector<HTMLButtonElement>('button[data-apply]')!.disabled,
      true
    );
    assert.ok(
      document
        .querySelector('[role="alert"]')
        ?.textContent?.includes(`timeRangeError.${error}`)
    );
  }
  assert.equal(view.changeScope.mock.callCount(), 0);
});
