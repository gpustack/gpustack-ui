import _ from 'lodash';
import { isSliceableDetail } from '../config';
import { InstanceTypeItem, InstanceTypeSnapshotSpec } from '../config/types';

// Build the flat snapshot spec from a live (API-shaped) instance type:
// definition fields from spec, observed hardware from status.detail, plus the
// derived `sliceable`. This flat shape is the UI document format persisted in
// the instance's `description` (older instances already carry it flat) and
// doubles as the display model of the type card / metadata section.
export const buildInstanceTypeSnapshotSpec = (
  instanceType: InstanceTypeItem
): InstanceTypeSnapshotSpec => {
  const detail = instanceType.status?.detail;
  return {
    ...instanceType.spec,
    ..._.pick(detail, ['manufacturer', 'product', 'family', 'memory']),
    sliceable: isSliceableDetail(detail?.slicedDetail),
    // Accelerator CPU identity only — the full CPU descriptor is too bulky to
    // persist and the UI only shows who made it.
    cpu: _.pick(detail?.cpu, ['manufacturer', 'product', 'family'])
  };
};

// NOTE: the pool's partition profiles are deliberately NOT persisted here.
//
// They would let the list rows show a partition's real VRAM (its reported
// `memoryMib`) instead of the rounded size in its name, but this whole object is
// serialized into `GPUInstance.description`, which is capped at 1024 chars — and
// a full A100 MIG pool's 11 profiles push the payload to ~1034, i.e. creating a
// partitioned instance would start failing outright on exactly the pools that
// need it. The channel is also already slated for removal (it is a user-writable
// free-text field, not a data channel), so growing it is the wrong direction.
//
// Consequence: the GPU Instances list shows a partition's VRAM parsed from its
// name, ~5% above the real figure. Usage / billing are unaffected — they read
// `memoryMib` server-side. The fix is to stop reading this blob at all (expose a
// resolved read-only field on GPUInstancePublic), not to add another key here.

// Serialize the chosen instance type into the instance's `description` field —
// a persisted spec snapshot the form reads back to render the type card and
// derive unit resources. Shared by the create flow (card selection) and the
// edit flow (change-type overlay).
export const saveInstanceDataInDescription = (
  instanceType: InstanceTypeItem
): string => {
  return JSON.stringify({
    name: instanceType.name,
    spec: buildInstanceTypeSnapshotSpec(instanceType)
  });
};
