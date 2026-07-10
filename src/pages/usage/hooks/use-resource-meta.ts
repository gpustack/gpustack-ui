import { useModel } from '@@/plugin-model';
import { useEffect, useState } from 'react';
import {
  queryResourceFilterMeta,
  ResourceFilterOption
} from '../apis/resource';

export interface SelectOption {
  value: number;
  label: string;
  deleted?: boolean;
  // The signed-in user's own entry, sorted first and tagged "[Current Account]"
  // in the filter dropdown (matches the Tokens tab).
  isCurrent?: boolean;
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

// Deleted entries sink to the bottom of the dropdown; live ones keep their
// incoming order (sort is stable).
const toOptions = (items: ResourceFilterOption[]): SelectOption[] =>
  items
    .map((i) => ({ value: i.id, label: i.label, deleted: i.deleted }))
    .sort((a, b) => Number(!!a.deleted) - Number(!!b.deleted));

// Tag the signed-in user's own entry. Ordering: current account first, deleted
// entries last, everything else keeps its incoming order — matching the Tokens
// tab's "[Current Account]" treatment while pushing stale rows out of the way.
const toUserOptions = (
  items: ResourceFilterOption[],
  currentUserId?: number
): SelectOption[] => {
  const options = items.map((i) => ({
    value: i.id,
    label: i.label,
    deleted: i.deleted,
    isCurrent: currentUserId != null && i.id === currentUserId
  }));
  const rank = (o: SelectOption) => (o.isCurrent ? 0 : o.deleted ? 2 : 1);
  return options.sort((a, b) => rank(a) - rank(b));
};

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
  const { initialState } = useModel('@@initialState');
  const currentUserId = initialState?.currentUser?.id;

  useEffect(() => {
    queryResourceFilterMeta(scope)
      .then((res) =>
        setMeta({
          creators: toUserOptions(res.creators, currentUserId),
          instances: toOptions(res.instances),
          volumes: toOptions(res.volumes)
        })
      )
      .catch(() => {
        // Network/auth errors surface via the global interceptor; leave the
        // dropdowns empty rather than crashing the tab.
      });
  }, [scope, currentUserId]);

  return meta;
}
