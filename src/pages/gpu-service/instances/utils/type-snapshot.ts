import { ceilMilliToCore, parseQuantityToGi } from '../../utils';
import {
  InstanceTypeSnapshotDetail,
  InstanceTypeSnapshotSpec
} from '../config/types';
import { buildInstanceTypeSnapshotSpec } from './instance-description';

// Build the flat display snapshot from the server-resolved type summary
// (GPUInstancePublic.typeSnapshotDetail) — the same flat shape the legacy
// description blob carried, so the renderers keep one view model. The API's
// spec.unitResources is a raw quantity string, so the parsed numbers the
// renderers read are recomputed here; a spec that already carries precomputed
// values (the Usage breakdown's synthesized rows) wins unchanged.
export const buildInstanceTypeSnapshot = (
  detail?: InstanceTypeSnapshotDetail | null
): InstanceTypeSnapshotSpec | undefined => {
  if (!detail) {
    return undefined;
  }
  const spec = detail.spec ?? {};
  return buildInstanceTypeSnapshotSpec({
    name: detail.name ?? '',
    spec: {
      ...spec,
      unitResourcesParsed: spec.unitResourcesParsed ?? {
        cpu: ceilMilliToCore(spec.unitResources?.cpu ?? null),
        ram: parseQuantityToGi(spec.unitResources?.ram ?? null)
      }
    },
    status: { detail: detail.status?.detail ?? null }
  });
};
