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

const _trim = (n: number): string =>
  Number.isInteger(n) ? `${n}` : n.toFixed(1);

// Compact CPU/RAM spec, e.g. "2 vCPU · 4 GB", from the instance totals
// (millicores / MiB). Empty string when neither is known.
export const formatCpuSpec = (
  cpuMilli?: number | null,
  memMib?: number | null
): string => {
  const parts: string[] = [];
  if (cpuMilli) parts.push(`${_trim(cpuMilli / 1000)} vCPU`);
  if (memMib) parts.push(`${_trim(memMib / 1024)} GB`);
  return parts.join(' · ');
};

// CPU instance-type label: "CPU-only" plus its real size when known, e.g.
// "CPU-only · 2 vCPU · 4 GB". Used by both the table column and the trend
// legend so they read identically.
export const cpuOnlyLabel = (row?: Partial<ResourceBreakdownItem>): string => {
  const spec = formatCpuSpec(row?.cpu_milli, row?.memory_mib);
  return spec ? `CPU-only · ${spec}` : 'CPU-only';
};

// Instance Types are grouped by actual shape, so each row is one concrete
// type: a GPU shows "<product> x <cards>", a CPU shows "CPU-only · <spec>".
// One label for the table column and the trend legend so they read the same
// and each shape is a distinct series. (" x " matches the GPU Instances list.)
export const instanceTypeSeriesLabel = (
  row?: Partial<ResourceBreakdownItem>
): string => {
  const isCpu = !row?.gpu_count && !row?.vram_mib;
  if (isCpu) return cpuOnlyLabel(row);
  const product = row?.product || row?.gpu_type || '-';
  return row?.gpu_count ? `${product} x ${row.gpu_count}` : product;
};
