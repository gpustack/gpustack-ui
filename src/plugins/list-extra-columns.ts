import { useMemo, useRef } from 'react';
import { getGPUStackPlugin } from './index';

// Generic per-page "extra columns" seam. Each list page (Models,
// Model Routes, Clusters, etc.) reads its own slot keyed by a stable
// page id and splices the returned columns into its column array.
// Plugins that aren't loaded — or that don't register a slot for the
// page — produce an empty list, so the host stays unchanged.
export type PluginListColumn = {
  key: string;
  // i18n message id used as the column title.
  titleId: string;
  // Optional SealTable grid span; antd-`Table` consumers ignore it.
  span?: number;
  // Where in the existing column order the entry lands. `after-name`
  // (the default) is the natural slot for identifying columns like
  // "Organization" that read alongside the row's name; the other two
  // are kept for back-compat with the per-page slots that predate
  // this generic seam (`modelRoutes.extraColumns` uses them for the
  // quota-default cell). Each page's hook decides which placements
  // it honors.
  placement?: 'after-name' | 'before-operation' | 'before-time';
  render: (record: any) => React.ReactNode;
};

// Plugins may register either a static array OR a function returning
// one. The function form lets the plugin use React hooks (e.g. to
// read jotai atoms for visibility) since the host calls it inside its
// own `useMemo`-wrapping hook below. The function must obey the rules
// of hooks — call the same hooks in the same order each render and
// short-circuit to `[]` rather than skipping hook calls when hidden.
export type PluginListColumnsEntry =
  | PluginListColumn[]
  | (() => PluginListColumn[]);

const readEntry = (pageKey: string): PluginListColumnsEntry | undefined => {
  const slots = getGPUStackPlugin()?.listExtraColumns as
    | Record<string, PluginListColumnsEntry>
    | undefined;
  return slots?.[pageKey];
};

// Host hook: each list page's columns hook calls this once with its
// page key. Returns `[]` when no plugin / no slot. The function-form
// entry is always called when present so its inner hooks run the same
// number of times every render — visibility logic must live inside
// the entry's return value, not around the call.
export const usePluginListColumns = (pageKey: string): PluginListColumn[] => {
  const entry = readEntry(pageKey);
  // `entry` is read once per render from a registry wired at boot, so
  // its identity is stable across renders. The function form is
  // invoked unconditionally so the same hooks run in the same order
  // every render — visibility logic must live in the entry's return
  // value, not around the call.
  const fromFn = typeof entry === 'function' ? entry() : null;
  // Belt-and-suspenders stability: if the plugin's hook returns an
  // array with the same elements but a fresh outer reference (it can
  // happen even when the plugin author tried to memoize), pin it to
  // the previous reference so downstream `useMemo`s in every list
  // page don't re-fire and rebuild their `columns` arrays. Cheap
  // shallow check by length + element identity — same shape every
  // call site already promises through the schema.
  const prevRef = useRef<PluginListColumn[] | null>(null);
  const stableFromFn = useMemo(() => {
    if (!fromFn) return null;
    const prev = prevRef.current;
    if (
      prev &&
      prev.length === fromFn.length &&
      prev.every((col, i) => col === fromFn[i])
    ) {
      return prev;
    }
    prevRef.current = fromFn;
    return fromFn;
  }, [fromFn]);
  return useMemo(() => {
    if (!entry) return [];
    if (typeof entry === 'function') return stableFromFn ?? [];
    return entry;
  }, [entry, stableFromFn]);
};
