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

// Serialize the chosen instance type into the instance's `description` field —
// a persisted spec snapshot the form reads back to render the type card and
// derive unit resources. Shared by the create/recreate flow (card selection)
// and the edit flow (change-type overlay).
export const saveInstanceDataInDescription = (
  instanceType: InstanceTypeItem
): string => {
  return JSON.stringify({
    name: instanceType.name,
    spec: buildInstanceTypeSnapshotSpec(instanceType)
  });
};
