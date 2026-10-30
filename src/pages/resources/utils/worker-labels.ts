import type { ListItem } from '../config/types';

export const isFilterableLabelKey = (key: string) =>
  key.length > 0 && !key.includes('=');

export const formatWorkerLabel = (value: string) => {
  const separator = value.indexOf('=');
  return separator > 0
    ? `${value.slice(0, separator)}: ${value.slice(separator + 1)}`
    : value;
};

export const buildWorkerLabelOptions = (
  workers: Array<Pick<ListItem, 'labels'>>
): Global.BaseOption<string>[] => {
  const pairs = new Set<string>();
  for (const worker of workers) {
    for (const [key, value] of Object.entries(worker.labels || {})) {
      if (isFilterableLabelKey(key) && typeof value === 'string') {
        pairs.add(`${key}=${value}`);
      }
    }
  }
  return [...pairs].sort().map((value) => ({
    label: formatWorkerLabel(value),
    value
  }));
};
