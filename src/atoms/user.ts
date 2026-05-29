import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const userAtom = atomWithStorage<any>('userInfo', null);

// Backs the `currentOrganizationId` localStorage key. Stays null in
// builds with no Org context (single-tenant), and is shared with any
// extension that persists the same key so both sides stay in sync
// without one side having to import from the other.
export const currentOrganizationIdAtom = atomWithStorage<number | null>(
  'currentOrganizationId',
  null
);

export const GPUStackVersionAtom = atom<{
  version: string;
  git_commit: string;
  isProd: boolean;
  isDev?: boolean;
  isRc?: boolean;
}>({
  version: '',
  git_commit: '',
  isProd: false,
  isDev: false,
  isRc: false
});

export const UpdateCheckAtom = atom<{
  latest_version: string;
}>({
  latest_version: ''
});

export const initialPasswordAtom = atomWithStorage<string>(
  'initialPassword',
  ''
);

// Namespace the server creates for an Org's resources on each Kubernetes
// cluster. The format must match the backend's ``get_namespace_name``
// helper — ``gpustack-{name}`` — because the GPU-instance / storage CRDs
// (worker.gpustack.ai/v1) are namespaced and the server-side admission
// keys off this exact name. The identifier column on the unified
// Principal table is now ``name`` (post identity-consolidation rename
// of the legacy ``slug``); the namespace prefix is unchanged.
//
// Resolution path:
//   1. The Org the caller is currently acting under — the enterprise
//      plugin persists ``currentOrganizationId`` (numeric) when the user
//      picks an Org via OrgSwitcher.
//   2. The cluster's own owner Org — used in the platform-admin "All"
//      view, where the caller has no Org context but the resource still
//      has to land in *some* Org's namespace.
//   3. ``gpustack-default`` as a last resort (first load before any
//      cache is hydrated, or a cluster whose owner Org is missing from
//      both caches).
//
// Called outside React (umi page utilities) so it reads localStorage
// directly rather than going through a Jotai hook. The org caches are
// kept fresh by the enterprise plugin's atomWithStorage atoms, and the
// OrgSwitcher reloads the page on switch so we don't need in-process
// reactivity here.
export const getCurrentOrgNamespace = (
  clusterOwnerPrincipalId?: number | null
): string => {
  return (
    lookupOrgNamespace(getStoredCurrentOrgId()) ??
    lookupOrgNamespace(clusterOwnerPrincipalId ?? null) ??
    'gpustack-default'
  );
};

const getStoredCurrentOrgId = (): number | null => {
  try {
    const raw = localStorage.getItem('currentOrganizationId');
    if (!raw) return null;
    const value = JSON.parse(raw);
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
};

// Org caches the enterprise plugin persists. ``organizationList`` is
// the caller's member orgs; ``allOrganizations`` is admin-only (every
// Org on the platform) so admin sessions can resolve any owner Org id.
// Both are checked because ``currentOrganizationId`` is null in the
// admin "All" view but a member org's ``name`` might still cover the
// cluster-owner fallback.
const ORG_CACHE_KEYS = ['organizationList', 'allOrganizations'] as const;

const lookupOrgNamespace = (id: number | null): string | null => {
  if (id == null) return null;
  // Normalise both sides to strings — the stored id type varies between
  // localStorage payloads (some writers stringify, others persist as a
  // JSON number); strict equality would silently miss those cases.
  const target = String(id);
  for (const key of ORG_CACHE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const list = JSON.parse(raw) as Array<{ id: number; name?: string }>;
      if (!Array.isArray(list)) continue;
      const match = list.find((item) => String(item?.id) === target);
      if (match?.name) return `gpustack-${match.name}`;
    } catch {
      // ignore malformed cache; continue checking other keys
    }
  }
  return null;
};

export const getAllOrganizations = (): Array<{ id: number; name?: string }> => {
  const allOrganizations = localStorage.getItem('allOrganizations');
  if (!allOrganizations) return [];
  try {
    const list = JSON.parse(allOrganizations) as Array<{
      id: number;
      name?: string;
    }>;
    if (!Array.isArray(list)) return [];
    return list;
  } catch {
    return [];
  }
};
