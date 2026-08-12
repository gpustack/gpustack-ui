export interface UsageFilterItem {
  identity: {
    value: {
      cluster_name: string;
      user_name: string;
      api_key_name: string | null;
      access_key: string | null;
      api_key_is_custom: boolean | null;
      provider_type: string | null;
      provider_name: string | null;
      route_name: string | null;
      // Resolved live from principals (platform-wide "All" view only).
      organization_name?: string | null;
      group_name?: string | null;
    };
    current: {
      user_id: number | null;
      api_key_id: string | null;
      route_id: number | null;
      organization_id?: number | null;
      group_id?: number | null;
    };
  };
  label: string;
  deleted: boolean;
}

export interface TimeSeriesSummary {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  api_requests: number;
  models_called: number;
}

export interface TimeLineItem {
  date: string;
  value: number;
}

export type TimeSeriesItem = UsageFilterItem & {
  timeline: TimeLineItem[];
};

export interface TimeSeriesData {
  summary: TimeSeriesSummary;
  metric: 'string';
  group_by: 'string';
  granularity: 'string';
  series: TimeSeriesItem[];
}

export type BreakdownItem = {
  cluster_name: string;
  user_name: string;
  api_key_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  api_requests: number;
  input_cached_tokens: number;
  avg_tokens_per_request: number;
  models_called: number;
  api_keys_used: number;
  last_active: string;
  provider_type: string;
  provider_name: string;
  user: UsageFilterItem;
  model: UsageFilterItem;
  route: UsageFilterItem;
  api_key: UsageFilterItem;
  organization: UsageFilterItem;
  date: {
    value: string;
    label: string;
  };
};

export interface UsageBreakdownResponse {
  summary: TimeSeriesSummary;
  group_by: string[];
  granularity: string;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  };
  items: BreakdownItem[];
}

export interface UsageMeta {
  filters: {
    users: UsageFilterItem[];
    api_keys: UsageFilterItem[];
    routes: UsageFilterItem[];
    // Platform-wide "All" view only; empty otherwise (backend-gated).
    organizations?: UsageFilterItem[];
    user_groups?: UsageFilterItem[];
  };
}

export type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;

// The full breakdown filter set (route / user / api_key + org / user_group).
// Every breakdown table sends all active dimensions — matching the trend
// chart — so e.g. a user filter narrows the Models table too, not only the
// Users table. ``organizations`` / ``user_groups`` are only ever populated in
// the platform-wide "All" view (their filter options are backend-gated).
export type BreakdownFilters = {
  routes?: FilterOptionType[];
  users?: FilterOptionType[];
  api_keys?: FilterOptionType[];
  organizations?: FilterOptionType[];
  user_groups?: FilterOptionType[];
};

// One logical table in an export. A sheet is an INDEPENDENT breakdown query,
// not another dimension on a shared one — which is why the number of tables
// can never be read off `group_by`'s length (`group_by` is a compound
// grouping; the chart export is a single table grouped by four dimensions).
export type UsageExportSheet = {
  // Stable machine key: names the CSV member (`by_<key>.csv`) and is what
  // downstream scripts match on. Never the localized display name.
  key: string;
  group_by: string[];
  name?: string;
  sort_by?: string;
};

export type UsageExportRequest = {
  start_date: string;
  end_date: string;
  scope: string;
  filters: BreakdownFilters;
  granularity?: string;
  sort_by?: string;
  format?: 'csv' | 'xlsx';
  // Exactly one of these: `group_by` for a single table, `sheets` for several.
  group_by?: string[];
  sheets?: UsageExportSheet[];
};

// One exported column: `key` is what the preview reads a value by, `title` is
// the header the file will carry. Both come from the server so the preview
// renders exactly the file's column set without re-deriving it.
export type UsageExportColumn = {
  key: string;
  title: string;
};

export type UsageExportSheetEstimate = {
  key: string;
  name?: string;
  total: number;
  columns?: UsageExportColumn[];
  // False when the caller may not run this sheet (e.g. the Organization
  // breakdown outside the platform-wide view) — reported per sheet so the UI
  // can grey out one table instead of blocking the whole dialog.
  available: boolean;
  reason?: string;
};

export type UsageExportEstimate = {
  sheets: UsageExportSheetEstimate[];
  total: number;
  // Server-side thresholds, echoed for the messages that quote a number.
  soft_limit: number;
  hard_limit: number;
  // The verdicts themselves. `total` is the SUM over sheets — the row count of
  // the whole file, right for display — but the limits are enforced PER SHEET.
  // Comparing `total` against `hard_limit` refused four 30k-row tables that the
  // export endpoint accepts, so the decision is the server's, not ours.
  exceeds_soft_limit: boolean;
  exceeds_hard_limit: boolean;
  // Only set when over the limit. Computed server-side by the same helper the
  // rejection error uses, so the hint before the click and the message after
  // one can't give conflicting advice.
  suggested_max_days?: number;
  // The same remedies the rejection error carries, offered up front so the
  // dialog can render them as one-click actions.
  suggestions?: UsageExportErrorDetails['suggestions'];
  // Files a split export would produce; absent when the result fits. Parts
  // are slices of the row stream, so this is exact — `ceil(total / limit)` —
  // and every grouping can be split.
  split_parts?: number;
  // The format the export will actually produce — differs from the requested
  // one when the result cannot fit an Excel worksheet.
  effective_format?: 'csv' | 'xlsx';
};

// Structured payload on an over-limit / unsupported-format error, carried in
// `ErrorResponse.details`. The suggestions are what make the error actionable
// — "narrow the range" alone is true and useless.
export type UsageExportErrorDetails = {
  // The kinds the server actually emits. `string` keeps a future one from
  // failing to typecheck — it falls back to the server's own message rather
  // than being dropped (see describeExportError).
  kind: 'export_too_large' | 'export_split_too_many_parts' | string;
  sheet?: string;
  total: number;
  limit: number;
  suggestions?: {
    action: 'shorten_range' | 'split_export' | string;
    max_days?: number;
    parts?: number;
  }[];
};
