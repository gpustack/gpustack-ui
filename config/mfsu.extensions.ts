// Identity hook for build-time mfsu.exclude extensions. Tooling may
// overwrite this file to add package names that must skip MFSU's
// pre-bundling; the original is restored on cleanup. Mirrors
// `src/request.extensions.ts` / `src/access.extensions.ts`.
//
// MFSU bundles node_modules into immutable chunks at dev startup, so
// workspace-linked packages whose source you edit during dev must be
// excluded here or HMR won't pick up changes.
export const extraMfsuExclude: string[] = [];
