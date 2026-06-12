/**
 * Instance-type display helper for the Usage tables.
 *
 * The Instances breakdown renders its Instance Type column through the
 * canonical GPU Instances renderer (``renderInstanceType`` +
 * ``buildInstanceTypeRecordFromMiB``), so the label + spec popover stay
 * identical to the GPU Instances list. Only the Instance Types breakdown — a
 * plain product label with no popover — still uses the helper below.
 *
 * The product name rides on the breakdown rows via ``dimensions``; older rows
 * that predate the enrichment fall back to the flavor slug (``gpu_type``).
 */
import { ResourceBreakdownItem } from '../apis/resource';

// Primary label: GPU product name when known, else the flavor slug.
export const instanceTypeLabel = (
  row?: Partial<ResourceBreakdownItem>
): string => row?.product || row?.gpu_type || '-';
