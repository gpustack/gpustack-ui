import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test, type TestContext } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

const empty = () => null;
let items: { key: string }[] = [];
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: empty,
    DropdownButtons: (props: any) => {
      items = props.items;
      return null;
    }
  }
});
mock.module(new URL('../../../../../config/index.ts', import.meta.url).href, {
  namedExports: { StatusMaps: {} }
});
mock.module(
  new URL('../../../hooks/use-download-instance-logs.tsx', import.meta.url)
    .href,
  {
    defaultExport: () => ({ downloadLogs: empty })
  }
);
mock.module(
  new URL('../../../hooks/use-run-benchmark.ts', import.meta.url).href,
  {
    namedExports: {
      useBenchmarkTargetInstance: () => ({ runBenchmarkOnInstance: empty })
    }
  }
);
const { default: ActionsCell } = await import('../actions-cell.tsx');
const { RESTART_LAPSE_MS } = await import('../../../config/index.ts');

const dom = new JSDOM('<html><body></body></html>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true
});
after(() => dom.window.close());

const mountActions = async (
  t: TestContext,
  restartingSince: string | null,
  draining = false
) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    await act(async () => root.unmount());
    container.remove();
  };
  t.after(dispose);
  const render = (since: string | null) =>
    act(async () => {
      root.render(
        createElement(ActionsCell, {
          record: {
            id: 42,
            state: 'error',
            draining_since: draining ? '2026-11-05T00:00:00Z' : null
          } as any,
          modelData: { restarting_since: since } as any,
          onSelect() {}
        })
      );
    });
  await render(restartingSince);
  return { render, dispose };
};

for (const [name, elapsed, draining, expected] of [
  ['no restart', null, false, true],
  ['active restart', 1, false, false],
  ['expired restart', RESTART_LAPSE_MS + 1, false, true],
  ['restart deadline', RESTART_LAPSE_MS, false, true],
  ['draining after restart expires', RESTART_LAPSE_MS + 1, true, false]
] as const) {
  test(`failed instance recreation respects ${name}`, () => {
    const now = Date.parse('2026-11-05T00:00:00Z');
    const clock = mock.method(Date, 'now', () => now);
    try {
      renderToStaticMarkup(
        createElement(ActionsCell, {
          record: {
            id: 42,
            state: 'error',
            draining_since: draining ? new Date(now).toISOString() : null
          } as any,
          modelData: {
            restarting_since:
              elapsed === null ? null : new Date(now - elapsed).toISOString()
          } as any,
          onSelect() {}
        })
      );
      assert.equal(
        items.some((item) => item.key === 'delete'),
        expected
      );
    } finally {
      clock.mock.restore();
    }
  });
}

for (const draining of [false, true]) {
  test(`restart protection expires without incoming events${draining ? ' while draining stays protected' : ''}`, async (t) => {
    const now = Date.parse('2026-11-05T00:00:00Z');
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now });
    await mountActions(
      t,
      new Date(now - RESTART_LAPSE_MS + 1000).toISOString(),
      draining
    );
    assert.equal(
      items.some((item) => item.key === 'delete'),
      false
    );
    await act(async () => t.mock.timers.tick(999));
    assert.equal(
      items.some((item) => item.key === 'delete'),
      false
    );
    await act(async () => t.mock.timers.tick(1));
    assert.equal(
      items.some((item) => item.key === 'delete'),
      !draining
    );
  });
}

test('a new restart timestamp replaces the pending protection deadline', async (t) => {
  const now = Date.parse('2026-11-05T00:00:00Z');
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now });
  const view = await mountActions(
    t,
    new Date(now - RESTART_LAPSE_MS + 1000).toISOString()
  );
  await act(async () => t.mock.timers.tick(500));
  await view.render(new Date(Date.now()).toISOString());
  await act(async () => t.mock.timers.tick(500));
  assert.equal(
    items.some((item) => item.key === 'delete'),
    false
  );
  await act(async () => t.mock.timers.tick(RESTART_LAPSE_MS - 501));
  assert.equal(
    items.some((item) => item.key === 'delete'),
    false
  );
  await act(async () => t.mock.timers.tick(1));
  assert.equal(
    items.some((item) => item.key === 'delete'),
    true
  );
});

test('clearing restart protection and unmounting release their pending timers', async (t) => {
  const now = Date.parse('2026-11-05T00:00:00Z');
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now });
  const clear = t.mock.method(globalThis, 'clearTimeout');
  const view = await mountActions(t, new Date(now).toISOString());
  await view.render(null);
  assert.equal(
    items.some((item) => item.key === 'delete'),
    true
  );
  assert.equal(clear.mock.callCount(), 1);
  await view.render(new Date(now).toISOString());
  await view.dispose();
  assert.equal(clear.mock.callCount(), 2);
});
