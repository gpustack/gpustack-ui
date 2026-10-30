import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

const tooltips: any[] = [];
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: ({ maxWidth, title, children, ...props }: any) => {
      tooltips.push({ maxWidth, title });
      return createElement('span', props, children);
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: (_message: any, values: any) => `Filter by ${values.label}`
    })
  }
});
mock.module('antd', {
  namedExports: {
    Flex: ({ children }: any) => createElement('div', null, children)
  }
});
mock.module(new URL('../worker-label-cell.module.less', import.meta.url).href, {
  defaultExport: { label: 'label' }
});
const dom = new JSDOM('<div id="root"></div>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true
});
after(() => dom.window.close());
const WorkerLabelCell = (await import('../worker-label-cell.tsx')).default;

const mount = async (t: any, labels: any) => {
  tooltips.length = 0;
  const onFilter = mock.fn();
  const onRowClick = mock.fn();
  const root = createRoot(document.getElementById('root')!);
  await act(async () =>
    root.render(
      createElement(
        'div',
        { onClick: onRowClick },
        createElement(WorkerLabelCell, { labels, onFilter })
      )
    )
  );
  t.after(async () => act(async () => root.unmount()));
  return { onFilter, onRowClick };
};

test('clicking a readable label adds its exact pair without selecting the row', async (t) => {
  const { onFilter, onRowClick } = await mount(t, { arch: 'amd64' });
  const button = document.querySelector<HTMLElement>('[role="button"]')!;
  assert.equal(button.textContent, 'arch: amd64');
  assert.equal(button.getAttribute('aria-label'), 'Filter by arch: amd64');
  await act(async () => button.click());
  assert.deepEqual(onFilter.mock.calls[0].arguments, ['arch=amd64']);
  assert.equal(onRowClick.mock.callCount(), 0);
});

for (const key of ['Enter', ' ']) {
  test(`label quick filtering supports keyboard ${JSON.stringify(key)}`, async (t) => {
    const { onFilter } = await mount(t, { city: 'New York, US' });
    const button = document.querySelector<HTMLElement>('[role="button"]')!;
    const event = new dom.window.KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    await act(async () => {
      button.dispatchEvent(event);
    });
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(onFilter.mock.calls[0].arguments, ['city=New York, US']);
  });
}

test('long labels retain their complete tooltip', async (t) => {
  const value = 'a-very-long-label-value-that-does-not-fit-in-the-table-cell';
  await mount(t, { region: value });
  assert.equal(tooltips[0].title, `region: ${value}`);
  assert.equal(tooltips[0].maxWidth, 155);
});

test('unrepresentable label keys remain visible without a misleading filter action', async (t) => {
  await mount(t, { 'a=b': 'x' });
  assert.equal(document.querySelector('[role="button"]'), null);
  assert.match(document.body.textContent!, /a=b: x/);
});
