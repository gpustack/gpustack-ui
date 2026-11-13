import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useState } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
for (const name of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'SVGElement',
  'ShadowRoot',
  'getComputedStyle'
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: name === 'window' ? dom.window : (dom.window as any)[name]
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true
});
after(() => dom.window.close());
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(
  new URL('../section-navigation.module.less', import.meta.url).href,
  { defaultExport: {} }
);
const { createRoot } = await import('react-dom/client');
const { default: SectionNavigation } = await import('../section-navigation');

for (const pd of [false, true]) {
  test(`${pd ? 'PD' : 'ordinary'} section controls expand/collapse all current sections and keep state through filter rerenders`, async (t) => {
    const container = document.getElementById('root')!;
    const root = createRoot(container);
    t.after(async () => act(async () => root.unmount()));
    const sections = [
      'llm',
      'stages',
      'cache',
      ...(pd ? ['pd'] : []),
      'gpu',
      'host'
    ].map((key) => ({ key, label: key }));
    let updateFilter!: () => void;
    let current: string[] = [];
    const open = mock.fn();
    const Harness = () => {
      const [expanded, setExpanded] = useState(['llm', 'gpu']);
      const [filter, setFilter] = useState('1h');
      current = expanded;
      updateFilter = () => setFilter('24h');
      return createElement(
        'div',
        { 'data-model-monitor-layout': true },
        filter,
        createElement(SectionNavigation, {
          sections,
          expanded,
          onOpen: open,
          onChange: setExpanded
        })
      );
    };
    await act(async () => root.render(createElement(Harness)));
    assert.ok(container.textContent?.includes('modelMonitoring.jumpTo'));
    assert.equal(container.querySelector('[role="tab"]'), null);
    const button = (id: string) =>
      [...container.querySelectorAll('button')].find(
        (element) => element.textContent === id
      )!;
    await act(async () => button('modelMonitoring.expandAll').click());
    assert.deepEqual(
      current,
      sections.map((section) => section.key)
    );
    assert.equal(button('modelMonitoring.expandAll').disabled, true);
    await act(async () => button('modelMonitoring.collapseAll').click());
    assert.deepEqual(current, []);
    assert.equal(button('modelMonitoring.collapseAll').disabled, true);
    await act(async () => updateFilter());
    assert.deepEqual(current, []);
    await act(async () => button('gpu').click());
    assert.deepEqual(open.mock.calls.at(-1)?.arguments, ['gpu']);
  });
}

test('one monitoring section omits jump navigation while retaining visibility controls', async (t) => {
  const container = document.getElementById('root')!;
  const root = createRoot(container);
  t.after(async () => act(async () => root.unmount()));
  const open = mock.fn();
  let current: string[] = [];
  const Harness = () => {
    const [expanded, setExpanded] = useState(['gpu']);
    current = expanded;
    return createElement(SectionNavigation, {
      sections: [{ key: 'gpu', label: 'GPU monitoring' }],
      expanded,
      onOpen: open,
      onChange: setExpanded
    });
  };
  await act(async () => root.render(createElement(Harness)));
  assert.doesNotMatch(
    container.textContent!,
    /modelMonitoring.jumpTo|GPU monitoring/
  );
  assert.equal(container.querySelector('[role=navigation]'), null);
  const button = (id: string) =>
    [...container.querySelectorAll('button')].find(
      (element) => element.textContent === id
    )!;
  assert.equal(button('modelMonitoring.expandAll').disabled, true);
  await act(async () => button('modelMonitoring.collapseAll').click());
  assert.deepEqual(current, []);
  assert.equal(button('modelMonitoring.collapseAll').disabled, true);
  await act(async () => button('modelMonitoring.expandAll').click());
  assert.deepEqual(current, ['gpu']);
  assert.equal(open.mock.calls.length, 0);
});
