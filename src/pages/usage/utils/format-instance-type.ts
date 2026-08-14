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
import { InstanceShape, ResourceBreakdownItem } from '../apis/resource';

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

// ---------------------------------------------------------------------------
// Usage composition — "one unit × how many", and for a reconfigured instance
// how long each of those lasted.
//
// The usage column does not NAME its quantity; it shows what the number is made
// of. That is deliberate: the multiplier (`sku_count`) is dimensionless and the
// size of "one unit" is defined per instance type, so no single column name can
// be both short and true. `1c2g × 4` needs neither a name nor a tooltip, and it
// reads the same way for a GPU (`A100 × 4`), where one unit happens to be a card.
//
// It deliberately stops short of an EQUATION — see the per-shape rows in
// ``UsageCell`` for why an `=` cannot be honoured at two decimals.
// ---------------------------------------------------------------------------

// Trim a count for display: 4 → "4", 0.25 → "0.25", 0.119 → "0.119".
const _count = (n?: number | null): string => {
  const v = Number(n ?? 0);
  return Number.isInteger(v) ? `${v}` : `${Number(v.toFixed(3))}`;
};

// The spec of ONE unit — the formula's multiplicand.
//
// GPU: the card's product name (one unit IS one card). CPU: the instance type's
// per-unit cpu/ram, e.g. "1c2g". Returns '' when the per-unit spec is unknown
// (a type with no ``unitResources``), so callers drop the multiplicand rather
// than invent one — total/count would be wrong, it inverts a round().
export const shapeUnitLabel = (s: InstanceShape): string => {
  const isCpu = !s.gpu_count && !s.vram_mib;
  if (!isCpu) return s.product || '';
  const cpu = s.unit_cpu_milli;
  const mem = s.unit_memory_mib;
  if (!cpu && !mem) return '';
  const parts: string[] = [];
  if (cpu) parts.push(`${Number((cpu / 1000).toFixed(2))}c`);
  if (mem) parts.push(`${Math.round(mem / 1024)}g`);
  return parts.join('');
};

// How much of the type one shape held: `1c2g × 4`, or `× 4` when the per-unit
// spec is unknown (a type with no ``unitResources`` — invent nothing).
export const shapeSize = (s: InstanceShape): string => {
  const unit = shapeUnitLabel(s);
  return unit ? `${unit} × ${_count(s.sku_count)}` : `× ${_count(s.sku_count)}`;
};

// Whether the composition line would say nothing.
//
// The line exists to explain the MULTIPLIER — why the usage differs from the
// wall clock. At a count of 1 there is no multiplication: usage and Instance
// Hours are the same number, and "<unit> × 1" only restates a size the Instance
// Type column already shows. Anything else earns its line, including a whole-card
// "<product> × 2": the type column's "x 2" describes the MACHINE, while the gap
// between 0.21 and 0.11 needs an explanation right where the numbers are.
//
// The test is the count, not the card count — 2 cards at 50% is 1.0 unit, so
// that row has a multiplier of 1 and nothing to explain despite holding 2 cards.
export const shapeSizeIsRedundant = (s: InstanceShape): boolean => {
  const count = Number(s.sku_count ?? 0);
  // A missing or non-positive count is not a multiplier we can state. Printing
  // it produced "× 0", which reads as zero usage sitting under a non-zero total
  // — say nothing rather than something false.
  return !(count > 0) || count === 1;
};

// How a sliced row's cards are carved up, e.g. "25%" for a soft slice or
// "1g.10gb" for a hardware partition. Empty for a whole card.
//
// Without this two rows of the same pool — one holding whole cards, one holding
// quarter cards — render as the same label while billing 4x apart, so the
// breakdown would look like it double-counts.
export const sliceSuffix = (row?: Partial<ResourceBreakdownItem>): string => {
  if (row?.partitioned_profile) return row.partitioned_profile;
  if (row?.slice_mode === 'ratio' && row?.sliced_memory_percentage)
    return `${row.sliced_memory_percentage}%`;
  return '';
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
  // ``gpu_type`` is the accelerator group / snapshotted type name — never the
  // sku, which is an opaque hash (see ResourceBreakdownItem.sku).
  const product = row?.product || row?.gpu_type || '-';
  const slice = sliceSuffix(row);
  const count = Number(row?.gpu_count ?? 0);
  // "x 1" beside a slice suffix is noise — "(25%)" already says this is part of
  // ONE card — and the GPU Instances list omits it for the same reason.
  //
  // The count stays when there is more than one card, which is where that list's
  // rule goes too far: it drops the count for every sliced instance, so 2 cards
  // at 25% renders identically to 1 card at 25% while billing twice as much. On
  // this page those are two separate rows, so they have to read differently.
  const base =
    !count || (slice && count === 1) ? product : `${product} x ${count}`;
  return slice ? `${base} (${slice})` : base;
};
