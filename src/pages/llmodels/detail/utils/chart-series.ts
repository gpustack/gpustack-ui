import { CHART_SERIES_COLORS } from '../../../../config/chart-colors';
import type { MetricSeries } from '../config/types';
import { INTERVAL_STATISTICS, seriesIdentity } from './metrics';

const symbols = ['circle', 'rect', 'triangle', 'diamond'];
const symbolLabels = ['●', '■', '▲', '◆'];
// Keep the default P99 measurement colors first; reserve the other statistics
// even when they are not selected, so surviving curves retain their colors.
const timingStatistics = ['p99', 'avg', 'p50', 'p95'];

export const seriesEntityKey = (item: MetricSeries) => {
  const d = item.dimensions;
  if (d.mount_point != null)
    return `filesystem:${d.worker_id}:${d.mount_point}`;
  if (d.device_id) return `device:${d.device_id}`;
  if (d.model_instance_id != null) return `instance:${d.model_instance_id}`;
  if (d.worker_id != null) return `worker:${d.worker_id}`;
  return null;
};

const identityHash = (value: string) => {
  let hash = 2166136261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
};

export const assignEntityColors = (
  series: MetricSeries[],
  domain: string[],
  slots: Map<string, number>
) => {
  const counts = new Map<string, number>();
  for (const key of slots.keys()) {
    const kind = key.split(':')[0];
    counts.set(kind, (counts.get(kind) || 0) + 1);
  }
  const keys = [
    ...new Set([
      ...domain,
      ...series.map(seriesEntityKey).filter((key): key is string => !!key)
    ])
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const key of keys) {
    if (slots.has(key)) continue;
    const kind = key.split(':')[0],
      slot = counts.get(kind) || 0;
    slots.set(key, slot);
    counts.set(kind, slot + 1);
  }
  return slots;
};

