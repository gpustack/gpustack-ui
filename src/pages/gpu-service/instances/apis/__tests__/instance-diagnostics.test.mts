import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

let response: unknown;
let failure: Error | undefined;
const request = mock.fn(async (_url: string, _options: any) => {
  if (failure) throw failure;
  return response;
});
mock.module('@umijs/max', { namedExports: { request } });
const {
  queryGPUServiceInstances,
  queryGPUServiceInstanceEvents,
  queryGPUServiceInstancePVEvents
} = await import('../index.ts');

test('the instance response preserves the Failed phase and full failure detail', async () => {
  const status = {
    phase: 'Failed',
    namespace: 'tenant-a',
    phaseMessage:
      'UnexpectedAdmissionError: Pod was rejected: no healthy devices present'
  };
  response = { items: [{ id: 12, name: 'jupyter-test', status }] };
  const result: any = await queryGPUServiceInstances({});
  assert.equal(result.items[0].status, status);
});

for (const [resource, query] of [
  ['instances', queryGPUServiceInstanceEvents],
  ['instancepersistentvolumes', queryGPUServiceInstancePVEvents]
] as const) {
  test(`${resource} events preserve all returned records, reasons, and messages`, async () => {
    request.mock.resetCalls();
    const items = Array.from({ length: 125 }, (_, i) => ({
      metadata: { name: `event-${i}`, namespace: 'tenant-a' },
      type: i % 2 ? 'Normal' : 'Warning',
      reason: 'UnexpectedAdmissionError',
      message: `Pod was rejected: no healthy devices present (${i})`,
      lastTimestamp: '2025-01-01T00:00:00Z'
    }));
    response = { items };
    const token = {};
    const result = await query(
      { clusterID: 7, namespace: 'tenant-a', name: 'jupyter-test' },
      { token }
    );
    assert.equal(result, response);
    assert.deepEqual(result?.items, items);
    assert.deepEqual(request.mock.calls[0].arguments, [
      `/clusters/7/proxy/apis/worker.gpustack.ai/v1/namespaces/tenant-a/${resource}/jupyter-test/events`,
      { method: 'GET', params: {}, cancelToken: token }
    ]);
  });

  test(`${resource} event errors are not returned as an empty successful list`, async () => {
    failure = new Error('events unavailable');
    try {
      await assert.rejects(
        query({ clusterID: 7, namespace: 'tenant-a', name: 'jupyter-test' }),
        failure
      );
    } finally {
      failure = undefined;
    }
  });
}
