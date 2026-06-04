import { useEffect, useState } from 'react';
import {
  queryResourceFilterMeta,
  ResourceFilterOption
} from '../apis/resource';

export interface SelectOption {
  value: number;
  label: string;
  deleted?: boolean;
}

export interface ResourceMetaOptions {
  creators: SelectOption[];
  instances: SelectOption[];
  volumes: SelectOption[];
}

const EMPTY: ResourceMetaOptions = {
  creators: [],
  instances: [],
  volumes: []
};

const toOptions = (items: ResourceFilterOption[]): SelectOption[] =>
  items.map((i) => ({ value: i.id, label: i.label, deleted: i.deleted }));

/**
 * Loads the resource tabs' filter dropdown sources in one call:
 *   - ``creators``  — "filter by user" (Tokens-tab equivalent of /usage/meta
 *                     users); only shown to managers, but cheap to always load.
 *   - ``instances`` — "filter by GPU instance" (GPU Instances tab)
 *   - ``volumes``   — "filter by volume" (Storage tab)
 *
 * Scope-aware: managers get the org-wide lists, others only their own
 * resources. Refetched when ``scope`` changes.
 */
export default function useResourceMeta(
  scope: 'self' | 'all' = 'all'
): ResourceMetaOptions {
  const [meta, setMeta] = useState<ResourceMetaOptions>(EMPTY);

  useEffect(() => {
    queryResourceFilterMeta(scope)
      .then((res) =>
        setMeta({
          creators: toOptions(res.creators),
          instances: toOptions(res.instances),
          volumes: toOptions(res.volumes)
        })
      )
      .catch(() => {
        // Network/auth errors surface via the global interceptor; leave the
        // dropdowns empty rather than crashing the tab.
      });
  }, [scope]);

  return meta;
}
