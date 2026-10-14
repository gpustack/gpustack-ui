import type { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { profileRamGib } from '../config';
import type {
  CacheProviderComponent,
  CacheProviderItem,
  CacheServiceInstanceItem
} from '../config/types';
import {
  GiB,
  componentEnabled,
  matchesSelector,
  resolveFieldValue
} from '../forms/utils';

interface RecreationPlacement {
  provider: CacheProviderItem;
  fieldValues?: Record<string, any> | null;
  workers: WorkerListItem[];
  workerId?: number;
  workerSelector?: Record<string, string> | null;
  recreateInstance?: CacheServiceInstanceItem;
  existingInstances?: CacheServiceInstanceItem[];
}

export interface RecreationPlan {
  targets: WorkerListItem[];
  required: Map<number, number>;
  hasDeployments: boolean;
  unavailable?: boolean;
  insufficientWorkers?: { count: number; replicas: number };
}

// Match the controller's desired layout after the requested deletion,
// rather than finding arbitrary workers with enough RAM.
export const planRecreation = ({
  provider,
  fieldValues,
  workers,
  workerId,
  workerSelector,
  recreateInstance,
  existingInstances
}: RecreationPlacement): RecreationPlan => {
  const required = new Map<number, number>();
  const targets = new Map<number, WorkerListItem>();
  const plan: RecreationPlan = { targets: [], required, hasDeployments: false };
  const fields = provider.fields || [];
  const matched = workers
    .filter((worker) => matchesSelector(worker, workerSelector))
    .sort(
      (a, b) =>
        Number(b.id === workerId) - Number(a.id === workerId) || a.id - b.id
    );

  const replicasOf = (component?: CacheProviderComponent) => {
    const declared = component?.replicas ?? 1;
    const configured = component?.replicas_by
      ? Number(resolveFieldValue(component.replicas_by, fields, fieldValues))
      : undefined;
    return configured !== undefined &&
      Number.isFinite(configured) &&
      configured >= 1
      ? Math.trunc(configured)
      : declared;
  };

  const add = (
    selected: WorkerListItem[],
    profile: CacheProviderItem['resource_profile']
  ) => {
    plan.hasDeployments = true;
    const ramGib = profileRamGib(profile, fields, fieldValues);
    if (profile?.ram_gib && !ramGib) {
      const rendered = profile.ram_gib.replace(
        /\{\{\s*([\w.]+)\s*\}\}/g,
        (_, name) => `${resolveFieldValue(name, fields, fieldValues) ?? ''}`
      );
      // Zero is a known demand, unlike a missing or invalid field value.
      if (!rendered.trim() || Number(rendered) !== 0) {
        plan.unavailable = true;
      }
    }
    selected.forEach((worker) => {
      targets.set(worker.id, worker);
      required.set(worker.id, (required.get(worker.id) || 0) + ramGib * GiB);
    });
  };

  if (recreateInstance) {
    const componentName = recreateInstance.component || '';
    const component = recreateInstance.component
      ? provider.components?.[recreateInstance.component]
      : undefined;
    const multiComponent = Boolean(
      Object.keys(provider.components || {}).length
    );
    if ((componentName && !component) || (multiComponent && !componentName)) {
      // Removed roles have no desired instances left to recreate.
      return plan;
    }
    // Deleting a disabled role is cleanup; the controller will not deploy
    // a replacement, so neither the old worker nor its claim is needed.
    if (component && !componentEnabled(component, fields, fieldValues)) {
      return plan;
    }
    const topology =
      component?.topology ?? (multiComponent ? 'replicas' : provider.topology);
    if (topology !== 'per_node' && !existingInstances) {
      return { ...plan, hasDeployments: true, unavailable: true };
    }
    const matchingIds = new Set(matched.map((worker) => worker.id));
    const surviving = (existingInstances || [recreateInstance]).filter(
      (instance) =>
        instance.id !== recreateInstance.id &&
        !instance.deleted_at &&
        (instance.component || '') === componentName &&
        matchingIds.has(instance.worker_id)
    );
    const occupiedIds = new Set(
      surviving.map((instance) => instance.worker_id)
    );
    let desired = matched;
    if (topology !== 'per_node') {
      const pinned = workerId && matchingIds.has(workerId) ? [workerId] : [];
      if (workerId && !pinned.length && !multiComponent) {
        // This assignment parks reconciliation; deleting the old instance
        // would leave no replacement. Surface the invalid target first.
        return { ...plan, hasDeployments: true };
      }
      const rotation = [
        ...pinned,
        ...[...occupiedIds]
          .filter((id) => !pinned.includes(id))
          .sort((a, b) => a - b),
        ...[...matchingIds]
          .filter((id) => !pinned.includes(id) && !occupiedIds.has(id))
          .sort((a, b) => a - b)
      ].slice(0, replicasOf(component));
      desired = rotation.map(
        (id) => matched.find((worker) => worker.id === id)!
      );
    }
    const missing = desired.filter((worker) => !occupiedIds.has(worker.id));
    if (!missing.length) {
      return plan;
    }
    add(
      missing,
      component ? component.resource_profile : provider.resource_profile
    );
  } else if (Object.keys(provider.components || {}).length) {
    for (const component of Object.values(provider.components || {})) {
      if (!componentEnabled(component, fields, fieldValues)) {
        continue;
      }
      plan.hasDeployments = true;
      const replicas = replicasOf(component);
      if (component.topology !== 'per_node' && matched.length < replicas) {
        plan.insufficientWorkers = { count: matched.length, replicas };
        break;
      }
      add(
        component.topology === 'per_node'
          ? matched
          : matched.slice(0, replicas),
        component.resource_profile
      );
    }
  } else {
    if (
      provider.topology !== 'per_node' &&
      workerId &&
      !matched.some((worker) => worker.id === workerId)
    ) {
      // A single-component service's explicit assignment is not allowed
      // to fall back to an unrelated worker when its pin is invalid.
      plan.hasDeployments = true;
    } else {
      add(
        provider.topology === 'per_node' ? matched : matched.slice(0, 1),
        provider.resource_profile
      );
    }
  }
  plan.targets = Array.from(targets.values());
  return plan;
};

const nonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

// This is a reservation budget, not physical free RAM. Only the old
// instances whose claims are still included in this worker's allocated RAM
// can be reclaimed. Error instances keep their claims until deleted.
export const recreationAvailableRam = (
  worker: WorkerListItem,
  replacingInstances: CacheServiceInstanceItem[] | undefined
): number | undefined => {
  const memory = worker.status?.memory;
  if (
    !replacingInstances ||
    !nonnegative(memory?.total) ||
    !nonnegative(memory?.allocated)
  ) {
    return undefined;
  }
  const reservedRam = worker.system_reserved?.ram ?? 0;
  const reservedVram = worker.system_reserved?.vram ?? 0;
  if (!nonnegative(reservedRam) || !nonnegative(reservedVram)) {
    return undefined;
  }

  let reclaim = 0;
  const seen = new Map<number, number>();
  for (const instance of replacingInstances) {
    if (instance.worker_id !== worker.id || instance.deleted_at) {
      continue;
    }
    const ram = instance.computed_resource_claim?.ram;
    if (!nonnegative(ram)) {
      return undefined;
    }
    if (seen.has(instance.id)) {
      if (seen.get(instance.id) !== ram) {
        return undefined;
      }
      continue;
    }
    seen.set(instance.id, ram);
    reclaim += ram;
  }
  // Different request snapshots must not manufacture capacity by removing
  // a claim that the worker's allocation does not include yet.
  if (memory.allocated < reclaim) {
    return undefined;
  }

  let unifiedVram = 0;
  if (memory.is_unified_memory) {
    if (!Array.isArray(worker.status.gpu_devices)) {
      return undefined;
    }
    for (const gpu of worker.status.gpu_devices) {
      if (!nonnegative(gpu.memory?.allocated)) {
        return undefined;
      }
      unifiedVram += gpu.memory.allocated;
    }
    unifiedVram += reservedVram;
  }
  // Clamp after subtracting the other claims. Clamping the original free
  // budget before adding reclaim would overstate capacity under pressure.
  return Math.max(
    0,
    memory.total - reservedRam - (memory.allocated - reclaim) - unifiedVram
  );
};
