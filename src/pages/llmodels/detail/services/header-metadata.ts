import { request } from '@umijs/max';
import { TargetStatusValueMap } from '../../../model-routes/config';
import type { RouteTarget } from '../../../model-routes/config/types';
import type { ListItem } from '../../config/types';

export interface HeaderMetadata {
  clusterName: string | null;
  target: Pick<
    RouteTarget,
    'model_id' | 'route_id' | 'route_name' | 'state'
  > | null;
}

export const queryHeaderMetadata = async (
  model: Pick<ListItem, 'id' | 'cluster_id'>,
  signal: AbortSignal
): Promise<HeaderMetadata> => {
  const [cluster, targets] = await Promise.allSettled([
    request<{ id: number; name: string }>(`/clusters/${model.cluster_id}`, {
      method: 'GET',
      signal,
      skipErrorHandler: true
    }),
    request<{ items: RouteTarget[] }>('/model-route-targets', {
      method: 'GET',
      params: { page: -1 },
      signal,
      skipErrorHandler: true
    })
  ]);
  const clusterName =
    cluster.status === 'fulfilled' &&
    cluster.value?.id === model.cluster_id &&
    typeof cluster.value.name === 'string'
      ? cluster.value.name || null
      : null;
  const target =
    targets.status === 'fulfilled' && Array.isArray(targets.value?.items)
      ? targets.value.items.find(
          (item) =>
            item.model_id === model.id &&
            item.state === TargetStatusValueMap.Active &&
            Number.isSafeInteger(item.route_id) &&
            typeof item.route_name === 'string' &&
            !!item.route_name.trim()
        ) || null
      : null;
  return { clusterName, target };
};
