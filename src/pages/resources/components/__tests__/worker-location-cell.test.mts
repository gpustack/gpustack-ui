import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';
import type {
  TopologyLayerView,
  TopologyView
} from '../../../cluster-management/config/types';

const require = createRequire(import.meta.url);
// Use the same formatter dependency as the application's Umi locale context.
const { IntlProvider, useIntl } = require(
  require.resolve('react-intl', {
    paths: [require.resolve('@umijs/plugins/package.json')]
  })
);
const messages = {
  'test.layer.zone': '可用区',
  'resources.table.location': 'Topology location',
  'resources.worker.location.totalLayers': '{count} layers',
  'resources.worker.location.unfilled': 'Unfilled',
  'resources.worker.location.unavailable': 'Unavailable',
  'resources.worker.location.moreLayers': '+{count}',
  'resources.worker.location.open': 'View topology for {worker}'
};
mock.module('@umijs/max', { namedExports: { useIntl } });
mock.module('@gpustack/core-ui', {
  namedExports: {
    OverlayScroller: ({ children }: any) => createElement('div', null, children)
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({ styles: {} })
  }
});
mock.module(
  new URL('../../../cluster-management/config/index.ts', import.meta.url).href,
  {
    namedExports: {
      topologyLayerLabel: (intl: any, layer: any) =>
        layer.display_name ||
        (layer.builtin
          ? intl.formatMessage({ id: `test.layer.${layer.name}` })
          : layer.name)
    }
  }
);
mock.module('antd', {
  namedExports: {
    Flex: ({
      children,
      component = 'div',
      orientation,
      align,
      justify,
      gap,
      wrap,
      vertical,
      flex,
      ...props
    }: any) => createElement(component, props, children),
    Tooltip: ({ children, title, trigger = ['hover'] }: any) => {
      const [open, setOpen] = useState(false);
      const triggers = Array.isArray(trigger) ? trigger : [trigger];
      return createElement(
        'div',
        {
          'data-tooltip-trigger': true,
          onMouseEnter: () => triggers.includes('hover') && setOpen(true),
          onClick: () =>
            triggers.includes('click') && setOpen((current) => !current)
        },
        children,
        open && createElement('aside', { role: 'tooltip' }, title)
      );
    }
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
const { default: WorkerLocationCell } =
  await import('../worker-location-cell.tsx');
const { NODE_LAYER } =
  await import('../../../cluster-management/config/types.ts');

const layer = (
  name: string,
  overrides: Partial<TopologyLayerView> = {}
): TopologyLayerView => ({
  id: `layer-${name}`,
  name,
  builtin: false,
  active: true,
  label_keys: [`labels/${name}`],
  primary_key: null,
  domains: 1,
  classified: 1,
  unclassified: 0,
  ...overrides
});
const topology = (layers: TopologyLayerView[]) => ({ layers }) as TopologyView;
const mount = async (
  view: TopologyView | undefined,
  labels: Record<string, string> = {},
  facts: Record<string, string> = {}
) => {
  const root = createRoot(document.getElementById('root')!);
  await act(async () => {
    root.render(
      createElement(
        IntlProvider,
        {
          locale: 'en-US',
          messages,
          onError: (error: unknown) => {
            throw error;
          }
        },
        createElement(WorkerLocationCell, {
          worker: {
            name: 'worker-a',
            labels,
            status: { topology_facts: facts }
          } as any,
          view
        })
      )
    );
  });
  const trigger = document.querySelector<HTMLElement>(
    '[role="button"], [aria-disabled="true"]'
  )!;
  assert.ok(trigger);
  return {
    trigger,
    details: async (action: 'hover' | 'click' = 'click') => {
      await act(async () => {
        if (action === 'click') trigger.click();
        else
          document
            .querySelector('[data-tooltip-trigger]')!
            .dispatchEvent(
              new dom.window.MouseEvent('mouseover', { bubbles: true })
            );
      });
      const popup = document.querySelector('[role="tooltip"]');
      assert.ok(popup);
      return popup.textContent || '';
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('the summary shows only the first resolved layer and +N, while clicking reveals the entire hierarchy', async (t) => {
  const cell = await mount(
    topology(['zone', 'pod', 'rack', 'domain'].map((name) => layer(name))),
    {
      'labels/zone': 'Z1',
      'labels/pod': 'P1',
      'labels/rack': 'R1',
      'labels/domain': 'D1'
    }
  );
  t.after(cell.unmount);
  assert.match(cell.trigger.textContent!, /zone\s*:\s*Z1/);
  assert.ok(!cell.trigger.textContent?.includes('D1'));
  assert.ok(!cell.trigger.textContent?.includes('P1'));
  assert.ok(!cell.trigger.textContent?.includes('R1'));
  assert.ok(cell.trigger.textContent?.endsWith('+3'));
  assert.equal(document.querySelector('[role="tooltip"]'), null);
  assert.match(
    await cell.details('click'),
    /zone.*Z1.*pod.*P1.*rack.*R1.*domain.*D1/
  );
});

test('the first resolved layer skips earlier missing layers and counts all hidden layers', async (t) => {
  const cell = await mount(
    topology(['zone', 'pod', 'rack'].map((name) => layer(name))),
    { 'labels/pod': 'P1' }
  );
  t.after(cell.unmount);
  assert.match(cell.trigger.textContent!, /pod\s*:\s*P1/);
  assert.equal(cell.trigger.textContent?.match(/P1/g)?.length, 1);
  assert.ok(cell.trigger.textContent?.endsWith('+2'));
  const details = await cell.details();
  assert.match(details, /zone.*Unfilled.*pod.*P1.*rack.*Unfilled/);
});

test('unresolved topology shows an unfilled summary and ordered details on click', async (t) => {
  const cell = await mount(
    topology([layer('zone', { active: false }), layer('rack')])
  );
  t.after(cell.unmount);
  assert.ok(cell.trigger.textContent?.includes('Unfilled'));
  assert.match(await cell.details('click'), /zone.*Unfilled.*rack.*Unfilled/);
});

test('Enter and Space activate the focusable summary to show all hierarchy details', async (t) => {
  const cell = await mount(topology([layer('zone'), layer('rack')]), {
    'labels/zone': 'Z1',
    'labels/rack': 'R1'
  });
  t.after(cell.unmount);
  assert.equal(cell.trigger.getAttribute('role'), 'button');
  assert.equal(cell.trigger.tabIndex, 0);
  for (const key of ['Enter', ' ']) {
    if (document.querySelector('[role="tooltip"]')) {
      await act(async () => cell.trigger.click());
    }
    const event = new dom.window.KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    await act(async () => cell.trigger.dispatchEvent(event));
    assert.equal(event.defaultPrevented, true);
    assert.match(
      document.querySelector('[role="tooltip"]')?.textContent || '',
      /zone.*Z1.*rack.*R1/
    );
  }
});

test('a single enabled layer resolves discovered facts without duplication or a hidden count', async (t) => {
  const cell = await mount(
    topology([layer('zone')]),
    {},
    { 'labels/zone': 'Discovered zone' }
  );
  t.after(cell.unmount);
  assert.equal(cell.trigger.textContent?.match(/Discovered zone/g)?.length, 1);
  assert.ok(!cell.trigger.textContent?.includes('+'));
  assert.match(await cell.details(), /zone.*Discovered zone/);
  assert.equal(
    document.querySelectorAll('[role="tooltip"] .divider').length,
    0
  );
});

test('an empty hierarchy stays inspectable and shows unfilled details', async (t) => {
  const cell = await mount(topology([]));
  t.after(cell.unmount);
  assert.equal(cell.trigger.textContent, 'Unfilled');
  assert.equal(await cell.details(), 'Topology location0 layersUnfilled');
  assert.equal(cell.trigger.getAttribute('aria-disabled'), 'false');
});

test('disabled and host layers are excluded while inactive layers and custom names remain', async (t) => {
  const cell = await mount(
    topology([
      layer('zone', { active: false }),
      layer('disabled', { disabled: true }),
      layer('custom', { display_name: 'Operator layer' }),
      layer('rack'),
      layer('host', { id: NODE_LAYER })
    ]),
    {
      'labels/zone': 'Z1',
      'labels/disabled': 'Hidden value',
      'labels/custom': 'User value',
      'labels/host': 'worker-a'
    },
    { 'labels/custom': 'Discovered value' }
  );
  t.after(cell.unmount);
  assert.match(cell.trigger.textContent!, /zone\s*:\s*Z1/);
  assert.ok(!cell.trigger.textContent?.includes('User value'));
  assert.ok(cell.trigger.textContent?.endsWith('+2'));
  const details = await cell.details();
  assert.match(details, /zone.*Z1.*Operator layer.*User value.*rack.*Unfilled/);
  assert.ok(!details.includes('disabled'));
  assert.ok(!details.includes('Hidden value'));
  assert.ok(!details.includes('host'));
  assert.ok(!details.includes('worker-a'));
  assert.ok(!details.includes('Discovered value'));
});

test('detail rows preserve custom and translated labels, including distinct layers with the same display name', async (t) => {
  const errors = t.mock.method(console, 'error', () => {});
  const cell = await mount(
    topology([
      layer('first', { display_name: 'Shared display name' }),
      layer('second', { display_name: 'Shared display name' }),
      layer('zone', { builtin: true })
    ]),
    {
      'labels/first': 'Value A',
      'labels/second': 'Value B',
      'labels/zone': 'Z1'
    }
  );
  t.after(cell.unmount);
  assert.equal(
    await cell.details('click'),
    'Topology location3 layersShared display nameValue AShared display nameValue B可用区Z1'
  );
  assert.equal(
    document.querySelectorAll('[role="tooltip"] .divider').length,
    2
  );
  assert.equal(errors.mock.callCount(), 0);
});

test('unavailable topology cannot be clicked and explains why on hover', async (t) => {
  const cell = await mount(undefined, { 'labels/zone': 'Z1' });
  t.after(cell.unmount);
  await act(async () => cell.trigger.click());
  assert.equal(document.querySelector('[role="tooltip"]'), null);
  assert.equal(cell.trigger.getAttribute('aria-disabled'), 'true');
  assert.ok((await cell.details('hover')).includes('Unavailable'));
});
