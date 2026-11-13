import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let context: any;
const passthrough = ({ children }: any) =>
  createElement(Fragment, null, children);
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module('antd', {
  namedExports: {
    Row: passthrough,
    Col: passthrough,
    Flex: passthrough,
    Tooltip: ({ children, title }: any) =>
      createElement(Fragment, null, children, title),
    Typography: { Text: passthrough }
  }
});
mock.module('antd-style', {
  namedExports: {
    createStyles: () => () => ({
      styles: { card: 'card', label: 'label', value: 'value', note: 'note' }
    })
  }
});
mock.module(new URL('../../config/context.ts', import.meta.url).href, {
  namedExports: { useDetail: () => context }
});
mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: { isPDModel: (model: any) => !!model.roles?.length }
});
const { default: PerformanceStats } = await import('../performance-stats');

const metric = (unit: string, values: number[], statistic = 'p95') => ({
  kind: 'histogram',
  unit,
  status: 'available',
  series: [],
  summaries: ['prefill', 'decode', 'router'].map((role, index) => ({
    statistic,
    dimensions: { role },
    value: values[index]
  }))
});
const prepare = (instanceIds: number[]) => {
  context = {
    model: {
      data: {
        roles: [{ name: 'prefill' }, { name: 'decode' }, { name: 'router' }]
      }
    },
    instances: {
      data: [
        { id: 1, role: 'prefill' },
        { id: 2, role: 'decode' },
        { id: 3, role: 'router' }
      ]
    },
    scope: {
      instanceIds,
      role: 'all',
      latencyMetric: 'tpot',
      view: 'instances'
    },
    runtime: {
      data: {
        metrics: {
          ttft: metric('seconds', [0.01, 0.02, 0.03]),
          tpot: metric('seconds', [0.04, 0.05, 0.06]),
          itl: metric('seconds', [0.07, 0.08, 0.09]),
          running_requests: metric('requests', [11, 22, 33], 'current'),
          waiting_requests: metric('requests', [1, 2, 3], 'current')
        }
      }
    }
  };
};
const cards = () =>
  [
    ...new JSDOM(
      renderToStaticMarkup(createElement(PerformanceStats))
    ).window.document.querySelectorAll('.card')
  ].map((card) => ({
    label: card.querySelector('.label')?.textContent,
    value: card.querySelector('.value')?.textContent
  }));
for (const [name, ids, role, ttft, running, waiting] of [
  ['Prefill instance', [1], 'Prefill', '10ms', '11', '1'],
  ['Router instance', [3], 'Router', '30ms', '33', '3'],
  ['mixed instance roles', [1, 2], 'Decode', '20ms', '22', '2'],
  ['whole deployment', [], 'Decode', '20ms', '22', '2']
] as const) {
  test(`performance summary follows ${name} for requests and keeps TPOT Decode-local`, () => {
    prepare([...ids]);
    const stats = cards();
    assert.equal(stats[0].label, `${role} · TTFT`);
    assert.equal(stats[0].value, ttft);
    assert.equal(stats[1].value, '50ms/token');
    assert.equal(stats[3].value, `${running}requests`);
    assert.equal(stats[4].value, `${waiting}requests`);
  });
}
test('selecting ITL while inspecting Prefill does not borrow Prefill ITL observations', () => {
  prepare([1]);
  context.scope.latencyMetric = 'itl';
  assert.equal(cards()[1].value, '80ms');
});

test('highest KV usage identifies its actual instance and DP while keeping legacy internal', () => {
  prepare([]);
  context.runtime.data.metrics.kv_usage = {
    unit: 'percent',
    summaries: [
      {
        value: 70,
        dimensions: {
          role: 'decode',
          model_instance_name: 'decode-a',
          source_name: 'legacy',
          endpoint_dp_rank: '1',
          dp_rank: '2'
        }
      }
    ]
  };
  const html = renderToStaticMarkup(createElement(PerformanceStats));
  assert.ok(html.includes('Decode · decode-a · Endpoint DP 1 · DP 2'));
  assert.ok(!html.includes('legacy'));
});

test('role-local latency help is only shown for a PD deployment', () => {
  prepare([]);
  assert.ok(
    renderToStaticMarkup(createElement(PerformanceStats)).includes(
      'modelMonitoring.localLatency'
    )
  );
  context.model.data.roles = [];
  assert.ok(
    !renderToStaticMarkup(createElement(PerformanceStats)).includes(
      'modelMonitoring.localLatency'
    )
  );
});
