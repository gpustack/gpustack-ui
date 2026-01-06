import { resourceOverviewAtom } from '@/atoms/models';
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
    resourceAtom,
    resourceCount,
    fetchResource,
    fetchWorkerList,
    fetchClusterList
  };
}
