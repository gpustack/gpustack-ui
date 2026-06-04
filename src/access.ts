import { applyAccessExtensions } from './access.extensions';

export default (initialState: {
  currentUser?: Global.UserInfo;
  hasKubernetesCluster?: boolean;
  hasResourceEvents?: boolean;
}) => {
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
  // GPU Service is Kubernetes-only. We only gate visibility down when
  // the probe in `getInitialState` came back with a definitive answer;
  // `undefined` (probe failed / not yet ready) collapses to the
  // role-based default so a transient network blip can't lock anyone
  // out of the menu.
  const hasKubernetesCluster = initialState?.hasKubernetesCluster;
  // Having run GPU/CPU instances or storage (any resource_events) also unlocks
  // GPU Service / the full Usage page — a user who used it keeps seeing it even
  // without a current cluster. MaaS-only users (no cluster, no events) don't.
  const hasResourceEvents = !!initialState?.hasResourceEvents;

  // Predicate roles, top-down by strictness:
  //   * `canSeeAdmin` — strictly platform admin (`users.is_admin`).
  //     Gates Users.
  //   * `canSeeOrgAdmin` — admin-style menus that work cross-org
  //     (Dashboard, Resources, Models, Cluster Management). Defaults
  //     to platform admin; extensions widen to include org admins.
  //   * `canSeeGpuService` — GPU Service menu. Anyone allowed to
  //     manage clusters (admins, Org owners) sees it; non-admins fall
  //     through to "show only if a Kubernetes cluster is actually
  //     reachable" so Org members without scheduling access don't see
  //     a dead-end menu item.
  //   * `canManageCurrentOrg` — pages that only make sense inside a
  //     specific org context (member / group management). Defaults to
  //     `false`; extensions widen when both an org is selected AND
  //     the caller is admin of it.
  // Pass through `applyAccessExtensions` so build-time tooling can
  // widen these without editing this file. Default is a no-op.
  return applyAccessExtensions({
    canSeeAdmin: isPlatformAdmin,
    canSeeOrgAdmin: isPlatformAdmin,
    canSeeGpuService:
      isPlatformAdmin || hasKubernetesCluster !== false || hasResourceEvents,
    canManageCurrentOrg: false,
    canSeeUser,
    canDelete: true,
    canLogin: true
  });
};
