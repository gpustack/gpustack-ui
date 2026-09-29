import _ from 'lodash';
import { isSliceableDetail } from '../config';
import {
  InstanceTypeDetail,
  InstanceTypeItem,
  InstanceTypeSnapshotSpec,
  InstanceTypeSpec
} from '../config/types';

// Minimal structural input of the snapshot builder: it reads only the type's
// name, definition spec and observed detail. InstanceTypeItem satisfies it, as
// does the server-resolved summary carried by GPUInstancePublic.
export interface InstanceTypeSnapshotSource {
  name: string;
  spec: InstanceTypeSpec;
  status?: { detail?: InstanceTypeDetail | null } | null;
}

// Build the flat snapshot spec from a live (API-shaped) instance type:
// definition fields from spec, observed hardware from status.detail, plus the
// derived `sliceable`. This flat shape is the UI document format persisted in
// the instance's `description` (older instances already carry it flat) and
// doubles as the display model of the type card / metadata section.
export const buildInstanceTypeSnapshotSpec = (
  instanceType: InstanceTypeSnapshotSource
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
// need it. The type rendering no longer READS this blob: it renders from the
// server-resolved `typeSnapshotDetail`, which carries the full status.detail
// including the profile ledger. The write path stays only until the remaining
// legacy consumers (the create-time `maxComputeUnitCount` figure no other
// channel carries) are retired — it must stay lean for the same 1024-char cap.

// Serialize the chosen instance type into the instance's `description` field.
// Kept for backward compatibility: type rendering now reads the
// server-resolved `typeSnapshotDetail`, so this blob is write-only legacy
// payload plus the create-time `maxComputeUnitCount` figure. Shared by the
// create flow (card selection) and the edit flow (change-type overlay).
export const saveInstanceDataInDescription = (
  instanceType: InstanceTypeItem
): string => {
  return JSON.stringify({
    name: instanceType.name,
    spec: buildInstanceTypeSnapshotSpec(instanceType)
  });
};
