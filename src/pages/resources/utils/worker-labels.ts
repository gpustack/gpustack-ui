import type {
  KeyValueFilterOption,
  KeyValueFilterValue
} from '../../_components/key-value-filter/types';
import type { WorkerLabelOption } from '../config/types';

export const isFilterableLabelKey = (key: string) =>
  key.length > 0 && !key.includes('=');

export const formatWorkerLabel = (value: string) => {
  const separator = value.indexOf('=');
  return separator > 0
    ? `${value.slice(0, separator)}: ${value.slice(separator + 1)}`
    : value;
};

export const parseWorkerLabelFilters = (
  labels: string[]
): KeyValueFilterValue[] =>
  labels.flatMap((label) => {
    const separator = label.indexOf('=');
    return separator > 0
      ? [{ key: label.slice(0, separator), value: label.slice(separator + 1) }]
      : [];
  });

export const groupWorkerLabelOptions = (
  options: Global.BaseOption<string>[]
): KeyValueFilterOption[] => {
  const groups = new Map<string, Set<string>>();
  for (const pair of parseWorkerLabelFilters(
    options.map((option) => option.value)
  )) {
    const values = groups.get(pair.key) || new Set<string>();
    values.add(pair.value);
    groups.set(pair.key, values);
  }
  return [...groups].map(([key, values]) => ({ key, values: [...values] }));
};

export const buildWorkerLabelOptions = (
  groups: WorkerLabelOption[]
): Global.BaseOption<string>[] =>
  groups.flatMap(({ key, values }) =>
    values.map((value) => {
      const pair = `${key}=${value}`;
      return { value: pair, label: formatWorkerLabel(pair) };
    })
  );
