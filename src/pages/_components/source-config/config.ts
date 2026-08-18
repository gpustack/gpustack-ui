// Runtime values for the source configuration UI. Split from `types.ts` so the
// two consumers that only ask "did this record come from a custom source?"
// (the catalog card and the backend select) pull in a constant instead of the
// drawer's module graph.

// Where a source's content comes from. `builtin` / `official` are written by
// the platform itself (the packaged baseline and the official refresh task) and
// never appear in a request body — only `file` and `url` are configurable.
export const SourceTypeValueMap = {
  BUILTIN: 'builtin',
  OFFICIAL: 'official',
  FILE: 'file',
  URL: 'url'
} as const;

// Whether a materialized record came from an admin-configured source rather
// than from the packaged baseline or the official refresh.
export const isCustomSourceType = (type?: string | null) =>
  type === SourceTypeValueMap.FILE || type === SourceTypeValueMap.URL;
