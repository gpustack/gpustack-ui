/**
 * Instance-type display helpers — render the Usage "Instance Type" the same way
 * the GPU Instances list does: a pretty product name (e.g.
 * "NVIDIA-GeForce-RTX-5090-D") plus a per-card spec line, instead of the raw
 * kueue flavor slug.
 *
 * The product name + per-card specs ride on the breakdown rows via
 * ``dimensions`` (instance-type / per-instance groupings only); older rows that
 * predate the enrichment fall back to the flavor slug (``gpu_type``).
 */
import { InstanceTypeSection } from '@/pages/gpu-service/instances/components/instance-type-cell';
import { formatMemoryDisplay } from '@/pages/gpu-service/instances/config';
import { ResourceBreakdownItem } from '../apis/resource';

// Primary label: GPU product name when known, else the flavor slug.
export const instanceTypeLabel = (
  row?: Partial<ResourceBreakdownItem>
): string => row?.product || row?.gpu_type || '-';

// Round to ≤2 decimals, stripping trailing zeros, so fractional CPU allocations
// (e.g. 0.5C / 500m) aren't misrounded up to "1C". Memory uses the shared
// formatMemoryDisplay so sizes match the GPU Instances list exactly.
const fmt = (n: number): number => parseFloat(n.toFixed(2));

// Secondary spec line "18C · 54GB RAM · 31GB VRAM" (per card). Storage is
// intentionally excluded — it's user-customizable and not part of the type.
// Empty string when no specs are known (fall back to label only).
export const instanceTypeSpecs = (
  row?: Partial<ResourceBreakdownItem>
): string => {
  if (!row) return '';
  const parts: string[] = [];
  if (row.unit_cpu_milli) {
    parts.push(`${fmt(row.unit_cpu_milli / 1000)}C`);
  }
  if (row.unit_memory_mib) {
    parts.push(`${formatMemoryDisplay(row.unit_memory_mib)} RAM`);
  }
  if (row.vram_mib) {
    parts.push(`${formatMemoryDisplay(row.vram_mib)} VRAM`);
  }
  return parts.join(' · ');
};

// Per-instance title for the Instances table: "<product> x <count>", matching
// the GPU Instances list (count carried in dimensions per instance).
export const instanceTypeTitle = (
  row?: Partial<ResourceBreakdownItem>
): string => {
  const label = instanceTypeLabel(row);
  return row?.gpu_count ? `${label} x ${row.gpu_count}` : label;
};

// Spec-popover sections for the Instances table, fed to the shared
// InstanceTypeCell so it renders exactly like the GPU Instances list:
// GPU (Count / Instance Type / per-card VRAM), CPU + Memory as whole-instance
// totals (count × per-card, as the list shows), and the ephemeral data disk.
// Empty rows are dropped by the cell. ``labels`` carries the i18n VRAM / Disk
// captions so this util stays intl-free.
export const instanceTypeSections = (
  row: Partial<ResourceBreakdownItem> | undefined,
  labels: { vram: string; disk: string }
): InstanceTypeSection[] => {
  if (!row) return [];
  const count = row.gpu_count || 0;
  const cpu =
    row.unit_cpu_milli && count
      ? `${fmt((row.unit_cpu_milli / 1000) * count)}C`
      : undefined;
  // RAM is the whole-instance total (per-card × count), as the list shows.
  const ram =
    row.unit_memory_mib && count
      ? formatMemoryDisplay(row.unit_memory_mib * count)
      : undefined;
  return [
    {
      icon: 'icon-gpu',
      name: 'GPU',
      rows: [
        ['Count', count ? `${count}` : undefined],
        ['Instance Type', row.product],
        [labels.vram, formatMemoryDisplay(row.vram_mib)]
      ]
    },
    { icon: 'icon-cpu', name: 'CPU', rows: [[null, cpu]] },
    { icon: 'icon-ram-02', name: 'Memory', rows: [[null, ram]] },
    {
      icon: 'icon-hard-disk',
      name: labels.disk,
      rows: [
        ['System', formatMemoryDisplay(row.local_storage_mib)],
        ['Data', formatMemoryDisplay(row.ephemeral_mib)],
        ['Persistent', formatMemoryDisplay(row.persistent_mib)]
      ]
    }
  ];
};
