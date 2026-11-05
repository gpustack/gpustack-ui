import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
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
