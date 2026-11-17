import type { MetricSeries } from '../config/types';

export interface ChartTimeRange {
  start: number;
  end: number;
}

export interface ChartTimeBand extends ChartTimeRange {
  label: string;
  kind: 'selected' | 'baseline';
}

export interface ChartFocus {
  dimension: 'model_instance_id' | 'worker_id' | 'device_id';
  values: (string | number)[];
}

export interface ChartCursor {
  timestamp: number | null;
  pinned: boolean;
}

export interface ChartInteraction extends ChartCursor {
  onChange: (next: ChartCursor) => void;
}

// Intervals are half-open: the sample on a boundary belongs to the next stage.
export const containsTimestamp = (range: ChartTimeRange, timestamp: number) =>
  timestamp >= range.start && timestamp < range.end;

export const visibleTimeBands = (
  bands: ChartTimeBand[],
  range?: ChartTimeRange
) =>
  bands.flatMap((band) => {
    const start = range ? Math.max(band.start, range.start) : band.start;
    const end = range ? Math.min(band.end, range.end) : band.end;
    return Number.isFinite(start) && Number.isFinite(end) && start < end
      ? [{ ...band, start, end }]
      : [];
  });

export const isFocusedSeries = (series: MetricSeries, focus?: ChartFocus) =>
  !focus ||
  focus.values.some((value) => series.dimensions[focus.dimension] === value);

export const nearestTimestampIndex = (
  timestamps: number[],
  timestamp: number
) => {
  if (!timestamps.length || !Number.isFinite(timestamp)) return -1;
  let low = 0;
  let high = timestamps.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (timestamps[middle] < timestamp) low = middle + 1;
    else high = middle;
  }
  return low > 0 &&
    timestamp - timestamps[low - 1] <= timestamps[low] - timestamp
    ? low - 1
    : low;
};
