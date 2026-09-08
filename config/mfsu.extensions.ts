// Identity hook for build-time mfsu extensions. Tooling may overwrite
// this file to add package names that must skip MFSU's pre-bundling or
// be forced into it; the original is restored on cleanup. Mirrors
// `src/request.extensions.ts` / `src/access.extensions.ts`.
//
// MFSU bundles node_modules into immutable chunks at dev startup, so
// workspace-linked packages whose source you edit during dev must be
// excluded here or HMR won't pick up changes.
export const extraMfsuExclude: string[] = [];

// Packages MFSU can't discover on its own because nothing in `src`
// imports them (it finds deps by statically analyzing `src`). Without
// an entry here such a package is compiled into the host bundle rather
// than the pre-bundle, which duplicates React for anything that uses
// hooks.
export const extraMfsuInclude: string[] = [];
