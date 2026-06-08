/**
 * Build bar-chart series for the resource trend charts (GPU Instances /
 * Storage), shared so both tabs behave identically.
 *
 * Without a group dimension it's a single series of the chosen metric. With
 * one (the backend returns ``group_by=["date", "<dim>"]`` rows, each carrying
 * ``date`` + ``group``), it pivots into one stacked series per group value
 * over the date axis — mirroring the Tokens tab's grouped trend.
 */
import type { BarSeriesItem } from '@/pages/_components/bar-chart';
import { ResourceBreakdownItem } from '../apis/resource';
import { bucketKey, Granularity } from './time-buckets';

const valueOf = (item: ResourceBreakdownItem, metric: string): number =>
  Number((item as Record<string, any>)[metric] ?? 0);

export const buildTrendSeries = (opts: {
  items?: ResourceBreakdownItem[];
  metric: string;
  granularity: Granularity;
  xAxis: string[];
  groupBy: string | null;
  // Palette factory (e.g. useCoolColors()); called with the series count.
  palette: (n: number) => string[];
  singleName: string;
}): BarSeriesItem[] => {
  const { items, metric, granularity, xAxis, groupBy, palette, singleName } =
    opts;

  if (!groupBy) {
    const byDate = new Map<string, number>();
    (items || []).forEach((i) => {
      if (!i.date) return;
      byDate.set(bucketKey(i.date, granularity), valueOf(i, metric));
    });
    return [
      {
        name: singleName,
        data: xAxis.map((d) => byDate.get(d) ?? 0),
        color: palette(1)[0]
      }
    ];
  }

  // Group label → (date bucket → value). ``order`` preserves first-seen order
  // so colors stay stable as the date range scrolls.
  const byGroup = new Map<string, Map<string, number>>();
  const order: string[] = [];
  (items || []).forEach((i) => {
    if (!i.date) return;
    const label = i.group || 'unknown';
    if (!byGroup.has(label)) {
      byGroup.set(label, new Map());
      order.push(label);
    }
    byGroup.get(label)!.set(bucketKey(i.date, granularity), valueOf(i, metric));
  });

  const colors = palette(Math.max(order.length, 1));
  return order.map((label, idx) => ({
    name: label,
    data: xAxis.map((d) => byGroup.get(label)?.get(d) ?? 0),
    color: colors[idx % colors.length],
    stack: 'total'
  }));
};
