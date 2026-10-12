# Agent Instructions

**Read [`CLAUDE.md`](./CLAUDE.md) for general agent/contributor conventions and follow the additional project-specific conventions below.**

@CLAUDE.md

## Test organization

- Preserve existing test locations until those tests are next maintained. Migrate incrementally; do not perform a repository-wide move solely to normalize the layout.
- For future additions, place new tests in the owning directory's `__tests__/`, for example `src/pages/llmodels/forms/__tests__/` or `scripts/__tests__/`.
- When maintaining an existing test, move only the affected file into the corresponding `__tests__/`. Update relative imports, mock paths, path calculations, and documented commands in the same change.
- Move files instead of leaving duplicate copies. Recursive discovery supports both layouts throughout the transition.
- Keep the existing `*.test.ts`, `*.test.tsx`, `*.test.mts`, or `*.test.mjs` naming. Use `*.test.mts` for tests that need `node:test` module mocks.
