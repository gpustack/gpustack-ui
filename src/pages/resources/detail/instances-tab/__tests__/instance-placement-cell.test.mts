import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
let tooltipProps: any;
const wrap = ({ children }: any) => createElement('span', {}, children);
mock.module('@ant-design/icons', {
  namedExports: { InfoCircleOutlined: () => null }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id.split('.').at(-1) })
  }
});
mock.module('antd', { namedExports: { Flex: wrap } });
mock.module('@gpustack/core-ui', {
  namedExports: {
    ThemeTag: wrap,
    TooltipOverlayScroller: ({ children, title, toolTipProps }: any) => {
      tooltipProps = toolTipProps;
      return createElement(
        'div',
        {},
        children,
        toolTipProps.open
          ? createElement('div', { role: 'tooltip' }, title)
          : null
      );
    },
    SimpleTable: ({ columns, dataSource }: any) =>
      createElement(
        'table',
        {},
        createElement(
          'tbody',
          {},
          ...dataSource.map((row: any) =>
            createElement(
              'tr',
              { key: row.worker_id },
              ...columns.map((c: any) =>
                createElement(
                  'td',
                  { key: c.key },
                  c.render ? c.render({ row }) : row[c.key]
                )
              )
            )
          )
        )
      )
  }
});
mock.module(
  new URL('../instance-placement-cell.module.less', import.meta.url).href,
  { defaultExport: {} }
);
const { createRoot } = await import('react-dom/client');
const { default: Cell } = await import('../instance-placement-cell');
const base = {
  id: 1,
  model_id: 10,
  model_name: 'Model',
  name: 'instance',
  state: 'running',
  gpu_device_ids: ['gpu-0'],
  spans_workers: false,
  placements_complete: true
};
const placement = {
  worker_id: 7,
  worker_name: 'Worker A',
  worker_ip: '192.0.2.7',
  gpu_indexes: [0],
  is_main: true
};

test('a single Worker and GPU need no badge', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(Cell, { instance: { ...base, placements: [placement] } })
    )
  );
  assert.equal(document.querySelector('button'), null);
  await act(async () => root.unmount());
});

test('multiple GPUs have one badge, focusable tooltip and Escape dismissal', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(Cell, {
        instance: {
          ...base,
          placements: [{ ...placement, gpu_indexes: [0, 1] }]
        }
      })
    )
  );
  assert.equal(document.querySelector('button')?.textContent, 'multiGPU');
  assert.deepEqual(tooltipProps.trigger, ['hover', 'focus']);
  await act(async () =>
    document
      .querySelector('button')!
      .dispatchEvent(new dom.window.FocusEvent('focusin', { bubbles: true }))
  );
  const tooltip = document.querySelector('[role=tooltip]')!;
  assert.match(tooltip.textContent!, /Worker AmainWorker192.0.2.7GPU 0, 1/);
  assert.equal(tooltip.querySelectorAll('tr').length, 1);
  assert.doesNotMatch(tooltip.textContent!, /placementsUnavailable/);
  await act(async () =>
    document.querySelector('button')!.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })
    )
  );
  assert.equal(document.querySelector('[role=tooltip]'), null);
  await act(async () => root.unmount());
});

test('cross Worker tooltip lists every authorized placement, including CPU peers, and labels incomplete topology', async () => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(Cell, {
        instance: {
          ...base,
          spans_workers: true,
          placements_complete: false,
          placements: [
            placement,
            {
              ...placement,
              worker_id: 8,
              worker_name: 'Worker B',
              worker_ip: null,
              gpu_indexes: [],
              is_main: false
            }
          ]
        }
      })
    )
  );
  assert.equal(document.querySelector('button')?.textContent, 'distributed');
  await act(async () => tooltipProps.onOpenChange(true));
  const tooltip = document.querySelector('[role=tooltip]')!;
  assert.equal(tooltip.querySelectorAll('tr').length, 2);
  assert.match(tooltip.textContent!, /Worker B——/);
  assert.match(tooltip.textContent!, /placementsUnavailable/);
  await act(async () => root.unmount());
});
