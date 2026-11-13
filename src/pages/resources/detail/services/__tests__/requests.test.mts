import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
const calls: { path: string; options: any }[] = [];
let response: any = {};
mock.module('@umijs/max', {
  namedExports: {
    request: async (path: string, options: any) => {
      calls.push({ path, options });
      return response;
    }
  }
});
mock.module(
  new URL('../../../../../config/settings.ts', import.meta.url).href,
  { namedExports: { GPUSTACK_API_BASE_URL: 'v2' } }
);
const { queryHardwareMetrics, queryResourceDetail, resourceGrafanaHref } =
  await import('../requests');
test('GPU inventory path is escaped and cancellation is forwarded', async () => {
  const signal = new AbortController().signal;
  await queryResourceDetail({ kind: 'gpu', id: 'worker/name:0' }, signal);
  assert.equal(calls.at(-1)?.path, '/gpu-devices/worker%2Fname%3A0/detail');
  assert.equal(calls.at(-1)?.options.signal, signal);
});
test('opaque GPU selection uses the directly authorized Worker endpoint', async () => {
  response = {
    worker_id: 7,
    selected_device_id: 'stable',
    start: 1730000000,
    end: 1730003600,
    devices: [],
    metrics: {}
  };
  const target = { kind: 'gpu' as const, id: '7', deviceId: 'stable' };
  const scope = { window: '1h', start: 1730000000, end: 1730003600 };
  await queryHardwareMetrics(target, scope, new AbortController().signal);
  assert.equal(calls.at(-1)?.path, '/workers/7/metrics');
  assert.deepEqual(calls.at(-1)?.options.params, {
    device_id: 'stable',
    start: 1730000000,
    end: 1730003600
  });
  assert.match(
    resourceGrafanaHref(target, scope),
    /device_id=stable&start=1730000000&end=1730003600/
  );
});
test('an old backend cannot silently turn a fixed interval into a moving window', async () => {
  response = { start: 1730000001, end: 1730003601 };
  await assert.rejects(
    () =>
      queryHardwareMetrics(
        { kind: 'worker', id: '7' },
        { window: '1h', start: 1730000000, end: 1730003600 },
        new AbortController().signal
      ),
    /fixed monitoring range/
  );
});
