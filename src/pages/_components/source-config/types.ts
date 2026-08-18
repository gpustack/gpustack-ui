// Types for the source configuration UI. One endpoint family serves all three
// kinds of content — `/ota-sources/{kind}` for the model catalog, the community
// backend library and the built-in backend versions — so these types are shared
// rather than per-feed.

// The two configurable members of `SourceTypeValueMap` (see `./config`): the
// platform writes `builtin` / `official` itself, so neither is ever sent.
export type SourceType = 'file' | 'url';

// The refresher's per-kind key (`OFFICIAL_KINDS` in the backend). Also the
// stable id a scope's slot binds its probe status to.
export type SourceProbeKind =
  | 'catalog'
  | 'community_backend'
  | 'built_in_backend';

// The admin's own source. Setting one *replaces* both the packaged baseline
// and the official slot — the layers never stack — so this is the whole content
// for its kind. `content` is the stored, normalized text, kept so a saved FILE
// source can be edited again (there is no URL to re-fetch it from).
export interface CustomSourceState {
  source_type: SourceType;
  url?: string | null;
  content?: string | null;
  // Auto-refresh cadence in hours (0 = off); only a URL source can opt in.
  auto_update_hours: number;
  // A URL is fetched at save / reload time — when that content was taken.
  updated_at?: string | null;
  content_hash?: string | null;
}

// The platform's remote slot. Its content is written by the refresh task, so
// the cadence is the only part an admin sets; the rest is state shown beside it.
export interface OfficialSourceState {
  // 0 = official updates are off for this kind.
  auto_update_hours: number;
  // Derived, not a setting: false while a custom source replaces the slot, or
  // while remote content is out of service (`remote_enabled`).
  enabled: boolean;
  updated_at?: string | null;
  content_hash?: string | null;
}

// GET /ota-sources/{kind}. One object carries a kind's whole configuration, so
// the screen loads it in one request. `custom: null` means the official source
// serves the content; `remote_enabled: false` means neither does — the packaged
// baseline serves on its own, with both sources parked for the way back.
export interface SourceConfig {
  remote_enabled: boolean;
  custom?: CustomSourceState | null;
  official: OfficialSourceState;
}

export interface CustomSourceUpsert {
  source_type: SourceType;
  content?: string | null;
  url?: string | null;
  auto_update_hours: number;
}

// PUT /ota-sources/{kind}. A full replacement of the configuration, so the
// screen saves it in one request: `custom: null` *is* the switch back to the
// official source, and a URL is fetched server-side here, which makes saving a
// re-sync.
export interface SourceConfigUpsert {
  // False takes remote content out of service without discarding it: a
  // configured source is parked rather than deleted, and parking never
  // re-reads a URL — the fall-back has to work when that URL is the problem.
  remote_enabled: boolean;
  custom: CustomSourceUpsert | null;
  // The server accepts nothing but the cadence here (`extra="forbid"`): the
  // official content, its URL and its hashes belong to the refresh task.
  official: { auto_update_hours: number };
}

// PUT / POST reload. `changed` is false when the new text hashed the same as
// the stored one: nothing was written and no reconcile ran.
export interface SourceWriteResult extends SourceConfig {
  changed: boolean;
}

// GET /source-probe → `kinds[kind]`: the *active* remote source of a kind (the
// custom row when it masks OFFICIAL, else the OFFICIAL slot). This is the only
// place the leader-only state lives — the resolved ref and the last refresh
// error.
export interface SourceKindStatus {
  source_type?: string | null;
  url?: string | null;
  official_masked: boolean;
  // Whether any remote layer serves this kind. False is the fall-back state: the
  // packaged baseline alone, with the sources parked.
  remote_enabled: boolean;
  auto_update_hours: number;
  // The file this kind is published as on the OTA server. Joined onto
  // `ota_server_url` it links straight at the official file — the starting point for a
  // custom source, which replaces exactly that file. Reported whichever
  // source is active, so the link is there while a custom source is configured.
  filename: string;
  remote_hash?: string | null;
  content_hash?: string | null;
  updated_at?: string | null;
  // The last refresh failure, kept while the stored content is still served.
  // Populated only on the leader.
  error?: string | null;
}

export interface SourceProbeStatus {
  // The directory the official files are published under, after any server-side
  // OTA server override. Join it with a kind's `filename` to download.
  ota_server_url: string;
  // The round-level fields (`error`, `refreshed_at`) are populated only on the
  // server that runs the refresher; a standby reports the DB-backed fields only.
  refreshing_on_this_server: boolean;
  refreshed_at?: string | null;
  kinds: Partial<Record<SourceProbeKind, SourceKindStatus>>;
}

// One kind of content the drawer can configure. A scope has one slot (catalog)
// or two (the backend drawer stacks the built-in and community sources as
// independently expandable panels).
export interface SourceSlotConfig {
  // Probe kind, panel key, and the path segment its own endpoints sit under —
  // which is why a slot needs no API wiring of its own.
  kind: SourceProbeKind;
  // Panel header. Only a multi-slot scope needs one — a single-slot scope is
  // already named by the drawer title.
  titleKey?: string;
  // Whether this slot accepts an inline FILE (catalog only) — the third card in
  // its row; URL-only slots show two.
  allowFile: boolean;
  // What this kind's official source follows, shown as the hint beside the
  // input — leaving that input empty is what follows it.
  officialDescriptionKey: string;
  // Commented YAML seeded into the editor when a FILE slot has no content yet.
  contentTemplate?: string;
}

// Per-scope wiring: the drawer title, its slots, and the shared probe endpoint.
export interface SourceScopeConfig {
  // Drawer title, e.g. "Backend Source".
  titleKey: string;
  slots: SourceSlotConfig[];
  // GET /source-probe. Shared across scopes: one call reports every kind.
  probe: () => Promise<SourceProbeStatus>;
}
