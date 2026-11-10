import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';

const initialize = (element: HTMLElement) => {
  if (element.querySelector('.test-viewport')) return;
  const viewport = element.ownerDocument.createElement('div');
  viewport.className = 'test-viewport';
  while (element.firstChild) viewport.appendChild(element.firstChild);
  element.appendChild(viewport);
};
mock.module('@gpustack/core-ui', {
  namedExports: { useOverlayScroller: () => ({ initialize }) }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: () => 'No models' }) }
});
mock.module(
  new URL('../comparison-workspace.module.less', import.meta.url).href,
  { defaultExport: { panels: 'panels' } }
);

test('comparison content can change after the scroll viewport reparents its children', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const keys = [
    'window',
    'document',
    'navigator',
    'getComputedStyle',
    'IS_REACT_ACT_ENVIRONMENT'
  ];
  const descriptors = keys.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  keys.forEach((key) =>
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
    })
  );
  dom.window.matchMedia = () =>
    ({ matches: false, addListener() {}, removeListener() {} }) as any;
  const { createRoot } = await import('react-dom/client');
  const { default: ComparisonWorkspace } =
    await import('../comparison-workspace');
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  const selections = [
    { label: 'a', value: 'a', uid: 1, instanceId: Symbol('a') }
  ];
  const render = (models: typeof selections) =>
    act(async () =>
      root.render(
        createElement(ComparisonWorkspace, {
          layout: { span: 12, count: 2 },
          modelSelections: models,
          loaded: true,
          renderPanel: (model) => createElement('p', null, model.label),
          footer: null
        })
      )
    );
  try {
    await render(selections);
    assert.equal(container.querySelector('.test-viewport')?.textContent, 'a');
    await render([]);
    assert.equal(
      container.querySelector('.ant-empty-description')?.textContent,
      'No models'
    );
    await render(selections);
    assert.equal(container.querySelector('.test-viewport')?.textContent, 'a');
  } finally {
    await act(async () => root.unmount());
    keys.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
    dom.window.close();
  }
});
