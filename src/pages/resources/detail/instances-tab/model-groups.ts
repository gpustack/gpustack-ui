import type { ResourceAssociation } from '../config/types';

export interface ResourceModelGroup {
  modelId: number;
  name: string;
  instances: ResourceAssociation[];
}
export type ResourceModelRow =
  | { kind: 'model'; id: string; group: ResourceModelGroup }
  | { kind: 'instance'; id: string; instance: ResourceAssociation };

export const groupResourceModels = (
  instances: ResourceAssociation[],
  search: string
): ResourceModelGroup[] => {
  const query = search.trim().toLocaleLowerCase();
  const groups = new Map<number, ResourceModelGroup>();
  for (const instance of instances) {
    if (
      query &&
      !`${instance.model_name} ${instance.name}`
        .toLocaleLowerCase()
        .includes(query)
    )
      continue;
    let group = groups.get(instance.model_id);
    if (!group) {
      group = {
        modelId: instance.model_id,
        name: instance.model_name,
        instances: []
      };
      groups.set(instance.model_id, group);
    }
    group.instances.push(instance);
  }
  return [...groups.values()].sort(
    (a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }) ||
      a.modelId - b.modelId
  );
};

export const resourceModelRows = (
  groups: ResourceModelGroup[],
  collapsed: number[]
): ResourceModelRow[] =>
  groups.flatMap((group) => [
    { kind: 'model' as const, id: `model:${group.modelId}`, group },
    ...(collapsed.includes(group.modelId)
      ? []
      : group.instances.map((instance) => ({
          kind: 'instance' as const,
          id: `instance:${instance.id}`,
          instance
        })))
  ]);
