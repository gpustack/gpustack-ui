import { satisfies, valid, validRange } from 'semver';
import type { BackendOption, PDMode, RoleFormItem } from '../config/types';

const versionAllowed = (version?: string, range?: string | null) => {
  const parsed = version ? valid(version) : null;
  const supported = range ? validRange(range.replace(/,/g, ' ')) : null;
  return !supported || !parsed || satisfies(parsed, supported);
};

/** Only versions offered as built-in runners carry the catalog's guarantees. */
const selectedBuiltinVersion = (
  backend: Pick<BackendOption, 'isBuiltIn' | 'versions'> | undefined,
  version?: string | null,
  imageName?: string | null
) =>
  backend?.isBuiltIn &&
  version &&
  !imageName &&
  !version.toLowerCase().endsWith('-custom')
    ? backend.versions.find((item) => item.value === version)
    : undefined;

export const pdBackendVersionWarning = (
  backend: Pick<BackendOption, 'isBuiltIn' | 'versions'> | undefined,
  version?: string | null,
  range?: string | null,
  imageName?: string | null
): boolean =>
  Boolean(
    selectedBuiltinVersion(backend, version, imageName) &&
    !versionAllowed(version ?? undefined, range)
  );

export const clearUnsupportedPDCacheServices = (
  roles: RoleFormItem[],
  serviceForId: (id: number) => { provider_name: string } | undefined,
  mode?: PDMode
): RoleFormItem[] =>
  roles.map((role): RoleFormItem => {
    const cache = role.extended_kv_cache;
    if (cache?.mode !== 'shared' || !cache.cache_service_id) return role;
    const service = serviceForId(cache.cache_service_id);
    if (!service || supportsPDCacheService(service, mode, role.name))
      return role;
    return {
      ...role,
      extended_kv_cache: {
        ...cache,
        enabled: false,
        mode: 'local',
        cache_service_id: undefined
      }
    };
  });

export const supportsPDCacheService = (
  service: { provider_name: string },
  mode?: PDMode,
  role?: string
): boolean => {
  if (mode?.cache_services == null) return true;
  const recipe = mode.cache_services.find(
    (item) => item.provider === service.provider_name
  );
  if (!recipe) {
    return false;
  }
  if (!role) return true;
  return Boolean(recipe.roles?.[role]);
};
