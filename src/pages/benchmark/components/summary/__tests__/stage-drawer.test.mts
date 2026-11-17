import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import messages from '../../../../../locales/en-US/benchmark';

const translations = (messages as any).default ?? messages;
const element = ({ children }: any) => createElement('div', null, children);
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => translations[id] || id })
  }
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    GSDrawer: ({ open, children }: any) =>
      open ? createElement('aside', null, children) : null
  }
});
mock.module('antd', {
  namedExports: {
    Flex: element,
    Space: element,
    Button: ({ children, onClick, disabled }: any) =>
      createElement('button', { onClick, disabled }, children),
    Select: ({ options, value, onChange }: any) =>
      createElement(
        'select',
        {
          value,
          onChange: (event: any) => onChange(Number(event.target.value))
        },
        options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      ),
    Tabs: ({ items, activeKey, onChange }: any) =>
      createElement(
        'div',
        null,
        items.map((item: any) =>
          createElement(
            'button',
            {
              key: item.key,
              role: 'tab',
              disabled: item.disabled,
              'aria-selected': item.key === activeKey,
              onClick: () => onChange(item.key)
            },
            item.label
          )
        ),
        createElement(
          'div',
          { role: 'tabpanel' },
          items.find((item: any) => item.key === activeKey)?.children
        )
      )
  }
});
mock.module(new URL('../overview.tsx', import.meta.url).href, {
  defaultExport: ({ points, probes, onSelect }: any) =>
    createElement(
      'div',
      null,
      [...points, ...probes].map((point: any) =>
        createElement(
          'button',
          {
            key: point.id,
            id: `result-${point.id}`,
            onClick: () => onSelect(point.raw)
          },
          `result ${point.id}`
        )
      )
    )
});
mock.module(new URL('../selected-stage.tsx', import.meta.url).href, {
  defaultExport: ({ point }: any) =>
    createElement('pre', { id: 'selected' }, String(point.id))
});
mock.module(new URL('../stage-comparison.tsx', import.meta.url).href, {
  defaultExport: () => null
});
const observations = ({ points, onSelect }: any) =>
  createElement(
    'div',
    null,
    points.map((point: any) =>
      createElement(
        'button',
        {
          key: point.id,
          id: `resource-${point.id}`,
          onClick: () => onSelect(point)
        },
        `resource ${point.id}`
      )
    )
  );
const observationNamed = {
  StageResourceDetails: () =>
    createElement('pre', { id: 'resource-detail' }, 'resources')
};
mock.module(new URL('../stage-observations.tsx', import.meta.url).href, {
  defaultExport: {
    __esModule: true,
    default: observations,
    ...observationNamed
  }
});
const { default: StageResultsDrawer } = await import('../stage-results-drawer');
const points = [1, 2].map((id) => ({
  id,
  load: id * 8,
  raw: { id, rate: id * 8, sequence: id - 1, input_tokens: null }
})) as any;
const probe = {
  id: 9,
  load: 0,
  raw: { id: 9, rate: null, sequence: 0, input_tokens: null }
} as any;
const data = { context: { stages: [] }, errors: {} } as any;
const Harness = () => {
  const [state, setState] = useState<any>({
    open: false,
    mode: 'results',
    resultsTab: 'results',
    detailTab: 'statistics'
  });
  const [selected, setSelected] = useState(points[0]);
  return createElement(
    'div',
    null,
    createElement(
      'button',
      { id: 'open', onClick: () => setState({ ...state, open: true }) },
      'open'
    ),
    createElement(StageResultsDrawer, {
      state,
      onState: setState,
      points,
      probes: [probe],
      selected,
      onSelect: setSelected,
      data,
      dataForPoint: () => data,
      baselineId: null,
      onBaseline: () => {},
      onShowBands: () => {},
      onEvidence: () => {}
    })
  );
};

test('drawer starts closed, restores its result tab after resource drilldown and keeps probe statistics inspectable', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    navigator: { value: dom.window.navigator, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true }
  });
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(createElement(Harness)));
  assert.equal(document.querySelector('aside'), null);
  const click = async (node: Element | null) => {
    assert.ok(node);
    await act(async () =>
      node.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    );
  };
  await click(document.getElementById('open'));
  assert.equal(
    document.querySelector('[role=tab][aria-selected=true]')?.textContent,
    'Results by stage'
  );
  await click(
    [...document.querySelectorAll('[role=tab]')].find(
      (node) => node.textContent === 'Resource observations'
    )!
  );
  await click(document.getElementById('resource-2'));
  assert.ok(document.getElementById('resource-detail'));
  assert.equal(
    document.querySelector('[role=tab][aria-selected=true]')?.textContent,
    'Resource observations'
  );
  await click(
    [...document.querySelectorAll('button')].find((node) =>
      node.textContent?.includes('Back to results')
    )!
  );
  assert.equal(
    document.querySelector('[role=tab][aria-selected=true]')?.textContent,
    'Resource observations'
  );
  await click(
    [...document.querySelectorAll('[role=tab]')].find(
      (node) => node.textContent === 'Results by stage'
    )!
  );
  await click(document.getElementById('result-9'));
  assert.equal(document.getElementById('selected')?.textContent, '9');
  assert.equal(document.querySelector('select')?.value, '9');
  assert.equal(
    [...document.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(
      (node) => node.textContent === 'Compare stages'
    )?.disabled,
    true
  );
  assert.doesNotMatch(document.body.textContent || '', /Stage 0/);
  await act(async () => root.unmount());
  dom.window.close();
});