const tintColor = (color: string, amount: number) => {
  if (!amount) return color;
  const channels = [1, 3, 5].map((offset) =>
    parseInt(color.slice(offset, offset + 2), 16)
  );
  return (
    '#' +
    channels
      .map((channel) =>
        Math.round(
          amount > 0
            ? channel + (255 - channel) * amount
            : channel * (1 + amount)
        )
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
};

const rotateColorHue = (color: string, degrees: number) => {
  if (!degrees) return color;
  const [r, g, b] = [1, 3, 5].map(
    (offset) => parseInt(color.slice(offset, offset + 2), 16) / 255
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    chroma = max - min;
  if (!chroma) return color;
  const hue =
    ((max === r
      ? (g - b) / chroma
      : max === g
        ? (b - r) / chroma + 2
        : (r - g) / chroma + 4) +
      degrees / 60 +
      6) %
    6;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const channels =
    hue < 1
      ? [chroma, x, 0]
      : hue < 2
        ? [x, chroma, 0]
        : hue < 3
          ? [0, chroma, x]
          : hue < 4
            ? [0, x, chroma]
            : hue < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  return (
    '#' +
    channels
      .map((channel) =>
        Math.round((channel + min) * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
};

const seriesColor = (slot: number, dark: boolean, comparison = false) => {
  const palette = CHART_SERIES_COLORS[dark ? 'dark' : 'light'];
  const color = palette[slot % palette.length];
  const depth = Math.floor(slot / palette.length);
  // Bounded shades keep the timing palette in range without repeating every
  // 32 slots when instance identities are interleaved with other PD roles.
  const shadeLimit = dark || color === '#0891b2' ? 0.12 : 0.24;
  const amount = comparison
    ? -(shadeLimit * depth) / (depth + 2)
    : (dark ? [0, 0.1, -0.1, 0.18] : [0, -0.12, 0.12, -0.22])[depth % 4];
  const shaded = tintColor(color, amount);
  return comparison ? rotateColorHue(shaded, depth * 2) : shaded;
};

export const chartSeries = (
  series: MetricSeries[],
  histogram: boolean,
  measures: string[] = []
) =>
  [...series].sort((a, b) => {
    if (!histogram) return 0;
    if (a.comparisonMeasure && b.comparisonMeasure) {
      const entity = (seriesEntityKey(a) || '').localeCompare(
        seriesEntityKey(b) || '',
        undefined,
        { numeric: true }
      );
      const measureIndex = (item: MetricSeries) =>
        measures.findIndex(
          (name) => item.name === name || item.name.startsWith(name + ' · ')
        );
      return (
        entity ||
        measureIndex(a) - measureIndex(b) ||
        seriesIdentity(a).localeCompare(seriesIdentity(b))
      );
    }
    return (
      INTERVAL_STATISTICS.findIndex((statistic) => statistic === a.statistic) -
        INTERVAL_STATISTICS.findIndex(
          (statistic) => statistic === b.statistic
        ) || seriesIdentity(a).localeCompare(seriesIdentity(b))
    );
  });

export const seriesAppearance = (
  item: MetricSeries,
  histogram: boolean,
  measures: string[],
  dark: boolean,
  slots?: Map<string, number>,
  neutralMeasures: string[] = []
) => {
  const matchesMeasure = (name: string) =>
    item.name === name || item.name.startsWith(name + ' · ');
  const neutral = neutralMeasures.some(matchesMeasure);
  const coloredMeasures = measures.filter(
    (name) => !neutralMeasures.includes(name)
  );
  const measure = coloredMeasures.findIndex(
    (name) => item.name === name || item.name.startsWith(name + ' · ')
  );
  const entity = seriesEntityKey(item);
  const hash = entity ? identityHash(entity) : 0;
  const role = !histogram
    ? ({ prefill: 0, decode: 1, router: 2 } as Record<string, number>)[
        item.dimensions.role || ''
      ]
    : undefined;
  const statisticIndex = INTERVAL_STATISTICS.findIndex(
    (value) => value === item.statistic
  );
  const comparison =
    histogram && item.comparisonMeasure === true && measure >= 0;
  const symbol = comparison
    ? entity
      ? Math.max(0, statisticIndex)
      : measure % symbols.length
    : histogram
      ? Math.max(0, statisticIndex)
      : 0;
  const entitySlot = entity ? (slots?.get(entity) ?? hash % 32) : 0;
  // Reserve every colored statistic/measure slot, including temporarily missing ones.
  // Neutral capacity references never shift an entity's measured colors.
  // Coloring only the entity reduced eight instance latency lines to two hues.
  // The full curve keeps its color across panels, sorting and filtering.
  const colorSlot = comparison
    ? entitySlot * coloredMeasures.length * timingStatistics.length +
      Math.max(0, timingStatistics.indexOf(item.statistic)) *
        coloredMeasures.length +
      measure
    : histogram
      ? entitySlot * INTERVAL_STATISTICS.length + symbol
      : measure >= 0
        ? entitySlot * coloredMeasures.length + measure
        : entity
          ? entitySlot
          : (role ?? 0);
  return {
    color: neutral
      ? dark
        ? '#9aa4b1'
        : '#8b939e'
      : seriesColor(colorSlot, dark, comparison),
    pattern: 'solid' as const,
    symbol: symbols[symbol],
    symbolLabel: symbolLabels[symbol],
    comparison: !!entity
  };
};

export type SeriesSelection = { metricKey: string; ids: string[] } | null;

// A selection from another metric or a vanished population must not hide the
// new population. Stable IDs retain the selection during sampling refreshes.
export const selectedSeries = (
  selection: SeriesSelection,
  metricKey: string,
  series: MetricSeries[]
) => {
  const ids =
    selection?.metricKey === metricKey
      ? series.map(seriesIdentity).filter((id) => selection.ids.includes(id))
      : [];
  return ids.length && ids.length < series.length ? ids : null;
};

export const changeSeriesSelection = (
  selection: SeriesSelection,
  metricKey: string,
  series: MetricSeries[],
  id: string,
  multiple: boolean
): SeriesSelection => {
  const current = selectedSeries(selection, metricKey, series);
  if (!multiple) {
    return current?.length === 1 && current[0] === id
      ? null
      : { metricKey, ids: [id] };
  }
  const visible = current || series.map(seriesIdentity);
  const ids = visible.includes(id)
    ? visible.filter((item) => item !== id)
    : [...visible, id];
  return ids.length && ids.length < series.length ? { metricKey, ids } : null;
};
