import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const allocations = ['25%', '1g.10gb', 'Full GPU', 'Mixed', null, undefined];
const request = mock.fn(
  async (
    _url: string,
    options: { data: { include_gpu_allocation?: boolean } }
  ) => ({
    summary: {},
    pagination: {
      page: 1,
      perPage: 100,
      total: allocations.length,
      totalPage: 1
    },
    items: allocations.map((allocation, index) => ({
      id: index + 1,
      key: `gpu-${index + 1}`,
      date: '2026-11-23T00:00:00Z',
      metrics: { gpu_hours: 1 },
      ...(options.data.include_gpu_allocation && allocation !== undefined
        ? { gpu_allocation: allocation }
        : {})
    }))
  })
);

mock.module('@umijs/max', {
  namedExports: { request, getIntl: () => ({}) }
});

const {
  queryGpuInstancesBreakdown,
  queryStorageBreakdown,
  toResourceExportRequest
} = await import('../resource.ts');
const { resourcePreviewValue } =
  await import('../../utils/export-preview-values.tsx');

const breakdownRequest = {
  start_date: '2026-11-23',
  end_date: '2026-11-23',
  group_by: ['date', 'instance']
};

test('GPU instance export preview requests and shows the allocation', async () => {
  const response = await queryGpuInstancesBreakdown(breakdownRequest, {
    includeGpuAllocation: true
  });

  assert.equal(
    request.mock.calls.at(-1)?.arguments[1].data.include_gpu_allocation,
    true
  );

  assert.deepEqual(
    response.items.map((item) => resourcePreviewValue(item, 'gpu_allocation')),
    allocations
  );
});

test('other resource breakdowns and export payloads leave allocation to the server', async () => {
  await queryGpuInstancesBreakdown(breakdownRequest);
  assert.equal(
    Object.hasOwn(
      request.mock.calls.at(-1)!.arguments[1].data,
      'include_gpu_allocation'
    ),
    false
  );
  await queryStorageBreakdown({
    ...breakdownRequest,
    group_by: ['date', 'volume']
  });
  assert.equal(
    Object.hasOwn(
      request.mock.calls.at(-1)!.arguments[1].data,
      'include_gpu_allocation'
    ),
    false
  );
  assert.equal(
    Object.hasOwn(
      toResourceExportRequest(breakdownRequest),
      'include_gpu_allocation'
    ),
    false
  );
});
