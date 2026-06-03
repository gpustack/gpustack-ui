/**
 * Time-bucket helpers shared by the resource-usage tabs' charts.
 *
 * The backend returns a per-bucket value keyed by ``bucket_start`` (hourly) or
 * a date_trunc'd date (day/week/month). The chart x-axis must use the SAME key
 * format so series line up. ``bucketKey`` normalizes any returned value to that
 * format via dayjs; ``generateBucketRange`` produces a contiguous axis.
 */
import dayjs from 'dayjs';

export type Granularity = 'hour' | 'day' | 'week' | 'month';

// Cap the hourly axis so a wide date range doesn't render hundreds of bars.
const HOUR_MAX_DAYS = 7;

export const bucketKey = (value: any, granularity: Granularity): string => {
  const d = dayjs(value);
  if (granularity === 'hour') return d.format('YYYY-MM-DD HH:00');
  if (granularity === 'month') return d.format('YYYY-MM');
  return d.format('YYYY-MM-DD'); // day / week (week-start date as returned)
};

export const generateBucketRange = (
  start: string,
  end: string,
  granularity: Granularity
): string[] => {
  if (!start || !end) return [];
  const endDay = dayjs(end);
  let cursor = dayjs(start);
  // Hour view: clamp to the last HOUR_MAX_DAYS to keep the axis readable.
  if (granularity === 'hour') {
    const clampStart = endDay.subtract(HOUR_MAX_DAYS, 'day');
    if (cursor.isBefore(clampStart)) cursor = clampStart;
  }
  const step = granularity === 'hour' ? 'hour' : granularity;
  const out: string[] = [];
  const last =
    granularity === 'hour' ? endDay.endOf('day') : endDay.startOf('day');
  while (cursor.isBefore(last) || cursor.isSame(last)) {
    out.push(bucketKey(cursor, granularity));
    cursor = cursor.add(1, step as dayjs.ManipulateType);
  }
  return out;
};
