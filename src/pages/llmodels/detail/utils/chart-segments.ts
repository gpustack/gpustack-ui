import {
  containsTimestamp,
  nearestTimestampIndex,
  type ChartTimeRange
} from './chart-context';

export interface ChartTimeSegment extends ChartTimeRange {
  id: string;
  label: string;
  caption: string;
  description: string;
}

interface SegmentSample {
  coordinate: number;
  sourceIndex: number | null;
  segment: ChartTimeSegment;
}

// Display coordinates are separate from source timestamps. Null entries break a
// line between measurements; they are never exposed as observations in a table.
export const segmentLayout = (
  segments: ChartTimeSegment[],
  timestamps: number[]
) => {
  const valid = segments.filter(
    (s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.start < s.end
  );
  const entries: SegmentSample[] = [];
  const claimed = new Set<number>();
  const coordinate = (
    position: number,
    segment: ChartTimeSegment,
    time: number
  ) =>
    position -
    0.44 +
    (0.88 * (time - segment.start)) / (segment.end - segment.start);
  const chunks = valid.map((segment, position) => {
    const indexes = timestamps.flatMap((time, index) => {
      if (!containsTimestamp(segment, time) || claimed.has(index)) return [];
      claimed.add(index);
      return [index];
    });
    indexes.forEach((sourceIndex) =>
      entries.push({
        coordinate: coordinate(position, segment, timestamps[sourceIndex]),
        sourceIndex,
        segment
      })
    );
    entries.push({ coordinate: position + 0.49, sourceIndex: null, segment });
    return {
      segment,
      position,
      indexes,
      left: position - 0.44,
      right: position + 0.44
    };
  });
  const samples = entries.flatMap((entry, dataIndex) =>
    entry.sourceIndex == null
      ? []
      : [{ ...entry, sourceIndex: entry.sourceIndex, dataIndex }]
  );
  const samplesBySource = new Map(
    samples.map((sample) => [sample.sourceIndex, sample])
  );
  const sourceToData = new Map(
    samples.map((entry) => [entry.sourceIndex, entry.dataIndex])
  );
  return {
    chunks,
    entries,
    samples,
    sampleForSource: (index: number) => samplesBySource.get(index),
    dataIndexForTimestamp: (time: number) => {
      const index = nearestTimestampIndex(timestamps, time);
      return timestamps[index] === time ? (sourceToData.get(index) ?? -1) : -1;
    },
    sampleAtCoordinate: (value: number) => {
      if (
        !Number.isFinite(value) ||
        value < -0.5 ||
        value > chunks.length - 0.5
      )
        return undefined;
      const chunk =
        chunks[
          Math.min(chunks.length - 1, Math.max(0, Math.floor(value + 0.5)))
        ];
      if (!chunk?.indexes.length) return undefined;
      const progress = Math.max(
        0,
        Math.min(1, (value - chunk.left) / (chunk.right - chunk.left))
      );
      const times = chunk.indexes.map((i) => timestamps[i]);
      const index =
        chunk.indexes[
          nearestTimestampIndex(
            times,
            chunk.segment.start +
              progress * (chunk.segment.end - chunk.segment.start)
          )
        ];
      return samplesBySource.get(index);
    },
    bands: (range: ChartTimeRange) =>
      chunks.flatMap((chunk) => {
        const start = Math.max(range.start, chunk.segment.start),
          end = Math.min(range.end, chunk.segment.end);
        return start < end
          ? [
              {
                start: coordinate(chunk.position, chunk.segment, start),
                end: coordinate(chunk.position, chunk.segment, end)
              }
            ]
          : [];
      })
  };
};
