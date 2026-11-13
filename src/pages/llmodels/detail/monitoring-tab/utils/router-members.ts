import type { ModelInstanceListItem } from '../../../config/types';
import type { ModelMetric } from '../../config/types';

export const routerMemberRows = (
  metric: ModelMetric | undefined,
  instances: Pick<ModelInstanceListItem, 'id' | 'name' | 'role'>[],
  unresolved: string
) =>
  (metric?.summaries || []).map((summary, index) => {
    const dimensions = summary.dimensions;
    const upstreamId = dimensions.upstream_instance_id;
    const member = instances.find((instance) => instance.id === upstreamId);
    const observer = instances.find(
      (instance) => instance.id === dimensions.model_instance_id
    );
    return {
      id: `${dimensions.model_instance_id ?? 'unknown'}:${upstreamId ?? 'unknown'}:${index}`,
      instance:
        member?.name || (upstreamId != null ? `#${upstreamId}` : unresolved),
      role: member ? member.role || 'inference' : null,
      observer:
        dimensions.model_instance_name ||
        observer?.name ||
        (dimensions.model_instance_id != null
          ? `#${dimensions.model_instance_id}`
          : '—'),
      value: summary.value
    };
  });
