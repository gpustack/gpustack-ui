import { applyAccessExtensions } from './access.extensions';

export default (initialState: { currentUser?: Global.UserInfo }) => {
  const isPlatformAdmin = !!(
    initialState &&
    initialState.currentUser &&
    initialState.currentUser.is_admin
  );
  const canSeeUser = !!(
    initialState &&
    initialState.currentUser &&
    !initialState.currentUser.is_admin
  );

  // Predicate roles, top-down by strictness:
  //   * `canSeeAdmin` — strictly platform admin (`users.is_admin`).
  //     Gates Users.
  //   * `canSeeOrgAdmin` — admin-style menus that work cross-org
  //     (Dashboard, Resources, Models, Cluster Management). Defaults
  //     to platform admin; extensions widen to include org admins.
  //   * `canManageCurrentOrg` — pages that only make sense inside a
  //     specific org context (member / group management). Defaults to
  //     `false`; extensions widen when both an org is selected AND
  //     the caller is admin of it.
  // Pass through `applyAccessExtensions` so build-time tooling can
  // widen these without editing this file. Default is a no-op.
  return applyAccessExtensions({
    canSeeAdmin: isPlatformAdmin,
    canSeeOrgAdmin: isPlatformAdmin,
    canManageCurrentOrg: false,
    canSeeUser,
    canDelete: true,
    canLogin: true
  });
};
