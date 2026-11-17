import type { ResourceDevice } from '@/pages/llmodels/detail/config/types';
import type { GPUDeviceItem } from '../../config/types';

export function deviceHardware(
  device: ResourceDevice | undefined,
  gpuDevices: GPUDeviceItem[] | undefined
) {
  if (!device || device.reason === 'device_identity_unresolved') return;
  // ResourceDevice.id is opaque and is absent from raw Worker GPU statuses.
  // Only a unique logical index can associate that status with this device.
  const matches = gpuDevices?.filter((gpu) => gpu.index === device.index);
  return matches?.length === 1 ? matches[0] : undefined;
}
