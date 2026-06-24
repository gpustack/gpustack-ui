/**
 * Access probes used to gate Kubernetes-only menus (GPU Service / the
 * full Usage page).
 *
 * These live outside `src/app.tsx` because umi treats every export from
 * the runtime-config file as a registration key — exporting helpers from
 * there throws "register failed, invalid key". `getInitialState` (in
 * app.tsx) and the login flow both import from here.
 */
import { queryClusterList } from '@/pages/cluster-management/apis';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { queryResourceEvents } from '@/pages/usage/apis/resource';

// Probes the caller's cluster list once so access predicates can gate
// GPU Service (Kubernetes-only). Cheap (one list request) and never
// blocks login — any failure just falls back to `undefined`, which
// the predicate treats as "unknown / don't restrict beyond role".
// The result is also mirrored into sessionStorage so access extensions
// that run without the initialState argument can read it (e.g. to
// override the admin shortcut in scopes where the menu shouldn't
// show even for admins).
const HAS_K8S_CLUSTER_KEY = 'hasKubernetesCluster';
export const probeHasKubernetesCluster = async (): Promise<
  boolean | undefined
> => {
  try {
    const res = await queryClusterList(
      { page: -1 },
      {
        skipErrorHandler: true
      }
    );
    const value = (res?.items ?? []).some(
      (c) => c?.provider === ProviderValueMap.Kubernetes
    );
    try {
      window.sessionStorage.setItem(HAS_K8S_CLUSTER_KEY, JSON.stringify(value));
    } catch {
      // sessionStorage may be unavailable (Safari private mode); the
      // access predicate already handles a missing value as "unknown".
    }
    return value;
  } catch (error) {
    console.error('probeHasKubernetesCluster error', error);
    try {
      window.sessionStorage.removeItem(HAS_K8S_CLUSTER_KEY);
    } catch {
      // ignore
    }
    return undefined;
  }
};

// Probes whether the caller has ANY resource-usage events (GPU/CPU instance or
// storage lifecycle). Used alongside the cluster probe so a user who has run
// GPU instances still sees GPU Service / the full Usage page even if they
// currently have no Kubernetes cluster. Mirrored into sessionStorage for the
// access extensions; any failure → undefined ("unknown — don't restrict").
const HAS_RESOURCE_EVENTS_KEY = 'hasResourceEvents';
export const probeHasResourceEvents = async (): Promise<
  boolean | undefined
> => {
  try {
    // No date range = "ever"; scope is clamped to the caller server-side.
    const res = await queryResourceEvents(
      { perPage: 1 },
      {
        skipErrorHandler: true
      }
    );
    const value = (res?.pagination?.total ?? 0) > 0;
    try {
      window.sessionStorage.setItem(
        HAS_RESOURCE_EVENTS_KEY,
        JSON.stringify(value)
      );
    } catch {
      // sessionStorage may be unavailable; predicate treats missing as unknown.
    }
    return value;
  } catch (error) {
    console.error('probeHasResourceEvents error', error);
    try {
      window.sessionStorage.removeItem(HAS_RESOURCE_EVENTS_KEY);
    } catch {
      // ignore
    }
    return undefined;
  }
};

// Runs both access probes in parallel. Used after login (when
// `getInitialState` skipped them because the app booted on the login
// page) so the access predicate has definitive cluster / resource-event
// answers before the user navigates — otherwise GPU Service / the full
// Usage page flash on (undefined => "don't restrict") and only collapse
// to the correct set on the next refresh.
export const probeAccessFlags = async (): Promise<{
  hasKubernetesCluster?: boolean;
  hasResourceEvents?: boolean;
}> => {
  const [hasKubernetesCluster, hasResourceEvents] = await Promise.all([
    probeHasKubernetesCluster(),
    probeHasResourceEvents()
  ]);
  return { hasKubernetesCluster, hasResourceEvents };
};

// Module-scoped marker for "did `getInitialState` actually run the access
// probes during THIS page load". It resets to `false` on every full
// reload (the module is re-evaluated) and stays sticky across SPA
// navigations within the same load.
//
// The layout uses it to decide whether it must probe: on a refresh of an
// authenticated page `getInitialState` already probed (marks `true`), so
// the layout skips and avoids a duplicate request; on a first login the
// app booted on `/login` where `getInitialState` skipped probing (stays
// `false`), so the layout is the one that resolves the flags. Keeping
// this in module scope — rather than reading the flag values off
// `initialState` — decouples the decision from React's state-update
// timing, which is what made the earlier flag-gated effect fragile.
let initialStateDidProbe = false;
export const markInitialStateProbed = () => {
  initialStateDidProbe = true;
};
export const didInitialStateProbe = () => initialStateDidProbe;
