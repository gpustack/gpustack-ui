import type { WorkerLabelOption } from '../config/types';

export const isFilterableLabelKey = (key: string) =>
  key.length > 0 && !key.includes('=');

export const formatWorkerLabel = (value: string) => {
  const separator = value.indexOf('=');
  return separator > 0
    ? `${value.slice(0, separator)}: ${value.slice(separator + 1)}`
    : value;
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
