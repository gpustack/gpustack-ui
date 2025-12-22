import {
  clusterListAtom,
  resourceOverviewAtom,
  workerListAtom
} from '@/atoms/models';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { queryWorkersList } from '@/pages/resources/apis';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { queryDashboardData } from '../../dashboard/apis';

/**
 * Currently fetch the cluster list and worker list for checking resource existence.
 * If there is no cluster or no worker, introduct the use to create/add them.
 * @returns
 */
export default function useClusterList() {
  const [clusterList, setClusterList] = useState<
    {
      label: string;
      value: number;
      id: number;
      state: string;
      provider: string;
    }[]
  >([]);
  const [workerList, setWorkerList] = useState<
    {
      cluster_id: number;
      state: string;
      label: string;
      value: number;
      id: number;
      labels: { [key: string]: string };
      name: string;
    }[]
  >([]);
  const [clustersAtom, setClusterListAtom] = useAtom(clusterListAtom);
  const [workersAtom, setWorkerListAtom] = useAtom(workerListAtom);
  const [resourceAtom, setResourceOverview] = useAtom(resourceOverviewAtom);
  const [resourceCount, setResourceCount] = useState<Record<string, any>>({
    cluster_count: 0,
    worker_count: 0
  });

  const fetchClusterList = async () => {
    try {
      const res = await queryClusterList({ page: -1 });
      const list = res?.items?.map((item: any) => ({
        label: item.name,
        value: item.id,
        id: item.id,
        state: item.state,
        provider: item.provider
      }));
      return list;
    } catch (error) {
      return [];
    }
  };

  const fetchWorkerList = async () => {
    try {
      const res = await queryWorkersList({ page: -1 });
      const list = res?.items?.map((item: any) => ({
        cluster_id: item.cluster_id,
        state: item.state,
        label: item.name,
        value: item.id,
        id: item.id,
        labels: item.labels || {},
        name: item.name
      }));
      return list;
    } catch (error) {
      return [];
    }
  };

  const fetchData = async () => {
    const [clusters, workers] = await Promise.all([
      fetchClusterList(),
      fetchWorkerList()
    ]);
    setClusterList(clusters);
    setWorkerList(workers);
    setClusterListAtom(clusters);
    setWorkerListAtom(workers);
    return {
      hasClusters: clusters.length > 0,
      hasWorkers: workers.length > 0
    };
  };

  const fetchResource = async () => {
    try {
      const res = await queryDashboardData();
      setResourceOverview(res.resource_counts);
      setResourceCount(res.resource_counts);
      return {
        hasClusters: res.resource_counts?.cluster_count > 0,
        hasWorkers: res.resource_counts?.worker_count > 0
      };
    } catch (error) {
      setResourceOverview({});
      setResourceCount({});
      return {
        hasClusters: false,
        hasWorkers: false
      };
    }
  };

  return {
    clusterList,
    workerList,
    clustersAtom,
    workersAtom,
    resourceAtom,
    resourceCount,
    fetchResource,
    fetchWorkerList,
    fetchClusterList
  };
}
