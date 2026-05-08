// Identity hook for build-time route extensions. Tooling may overwrite
// this file to inject additional routes; the original is restored on cleanup.
export const applyRouteExtensions = <T>(base: T): T => base;
