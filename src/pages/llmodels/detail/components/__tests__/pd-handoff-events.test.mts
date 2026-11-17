import messages from '@/locales/en-US/model-monitoring';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ModelMetric } from '../../config/types';

const strings = (messages as any).default || messages;
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: ({ id }: any) => strings[id] || id
    })
  }
});
mock.module(new URL('../help-tooltip.tsx', import.meta.url).href, {
  defaultExport: ({ label, content }: any) =>
    createElement('button', { 'aria-label': label, title: content }, '?')
});
mock.module(new URL('../metric-state.tsx', import.meta.url).href, {
  namedExports: {
    MetricNotice: ({ metric }: any) =>
      metric.status === 'query_error'
        ? createElement('span', {}, 'Query failed')
        : null,
    MetricState: () => createElement('span', {}, 'No observations')
  }
});
const { default: PDHandoffEvents } = await import('../pd-handoff-events');
const metric = (counts: (number | null)[]): ModelMetric => ({
  kind: 'counter',
  unit: 'events_per_second',
  measurement_scope: 'connector_transfer_failures',
  status: 'available',
  reason: null,
  supported_statistics: ['rate'],
  series: [],
  summaries: counts.map((sample_count, i) => ({
    statistic: 'rate',
    value: sample_count == null ? null : sample_count / 3600,
    sample_count,
    dimensions: {
      role: i ? 'prefill' : 'decode',
      model_instance_name: `instance-${i}`
    }
  }))
});
test('event counts retain independent role/instance populations, real zero and fractional estimates', () => {
  const html = renderToStaticMarkup(
    createElement(PDHandoffEvents, {
      metrics: {
        pd_kv_transfer_failures: metric([2, 0.004]),
        pd_kv_expired: metric([0])
      }
    })
  );
  for (const text of [
    '2 events',
    '0.004 events',
    '0 events',
    'Decode',
    'Prefill',
    'instance-0',
    'instance-1'
  ])
    assert.ok(html.includes(text), text);
  assert.ok(!html.includes('2.004 events'), 'different roles are never summed');
  assert.ok(
    html.includes('ant-typography-warning'),
    'nonzero events are highlighted'
  );
});
test('unsupported events are omitted while missing counts and failed queries never become zero', () => {
  const absent = {
    ...metric([]),
    status: 'unsupported' as const,
    reason: 'metric_not_provided'
  };
  const html = renderToStaticMarkup(
    createElement(PDHandoffEvents, {
      metrics: {
        pd_kv_expired: absent,
        pd_kv_transfer_failures: {
          ...metric([]),
          status: 'query_error',
          reason: 'query_failed'
        },
        pd_kv_bootstrap_failures: metric([null])
      }
    })
  );
  assert.ok(!html.includes('data-pd-event="pd_kv_expired"'));
  assert.ok(html.includes('Query failed') && html.includes('No observations'));
  assert.ok(!html.includes('0 events'));
  assert.ok(html.includes('—'));
});
