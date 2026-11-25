import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultCollapsedSpanIds,
  formatTraceId,
  formatTraceTokens,
  spanTimelineDuration,
  spanTimelineLabel,
  spanTimelineRows,
  traceDurationLabel,
  traceRecordKey,
  visibleSpanTimelineRows
} from '../presentation';
import type { TraceSpan } from '../requests';

test('Trace IDs display without leading zeroes', () => {
  assert.equal(
    formatTraceId('0000000000000000548c943a36f8d9ec'),
    '548c943a36f8d9ec'
  );
  assert.equal(
    formatTraceId('00000000000000000548c943a36f8d9e'),
    '548c943a36f8d9e'
  );
  assert.equal(
    formatTraceId('0000000000000001548c943a36f8d9ec'),
    '1548c943a36f8d9ec'
  );
});

test('entry IDs distinguish requests with the same trace and start time', () => {
  const row = { trace_id: 'trace', request_id: null, started_at_ms: 100 };
  assert.equal(traceRecordKey(row), 'trace:100');
  assert.equal(
    traceRecordKey({ ...row, entry_span_id: 'first' }),
    'trace:first'
  );
  assert.equal(
    traceRecordKey({ ...row, entry_span_id: 'second' }),
    'trace:second'
  );
});

test('duration labels identify the component that observed the request', () => {
  const t = (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${values.phase}` : key;
  assert.equal(traceDurationLabel({}, t), 'duration');
  assert.equal(
    traceDurationLabel({ observation_source: 'router' }, t),
    'routerDuration'
  );
  assert.equal(
    traceDurationLabel({ observation_source: 'engine' }, t),
    'engineDuration'
  );
  assert.equal(
    traceDurationLabel(
      { observation_source: 'engine', engine_phase: 'decode' },
      t
    ),
    'enginePhaseDuration:Decode'
  );
});

test('token counts keep input and output from the same observation', () => {
  assert.equal(
    formatTraceTokens({ input_tokens: 21, output_tokens: 0 }),
    '21 / 0'
  );
  assert.equal(
    formatTraceTokens({ input_tokens: 21, output_tokens: 2 }),
    '21 / 2'
  );
  assert.equal(formatTraceTokens({ output_tokens: 2 }), '— / 2');
  assert.equal(formatTraceTokens(null), '—');
});

test('overlapping Prefill and Decode spans stay grouped under the recorded parents', () => {
  const spans = [
    { id: 'gateway', parent_id: null },
    { id: 'upstream', parent_id: 'gateway' },
    { id: 'worker', parent_id: 'upstream' },
    { id: 'router', parent_id: 'worker' },
    { id: 'prefill-call', parent_id: 'router' },
    { id: 'decode-call', parent_id: 'router' },
    { id: 'prefill-engine', parent_id: 'prefill-call' },
    { id: 'decode-engine', parent_id: 'decode-call' },
    { id: 'orphan', parent_id: 'not-retained' }
  ];

  assert.deepEqual(
    spanTimelineRows(spans).map(({ span, depth }) => [span.id, depth]),
    [
      ['gateway', 0],
      ['upstream', 1],
      ['worker', 2],
      ['router', 3],
      ['prefill-call', 4],
      ['prefill-engine', 5],
      ['decode-call', 4],
      ['decode-engine', 5],
      ['orphan', 0]
    ]
  );
});

const pdSpan = (
  id: string,
  parent_id: string | null,
  role: TraceSpan['role'],
  service: string,
  phase?: TraceSpan['phase']
) => ({ id, parent_id, role, service, phase });

test('vLLM PD defaults to the router dispatch branches wherever the fork occurs', () => {
  const rows = spanTimelineRows([
    pdSpan('gateway', null, 'gateway', 'gpustack.higress'),
    pdSpan('worker', 'gateway', 'proxy', 'gpustack.worker'),
    pdSpan('router', 'worker', 'other', 'custom-router'),
    pdSpan('dispatch-p', 'router', 'other', 'custom-router', 'prefill'),
    pdSpan('engine-p', 'dispatch-p', 'engine', 'custom-engine-p', 'prefill'),
    pdSpan('dispatch-d', 'router', 'other', 'custom-router', 'decode'),
    pdSpan('engine-d', 'dispatch-d', 'engine', 'custom-engine-d', 'decode')
  ]);
  const collapsed = defaultCollapsedSpanIds(rows);
  assert.deepEqual([...collapsed], ['dispatch-p', 'dispatch-d']);
  assert.deepEqual(
    visibleSpanTimelineRows(rows, collapsed).map(({ span }) => span.id),
    ['gateway', 'worker', 'router', 'dispatch-p', 'dispatch-d']
  );
  collapsed.delete('dispatch-p');
  assert.deepEqual(
    visibleSpanTimelineRows(rows, collapsed).map(({ span }) => span.id),
    ['gateway', 'worker', 'router', 'dispatch-p', 'engine-p', 'dispatch-d']
  );
});

test('SGLang PD defaults to the engine branches and keeps children expandable', () => {
  const rows = spanTimelineRows([
    pdSpan('worker', null, 'proxy', 'gpustack.worker'),
    pdSpan('engine-p', 'worker', 'engine', 'sglang.prefill'),
    pdSpan('tokenizer', 'engine-p', 'other', 'sglang.prefill'),
    pdSpan('engine-d', 'worker', 'engine', 'sglang.decode'),
    pdSpan('scheduler', 'engine-d', 'other', 'sglang.decode')
  ]);
  const collapsed = defaultCollapsedSpanIds(rows);
  assert.deepEqual([...collapsed], ['engine-p', 'engine-d']);
  assert.deepEqual(
    visibleSpanTimelineRows(rows, collapsed).map(({ span, hasChildren }) => [
      span.id,
      hasChildren
    ]),
    [
      ['worker', true],
      ['engine-p', true],
      ['engine-d', true]
    ]
  );
});

test('missing or unrelated PD branches leave all retained spans visible', () => {
  const partial = [
    pdSpan('worker', null, 'proxy', 'gpustack.worker'),
    pdSpan('prefill', 'worker', 'engine', 'sglang.prefill'),
    pdSpan('scheduler', 'prefill', 'other', 'sglang.prefill')
  ];
  for (const spans of [
    partial,
    [...partial, pdSpan('decode', 'unretained', 'engine', 'sglang.decode')]
  ]) {
    const rows = spanTimelineRows(spans);
    const collapsed = defaultCollapsedSpanIds(rows);
    assert.equal(collapsed.size, 0);
    assert.equal(visibleSpanTimelineRows(rows, collapsed).length, spans.length);
  }
});

test('waterfall labels show original names for both engines and arbitrary stages', () => {
  const timing = { start_offset_ms: 12, duration_ms: 159 };
  for (const [name, service] of [
    ['llm_request', 'vllm.decode'],
    ['prefill_forward', 'sglang.prefill'],
    ['new_stage', 'custom-engine'],
    ['POST /v1/chat/completions', 'vllm-router']
  ]) {
    assert.deepEqual(spanTimelineLabel({ ...timing, name, service }), {
      title: name,
      subtitle: `${service} · +12 ms · 159 ms`
    });
  }
});

test('waterfall labels preserve the recorded service and show zero start offsets', () => {
  assert.deepEqual(
    spanTimelineLabel({
      name: 'llm_request',
      service: 'vllm',
      reported_service: 'unknown_service',
      start_offset_ms: 0,
      duration_ms: 1
    }),
    { title: 'llm_request', subtitle: 'unknown_service · +0 ms · 1 ms' }
  );
});

test('the static timeline covers the latest recorded end, including spans that outlive their parent', () => {
  const parent = { start_offset_ms: 0, duration_ms: 200 };
  const child = { start_offset_ms: 20, duration_ms: 220 };
  assert.equal(spanTimelineDuration([child, parent]), 240);
  assert.equal(
    spanTimelineDuration([{ start_offset_ms: 0, duration_ms: 0 }]),
    1
  );
});
