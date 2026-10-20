import { queryWorkersList } from '@/pages/resources/apis';
import { queryClusterItem, updateCluster } from '../../apis';
import { ClusterListItem, ClusterTopology } from '../../config/types';

export interface SpecContext {
  cluster: ClusterListItem;
  /** Per worker, labels over discovered facts, for "N workers carry this key". */
  workerLabels: Record<string, string>[];
}

/**
 * What editing the mapping needs besides the view: the saved topology says
 * which builtin entries are customised, and the PUT needs the whole cluster
 * anyway. A failed worker list leaves preset suggestions available, so it is
 * swallowed while worker-key suggestions and usage counts are unavailable.
 */
export const loadSpecContext = async (
  clusterId: number
): Promise<SpecContext> => {
  const [cluster, workers] = await Promise.all([
    queryClusterItem({ id: clusterId }),
    queryWorkersList({ page: -1, cluster_id: clusterId } as any, {
      skipErrorHandler: true
    }).catch(() => ({ items: [] }))
  ]);
  return {
    cluster,
    workerLabels: (workers?.items || []).map((worker: any) => ({
      ...(worker.status?.topology_facts || {}),
      ...(worker.labels || {})
    }))
  };
};

/**
 * The whole cluster, not a patch: the endpoint is a PUT and takes the full
 * resource, so sending only `topology` would blank every other field.
 */
export const saveTopologySpec = (
  cluster: ClusterListItem,
  topology: ClusterTopology
) =>
  updateCluster({
    id: cluster.id,
    data: { ...(cluster as any), topology } as any
  });
