import { queryGPUInstanceTypes } from '@/pages/gpu-service/instance-types/apis';
import { atom, getDefaultStore, useAtomValue } from 'jotai';
import { useEffect } from 'react';

/**
 * Display names of a cluster's GPU instance types, keyed by cluster id and
 * then by the type's (cluster-scoped) name.
 *
 * A deployed model records only the type's name — the identifier the operator
 * validates against — so every read-only view of a vGPU deployment (instance
 * tooltip, instance list) has to resolve the human-readable name itself. It is
 * resolved live rather than snapshotted at deploy time, because the display
 * name is the one part of an instance type that stays editable.
 */
const displayNamesAtom = atom<Record<number, Record<string, string>>>({});

// Clusters already fetched (or in flight), so N rows of the same cluster cost
// one request. Not part of the atom: it is bookkeeping, not rendered state.
const requested = new Set<number>();

const fetchClusterTypes = async (clusterId: number) => {
  if (requested.has(clusterId)) {
    return;
  }
  requested.add(clusterId);
  const store = getDefaultStore();
  try {
    const res = await queryGPUInstanceTypes({ cluster_id: clusterId });
    const names = (res?.items || []).reduce(
      (acc: Record<string, string>, item) => {
        if (item.spec?.displayName) {
          acc[item.name] = item.spec.displayName;
        }
        return acc;
      },
      {}
    );
    store.set(displayNamesAtom, {
      ...store.get(displayNamesAtom),
      [clusterId]: names
    });
  } catch {
    // Leave the cluster unresolved; callers fall back to the type's name.
    // Allow a retry on the next mount rather than caching the failure.
    requested.delete(clusterId);
  }
};

/**
 * Resolve an instance type's display name, fetching the cluster's types once
 * per session. Returns undefined until they land, and for a type that carries
 * no display name or no longer exists — callers show the type's name instead.
 */
export const useGPUTypeDisplayName = (
  clusterId?: number | null,
  typeName?: string | null
): string | undefined => {
  const displayNames = useAtomValue(displayNamesAtom);

  useEffect(() => {
    if (clusterId == null || !typeName) {
      return;
    }
    fetchClusterTypes(clusterId);
  }, [clusterId, typeName]);

  if (clusterId == null || !typeName) {
    return undefined;
  }
  return displayNames[clusterId]?.[typeName];
};
