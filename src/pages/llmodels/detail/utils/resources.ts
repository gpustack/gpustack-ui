import type { ModelInstanceListItem } from '../../config/types';
import type { ResourceDevice } from '../config/types';
import { finite } from './metrics';

export const gpuDeviceLabel = (
  device: Pick<ResourceDevice, 'index' | 'chip_index'>,
  chipLabel = 'Chip'
) =>
  `GPU ${device.index}${device.chip_index != null && device.chip_index > 0 ? ` · ${chipLabel} ${device.chip_index}` : ''}`;

export const sortResourceDevices = (
  devices: ResourceDevice[],
  order: 'ascend' | 'descend' | null
) =>
  !order
    ? devices
    : [...devices].sort((a, b) => {
        const first = finite(a.current?.gpu_utilization);
        const second = finite(b.current?.gpu_utilization);
        if (first == null) return second == null ? 0 : 1;
        if (second == null) return -1;
        return order === 'ascend' ? first - second : second - first;
      });

type InstanceGPUAllocation = Pick<ModelInstanceListItem, 'id' | 'role'> & {
  gpu_indexes?: number[] | null;
  distributed_servers?: ModelInstanceListItem['distributed_servers'] | null;
  computed_resource_claim?: Partial<
    NonNullable<ModelInstanceListItem['computed_resource_claim']>
  > | null;
};

export const instanceGPUState = (
  instance: InstanceGPUAllocation,
  devices: ResourceDevice[]
) => {
  if (devices.some((device) => device.model_instance_ids.includes(instance.id)))
    return 'visible';
  const vram = instance.computed_resource_claim?.vram;
  const knownVRAM =
    vram != null && typeof vram === 'object' && !Array.isArray(vram);
  if (knownVRAM && Object.keys(vram).length) return 'unavailable';
  const distributed = instance.distributed_servers;
  if (distributed) {
    // Only allocation-bearing schema fields count. Coordination/download
    // metadata does not mean the instance owns a distributed GPU worker.
    const workers = distributed.subordinate_workers;
    const workloads = distributed.workloads;
    if (
      (workers !== null && !Array.isArray(workers)) ||
      workers?.length ||
      (workloads != null && !Array.isArray(workloads)) ||
      workloads?.some(
        (workload) =>
          !Array.isArray(workload?.dp_rank_placements) ||
          workload.dp_rank_placements.length > 0
      )
    )
      return 'unavailable';
  }
  const explicitlyEmpty =
    Array.isArray(instance.gpu_indexes) && !instance.gpu_indexes.length;
  const cpuOnlyRouter =
    instance.role === 'router' &&
    instance.gpu_indexes === null &&
    knownVRAM &&
    !Object.keys(vram).length;
  return explicitlyEmpty || cpuOnlyRouter ? 'unallocated' : 'unavailable';
};
