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

const toOptions = (items: ResourceFilterOption[]): SelectOption[] =>
  items.map((i) => ({ value: i.id, label: i.label, deleted: i.deleted }));

// Tag the signed-in user's own entry and sort it first, matching the Tokens
// tab's "[Current Account]" treatment.
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
  if (currentUserId == null) return options;
  return options.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return 0;
  });
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
