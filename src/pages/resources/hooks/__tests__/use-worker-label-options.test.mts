import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

let requestConfig: any;
let detailData: any = {};
const requestOptions = { token: {} };
const fetchData = mock.fn(async (query: any) => {
  detailData = await requestConfig.fetchDetail(query, requestOptions);
});
mock.module('@gpustack/core-ui', {
  namedExports: {
    useQueryData: (config: any) => {
      requestConfig = config;
      return { detailData, loading: false, fetchData };
    }
  }
});
mock.module('ahooks', { namedExports: { useMemoizedFn: (fn: any) => fn } });
let respond = async () => ({
  items: [
    { labels: { arch: 'amd64' } },
    { labels: { arch: 'amd64', region: 'beijing' } }
  ]
});
const queryWorkersList = mock.fn(async (_query: any, _options: any) =>
  respond()
);
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: { queryWorkersList }
});
const useWorkerLabelOptions = (await import('../use-worker-label-options.ts'))
  .default;

test('queries all workers in the requested scope without name or label filters', async () => {
  queryWorkersList.mock.resetCalls();
  const hook = useWorkerLabelOptions(7);
  await hook.fetchLabelOptions(7);
  assert.deepEqual(queryWorkersList.mock.calls[0].arguments, [
    { page: -1, cluster_id: 7 },
    requestOptions
  ]);
  assert.deepEqual(useWorkerLabelOptions(7).labelOptions, [
    { value: 'arch=amd64', label: 'arch: amd64' },
    { value: 'region=beijing', label: 'region: beijing' }
  ]);
  await hook.fetchLabelOptions(undefined);
  assert.deepEqual(queryWorkersList.mock.calls[1].arguments[0], { page: -1 });
});

test('cached candidates from another cluster stay hidden until the matching scope is loaded', async () => {
  const options = [
    { value: 'region=old-cluster', label: 'region: old-cluster' }
  ];
  detailData = { clusterId: 7, options };
  assert.deepEqual(useWorkerLabelOptions(8).labelOptions, []);
  assert.deepEqual(useWorkerLabelOptions(7).labelOptions, options);
  detailData = { clusterId: 8, options: [] };
  assert.deepEqual(useWorkerLabelOptions(8).labelOptions, []);
});

test('candidate refresh failures do not reject the page action and can be retried', async () => {
  const hook = useWorkerLabelOptions();
  respond = async () => {
    throw new Error('request failed');
  };
  await assert.doesNotReject(hook.fetchLabelOptions(undefined));
  respond = async () => ({ items: [{ labels: { arch: 'arm64' } }] });
  await hook.fetchLabelOptions(undefined);
  assert.deepEqual(useWorkerLabelOptions().labelOptions, [
    { value: 'arch=arm64', label: 'arch: arm64' }
  ]);
});
