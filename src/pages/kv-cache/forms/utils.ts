import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import _ from 'lodash';
import { CacheProviderComponent, CacheProviderField } from '../config/types';

export const GiB = 1024 * 1024 * 1024;

// fields the controller applies to running instances directly; everything
// else only lands when an instance is deleted and recreated
export const NO_RECREATE_FIELDS = ['name', 'restart_on_error'];

// provider-declared field names are technical keys like "base_path";
// turn them into "Base Path" when the declaration carries no label
export const humanizeFieldName = (name: string) =>
  name
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// null, undefined, '' and empty containers are interchangeable spellings
// of "unset" between the form state and the API payload
export const isUnset = (value: any) =>
  value === null ||
  value === undefined ||
  value === '' ||
  ((Array.isArray(value) || _.isPlainObject(value)) && _.isEmpty(value));

// drops unset object entries so a field the user never touched compares
// equal whether it is missing, null or an empty container
export const stripUnset = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(stripUnset);
  }
  if (_.isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, stripUnset(entry)])
        .filter(([, entry]) => !isUnset(entry))
    );
  }
  return value;
};

// what a declared field holds right now: the form's value where the user
// (or a seeding pass) put one, the declaration's default otherwise
export const resolveFieldValue = (
  name: string | undefined,
  fields: CacheProviderField[] | undefined,
  values?: Record<string, any> | null
) => {
  if (!name) {
    return undefined;
  }
  const declared = fields?.find((field) => field.name === name);
  return values?.[name] ?? declared?.default;
};

// a component runs when the field gating it holds the declared value; an
// ungated one always runs. enabled_when absent means "any truthy value"
export const componentEnabled = (
  component: CacheProviderComponent,
  fields: CacheProviderField[] | undefined,
  values?: Record<string, any> | null
) => {
  if (!component.enabled_by) {
    return true;
  }
  const gate = resolveFieldValue(component.enabled_by, fields, values);
  return component.enabled_when != null
    ? gate === component.enabled_when
    : Boolean(gate);
};

// workers of a cluster may share label keys with different values; group
// values under their key so the selector can autocomplete both levels
export const buildWorkerLabelOptions = (workers: WorkerListItem[]) => {
  const labelMap = new Map<string, Set<string>>();
  workers.forEach((worker) => {
    Object.entries(worker.labels || {}).forEach(([key, value]) => {
      if (!labelMap.has(key)) {
        labelMap.set(key, new Set());
      }
      labelMap.get(key)!.add(value);
    });
  });
  return Array.from(labelMap.entries()).map(([key, values]) => ({
    label: key,
    value: key,
    children: Array.from(values).map((value) => ({
      label: value,
      value: value
    }))
  }));
};

export const getTotalMemory = (worker: WorkerListItem) =>
  worker.status?.memory?.total || undefined;

export const getFreeMemory = (worker: WorkerListItem) => {
  const memory = worker.status?.memory;
  if (!memory?.total) {
    return undefined;
  }
  return memory.total - (memory.used ?? memory.allocated ?? 0);
};

// a worker matches when every selector pair is present in its labels
export const matchesSelector = (
  worker: WorkerListItem,
  selector?: Record<string, string> | null
) => {
  if (!selector || !Object.keys(selector).length) {
    return true;
  }
  return Object.entries(selector).every(
    ([key, value]) => worker.labels?.[key] === value
  );
};

// prefer the worker with the most free RAM; fall back to the first
// one when the list carries no memory status
export const pickDefaultWorker = (workers: WorkerListItem[]) => {
  let best: WorkerListItem | undefined;
  let bestFree = -Infinity;
  workers.forEach((worker) => {
    const free = getFreeMemory(worker);
    if (free !== undefined && free > bestFree) {
      best = worker;
      bestFree = free;
    }
  });
  return best ?? workers[0];
};
