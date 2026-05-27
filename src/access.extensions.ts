// Identity hook for build-time access-predicate extensions. Tooling may
// overwrite this file to widen predicates; the original is restored on
// cleanup. Mirrors `config/routes.extensions.ts`.
export type AccessPredicates = {
  canSeeAdmin: boolean;
  canSeeOrgAdmin: boolean;
  canSeeGpuService: boolean;
  canManageCurrentOrg: boolean;
  canSeeUser: boolean;
  canDelete: boolean;
  canLogin: boolean;
};

export const applyAccessExtensions = <T extends AccessPredicates>(base: T): T =>
  base;
