import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import sortVersions from '@/utils/sort-versions';
import _ from 'lodash';
import { CPU_BACKEND, matrixServesFamily } from '../config';
import {
  CacheProviderComponent,
  CacheProviderField,
  CacheProviderItem,
  CacheProviderVersionConfig
} from '../config/types';

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

// Every accelerator this cluster's workers present, plus "cpu" for any worker
// that has none — the keys a version's support matrix is read against,
// spelled as the matrix spells them.
export const clusterFrameworksOf = (workers: WorkerListItem[]) => {
  const frameworks = new Set<string>();
  workers.forEach((worker) => {
    const devices = worker.status?.gpu_devices || [];
    if (!devices.length) {
      frameworks.add(CPU_BACKEND);
      return;
    }
    devices.forEach((device) => device.type && frameworks.add(device.type));
  });
  return frameworks;
};

// Whether any worker here could start this version. runtime_images is the
// support matrix; a version declaring none has one build for everything, and
// the plain image answers for a worker with no accelerator where the matrix
// has no "cpu" entry.
//
// No frameworks means the workers have not arrived, which is not the same as
// a cluster that can run nothing: with nothing to judge against, every version
// stands, and the provider's own default holds until they do.
export const versionRunsHere = (
  version: CacheProviderVersionConfig | undefined,
  frameworks: Set<string>
) => {
  if (!version) {
    return false;
  }
  const matrix = version.runtime_images || {};
  if (!Object.keys(matrix).length || !frameworks.size) {
    return true;
  }
  return [...frameworks].some(
    (framework) =>
      matrixServesFamily(matrix, framework) ||
      (framework === CPU_BACKEND && Boolean(version.image))
  );
};

// The version a provider opens on. Its own default first, and the newest one
// that runs here when that default does not: a release line read off the
// runner images defaults to its newest package version, which an accelerator
// the newest images skip has none of. Opening on it would put the form on an
// entry the user has to discover is unusable and correct by hand.
export const pickInitialVersion = (
  provider: CacheProviderItem | undefined,
  workers: WorkerListItem[]
) => {
  const versions = provider?.versions || {};
  // With no declared release line to fall back to, the service runs its own
  // image under the reserved "custom" version.
  if (!Object.keys(versions).length) {
    return provider?.custom_version ? 'custom' : undefined;
  }
  const frameworks = clusterFrameworksOf(workers);
  const declared = provider?.default_version;
  if (declared && versionRunsHere(versions[declared], frameworks)) {
    return declared;
  }
  const runnable = Object.keys(versions).filter((version) =>
    versionRunsHere(versions[version], frameworks)
  );
  // Ascending, so the last is the newest — and a value semver cannot read
  // sorts before every one it can, which keeps it from being taken for one.
  return runnable.sort(sortVersions).at(-1) ?? declared;
};
