import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const allocations = ['25%', '1g.10gb', 'Full GPU', 'Mixed', null, undefined];
const request = mock.fn(async () => ({
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
    ...(allocation === undefined ? {} : { gpu_allocation: allocation })
  }))
}));

mock.module('@umijs/max', {
  namedExports: { request, getIntl: () => ({}) }
});

const { queryGpuInstancesBreakdown } = await import('../resource.ts');
const { resourcePreviewValue } =
  await import('../../utils/export-preview-values.tsx');

test('GPU instance export preview shows the allocation from the breakdown', async () => {
  const response = await queryGpuInstancesBreakdown({
    start_date: '2026-11-23',
    end_date: '2026-11-23',
    group_by: ['date', 'instance']
  });

  assert.deepEqual(
    response.items.map((item) => resourcePreviewValue(item, 'gpu_allocation')),
    allocations
  );
});
