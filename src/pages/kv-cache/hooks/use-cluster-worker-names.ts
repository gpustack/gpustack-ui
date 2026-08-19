import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { useQueryWorkerList } from '@/pages/resources/services/use-query-worker-list';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';

// fleet-wide id -> name/ip lookups for the list and detail pages,
// derived from the shared query hooks — they own request cancellation,
// so superseded and unmount-time fetches are aborted instead of
// writing state late
const useClusterWorkerNames = () => {
  const { clusterList, fetchClusterList } = useQueryClusterList();
  const { dataList: workerList, fetchData: fetchWorkerList } =
    useQueryWorkerList();

  useEffect(() => {
    fetchClusterList({ page: -1 }).catch(() => {});
    fetchWorkerList({ page: -1 }).catch(() => {});
  }, []);

  const clusterNameMap = useMemo(
    () => _.fromPairs(clusterList.map((item) => [item.id, item.name])),
    [clusterList]
  );
  const workerNameMap = useMemo(
    () => _.fromPairs(workerList.map((item) => [item.id, item.name])),
    [workerList]
  );
  const workerIpMap = useMemo(
    () =>
      _.fromPairs(
        workerList.filter((item) => item.ip).map((item) => [item.id, item.ip])
      ),
    [workerList]
  );

  return {
    clusterNameMap,
    workerNameMap,
    workerIpMap,
    // the shared hook's rows already carry {label, value}
    clusterOptions: clusterList
  };
};

export default useClusterWorkerNames;
