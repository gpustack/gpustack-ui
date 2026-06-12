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

export const initialPasswordAtom = atom<string>('');

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

export interface CachedOrg {
  id: number;
  name?: string;
  // The platform Org (single global tenant). Its models are NOT
  // namespaced in ``/v1/models`` — they appear under their bare name.
  is_platform?: boolean;
}

// Resolve the cached Org record for an owner/principal id by scanning both
// org caches. ``organizationList`` (the caller's member orgs) is checked
// alongside the admin-only ``allOrganizations`` so member sessions resolve
// too. Id types vary between localStorage payloads (some writers stringify,
// others persist as a JSON number), so compare as strings — strict equality
// would silently miss those cases.
export const getOrgById = (
  id: number | string | null | undefined
): CachedOrg | null => {
  if (id == null) return null;
  const target = String(id);
  for (const key of ORG_CACHE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const list = JSON.parse(raw) as CachedOrg[];
      if (!Array.isArray(list)) continue;
      const match = list.find((item) => String(item?.id) === target);
      if (match) return match;
    } catch {
      // ignore malformed cache; continue checking other keys
    }
  }
  return null;
};

// Bare Org *name* (e.g. ``org1``) for an owner/principal id, or null.
export const getOrgNameById = (
  id: number | string | null | undefined
): string | null => {
  return getOrgById(id)?.name ?? null;
};

const lookupOrgNamespace = (id: number | null): string | null => {
  const name = getOrgNameById(id);
  return name ? `gpustack-${name}` : null;
};

// The Org the caller is currently acting under, or null in the admin-"All"
// context. The org-switcher reloads the page on switch, so the list pages
// always show this org's resources — which is how ``/v1/models`` namespaces
// their model ids (``{org}/{name}``). Callers reconstructing that id use this
// as the fallback owner when a row carries no explicit ``owner_principal_id``.
export const getCurrentOrg = (): CachedOrg | null => {
  return getOrgById(getStoredCurrentOrgId());
};
