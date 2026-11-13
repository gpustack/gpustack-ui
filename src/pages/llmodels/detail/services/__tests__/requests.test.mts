import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
const request = mock.fn(async (): Promise<any> => ({}));
mock.module('@umijs/max', { namedExports: { request } });
const {
  queryRuntimeMetrics,
  queryResourceMetrics,
  queryMonitoringCapabilities
} = await import('../requests');
const scope: any = {
  window: '6h',
  instanceIds: [7, 11],
  role: 'decode',
  view: 'instances',
  deviceId: 'opaque/device'
};
test('runtime request always includes all four latency statistics for instance curves', async () => {
  const signal = new AbortController().signal;
  await queryRuntimeMetrics(5, scope, signal);
  assert.deepEqual(request.mock.calls.at(-1)?.arguments, [
    '/models/5/metrics',
    {
      method: 'GET',
      params: {
        window: '6h',
        instance_ids: '7,11',
        role: 'decode',
        view: 'instances',
        statistic: 'avg,p50,p95,p99',
        section: 'all'
      },
      signal,
      skipErrorHandler: true
    }
  ]);
});

test('fixed range metrics share exact start/end and do not send a relative window', async () => {
  const fixed = { ...scope, start: 1000, end: 4600 };
  const signal = new AbortController().signal;
  request.mock.mockImplementation(async () => ({ start: 1000, end: 4600 }));
  await queryRuntimeMetrics(5, fixed, signal);
  const runtime: any = request.mock.calls.at(-1)?.arguments[1];
  assert.equal(runtime.params.start, 1000);
  assert.equal(runtime.params.end, 4600);
  assert.equal('window' in runtime.params, false);
  await queryResourceMetrics(5, fixed, signal);
  const hardware: any = request.mock.calls.at(-1)?.arguments[1];
  assert.equal(hardware.params.start, 1000);
  assert.equal(hardware.params.end, 4600);
  assert.equal('window' in hardware.params, false);
  request.mock.mockImplementation(async () => ({}));
});

test('a backend that ignores a fixed interval cannot return moving data as custom-range results', async () => {
  request.mock.mockImplementation(async () => ({ start: 2000, end: 5600 }));
  const signal = new AbortController().signal;
  await assert.rejects(
    queryRuntimeMetrics(5, { ...scope, start: 1000, end: 4600 }, signal),
    /did not honor/
  );
  await assert.rejects(
    queryResourceMetrics(5, { ...scope, start: 1000, end: 4600 }, signal),
    /did not honor/
  );
  request.mock.mockImplementation(async () => ({}));
});

test('legacy capability 404 keeps relative ranges available but does not claim custom support or guessed retention', async () => {
  request.mock.mockImplementation(async () => {
    throw { response: { status: 404 } };
  });
  const response = await queryMonitoringCapabilities(
    5,
    new AbortController().signal
  );
  assert.equal(response.max_query_seconds, 604800);
  assert.equal(response.retention_seconds, null);
  assert.equal(response.supports_custom_range, false);
  request.mock.mockImplementation(async () => {
    throw { response: { status: 403 } };
  });
  await assert.rejects(
    queryMonitoringCapabilities(5, new AbortController().signal)
  );
  request.mock.mockImplementation(async () => ({}));
});
test('resource request returns all authorized devices and does not narrow history to the inspected device', async () => {
  const signal = new AbortController().signal;
  await queryResourceMetrics(5, scope, signal);
  assert.deepEqual(request.mock.calls.at(-1)?.arguments, [
    '/models/5/resource-metrics',
    {
      method: 'GET',
      params: {
        window: '6h',
        instance_ids: '7,11',
        role: 'decode',
        all_devices: true
      },
      signal,
      skipErrorHandler: true
    }
  ]);
});
