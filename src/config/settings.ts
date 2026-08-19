export const HEADER_HEIGHT = 0;

export const DEFAULT_ENTER_PAGE = {
  adminForNormal: '/dashboard',
  adminForFirst: '/resources/workers',
  user: '/models/user-models',
  login: '/login'
};

/**
 * Mount path prefix, derived at runtime from the URL the browser actually
 * loaded: `''` when served at the root, `/inner/gpustack` when a reverse proxy
 * mounts GPUStack under a subpath.
 *
 * Derived rather than configured because the UI ships as a prebuilt artifact —
 * the server serves `gpustack/ui/` exactly as downloaded — so there is no
 * per-deployment build to bake a prefix into. One build has to work at any
 * prefix.
 *
 * `pathname` is the whole prefix precisely because the router is `hash`: every
 * in-app route lives after the `#`, so the path part never changes once the
 * page has loaded. Moving to `history` routing would invalidate this and take
 * subpath support with it.
 *
 * Deliberately the opposite choice from core-ui's storage namespace, which is a
 * constant on purpose. The trade-off differs: a wrong prefix there silently
 * switches the app onto a different set of persisted keys, while a wrong prefix
 * here only makes requests 404 — a visible failure rather than silent state
 * divergence.
 */
export const BASE_PATH =
  typeof window === 'undefined'
    ? ''
    : window.location.pathname
        .replace(/\/index\.html$/, '')
        .replace(/\/+$/, '');

/**
 * Absolute, externally reachable root of this GPUStack — the browser's view of
 * the server's `server_external_url`. For URLs *displayed* to the user to copy
 * (OpenAI-compatible `base_url`, worker install commands), which have to be
 * absolute. The app's own requests use `BASE_PATH` instead.
 */
export const EXTERNAL_BASE_URL =
  typeof window === 'undefined' ? '' : `${window.location.origin}${BASE_PATH}`;

export const GPUSTACK_API_BASE_URL = 'v2';
export const OPENAI_COMPATIBLE = 'v1';

type SortDirection = 'ascend' | 'descend' | null;

export const TABLE_SORT_DIRECTIONS: SortDirection[] = [
  'ascend',
  'descend',
  null
];

export const tableSorter = (order: number | boolean) => {
  return true;

  // mutiple sorting can be supported in future

  // if (typeof order === 'number') {
  //   return {
  //     multiple: order
  //   };
  // }
  // return order;
};

export const PaginationKey = {
  Deployments: 'Deployments',
  Workers: 'Workers',
  Clusters: 'Clusters',
  Routes: 'Routes',
  Providers: 'Providers',
  Benchmarks: 'Benchmarks',
  GPUs: 'GPUs',
  ModelFiles: 'ModelFiles',
  Storage: 'Storage',
  Users: 'Users',
  APIKeys: 'APIKeys',
  Credentials: 'Credentials',
  Instances: 'Instances'
};
