/**
 * Resource Usage API client — adapter over the unified ``metered_usage``
 * read API (``/usage/{resource,gpu-instances,storage,summary,events}``).
 *
 * The server returns a generic ``{ key, id, metrics:{...} }`` breakdown shape
 * (one engine for every tab). This module flattens it into the per-tab item
 * shape the components consume, maps the frontend ``group_by`` vocabulary onto
 * the backend's (``gpu_type`` → ``instance_type``/sku), and derives the few
 * convenience fields (``gpu_minutes``). Metrics the backend doesn't track
 * (cpu/memory/ephemeral hours, dangling volumes) are left at 0 — the
 * whole-machine SKU model meters runtime, not decomposed components.
 */
import { request } from '@umijs/max';

export interface ResourceUsageFilters {
  creator_ids?: number[];
  cluster_ids?: number[];
  instance_ids?: number[];
  gpu_types?: string[];
  volume_ids?: number[];
}

export interface ResourceBreakdownRequest {
  start_date: string;
  end_date: string;
  scope?: 'self' | 'all';
  filters?: ResourceUsageFilters;
  group_by?:
    | 'date'
    | 'resource_type'
    | 'gpu_type'
    | 'type'
    | 'instance'
    | 'user'
    | 'volume'
    | null;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  // Server-side sort: a metric key (e.g. gpu_hours / instance_hours) +
  // direction. Defaults on the server when omitted.
  order_by?: string;
  descending?: boolean;
  page?: number;
  perPage?: number;
}

export interface ResourceBreakdownSummary {
  gpu_hours: number;
  gpu_minutes: number;
  instance_hours: number;
  cpu_hours: number;
  memory_gb_hours: number;
  ephemeral_gb_hours: number;
  active_instances: number;
  gpu_types_used: number;
  active_users: number;
  storage_gb_days: number;
  storage_gb_hours: number;
  active_volumes: number;
  dangling_volumes: number;
}

export interface ResourceBreakdownItem extends ResourceBreakdownSummary {
  date?: string;
  resource_type?: string;
  gpu_type?: string;
  instance_id?: number;
  instance_name?: string;
  volume_id?: number;
  volume_name?: string;
  user_id?: number;
  user_name?: string;
  last_active?: string;
  // Instance-type rows carry the flavor's display fields (pretty product name +
  // per-card specs) so the UI matches the GPU Instances list.
  product?: string;
  unit_cpu_milli?: number;
  unit_memory_mib?: number;
  vram_mib?: number;
  // Per-instance rows also carry the card count + ephemeral disk so the
  // Instances table can render "<product> x <count>" + the spec popover.
  gpu_count?: number;
  ephemeral_mib?: number;
  local_storage_mib?: number;
  persistent_mib?: number;
  // Storage volume rows: provisioned capacity + storage type.
  storage_type?: string;
  capacity_mib?: number;
}

export interface ResourceBreakdownResponse {
  summary: ResourceBreakdownSummary;
  group_by?: string;
  granularity?: string;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  };
  items: ResourceBreakdownItem[];
}

export interface UsageOption {
  key: string;
  label: string;
}

export interface ResourceUsageFilterOption {
  id: number;
  label: string;
}

export interface ResourceUsageMetaResponse {
  metrics: UsageOption[];
  granularities: UsageOption[];
  group_bys: UsageOption[];
  filters: {
    creators?: ResourceUsageFilterOption[];
    clusters?: ResourceUsageFilterOption[];
    instances?: ResourceUsageFilterOption[];
    gpu_types?: UsageOption[];
    volumes?: ResourceUsageFilterOption[];
  };
}

export interface ResourceEventItem {
  id: number;
  occurred_at: string;
  creator_id?: number;
  creator_name?: string;
  cluster_id?: number;
  cluster_name?: string;
  resource_type: string;
  resource_id?: number;
  resource_name: string;
  event_type: string;
  event_message?: string;
  phase?: string;
  // status.phaseMessage at event time — the detail behind a failure phase.
  phase_message?: string;
}

export interface ResourceEventsResponse {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  };
  items: ResourceEventItem[];
}

export interface SummaryResourceDistributionItem {
  label: string;
  value: number;
  percentage: number;
}

export interface UsageSummaryResponse {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  token_active_users: number;
  gpu_hours: number;
  instance_hours: number;
  active_instances: number;
  storage_gb_days: number;
  active_users: number;
  distribution: SummaryResourceDistributionItem[];
}

// --- endpoints -----------------------------------------------------------

const URL = {
  RESOURCE_BREAKDOWN: '/usage/resource/breakdown',
  GPU_BREAKDOWN: '/usage/gpu-instances/breakdown',
  STORAGE_BREAKDOWN: '/usage/storage/breakdown',
  EVENTS: '/usage/resource-events',
  SUMMARY: '/usage/summary',
  RESOURCE_META: '/usage/resource/meta'
};

// --- server (generic) shapes ---------------------------------------------

interface ServerMetrics {
  instance_hours?: number;
  gpu_hours?: number;
  gb_days?: number;
  gb_hours?: number;
  resources?: number;
  active_users?: number;
  last_active?: string;
}

// gpu_type / type both mean the sku (Type) on the server.

interface ServerBreakdownItem {
  key?: string | null;
  id?: number | null;
  date?: string | null;
  sku?: string | null;
  deleted?: boolean | null;
  dimensions?: {
    product?: string | null;
    unit_cpu_milli?: number | null;
    unit_memory_mib?: number | null;
    vram_mib?: number | null;
    gpu_count?: number | null;
    ephemeral_mib?: number | null;
    local_storage_mib?: number | null;
    persistent_mib?: number | null;
    storage_type?: string | null;
    capacity_mib?: number | null;
  } | null;
  metrics: ServerMetrics;
}

interface ServerBreakdownResponse {
  summary: ServerMetrics;
  group_by?: string;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  };
  items: ServerBreakdownItem[];
}

// --- transforms ----------------------------------------------------------

// Frontend group_by vocabulary → backend. "gpu_type" / "type" both mean the
// sku (Type / flavor) on the server.
const GROUP_BY_MAP: Record<string, string> = {
  resource_type: 'resource_type',
  gpu_type: 'instance_type',
  type: 'type',
  instance: 'instance',
  volume: 'volume',
  user: 'user',
  date: 'date'
};

const num = (v?: number) => Number(v ?? 0);

function flattenMetrics(m: ServerMetrics): ResourceBreakdownSummary {
  const gpuHours = num(m.gpu_hours);
  return {
    gpu_hours: gpuHours,
    gpu_minutes: gpuHours * 60,
    instance_hours: num(m.instance_hours),
    // not metered under the whole-machine SKU model → 0
    cpu_hours: 0,
    memory_gb_hours: 0,
    ephemeral_gb_hours: 0,
    active_instances: num(m.resources),
    gpu_types_used: 0,
    active_users: num(m.active_users),
    storage_gb_days: num(m.gb_days),
    storage_gb_hours: num(m.gb_hours),
    active_volumes: num(m.resources),
    dangling_volumes: 0
  };
}

function flattenItem(
  groupBy: string | null | undefined,
  it: ServerBreakdownItem
): ResourceBreakdownItem {
  const flat: ResourceBreakdownItem = {
    ...flattenMetrics(it.metrics || {}),
    last_active: it.metrics?.last_active ?? undefined
  };
  if (it.date) flat.date = it.date;
  const id = it.id ?? undefined;
  // Deleted entities get a "(Deleted)" suffix, matching the Token breakdown.
  const rawKey = it.key ?? undefined;
  const key = it.deleted && rawKey != null ? `${rawKey} (Deleted)` : rawKey;
  switch (groupBy) {
    case 'resource_type':
      flat.resource_type = key;
      break;
    case 'gpu_type':
    case 'type':
      flat.gpu_type = key;
      break;
    case 'instance':
      flat.instance_name = key;
      flat.instance_id = id;
      break;
    case 'volume':
      flat.volume_name = key;
      flat.volume_id = id;
      break;
    case 'user':
      flat.user_name = key;
      flat.user_id = id;
      break;
    default:
      break;
  }
  // Per-resource rows (instance / volume) carry their sku → surface it as the
  // Instance Type / Type column when not already the group key.
  if (!flat.gpu_type && it.sku) {
    flat.gpu_type = it.sku ?? undefined;
  }
  // Instance-type rows carry flavor display fields (pretty product + per-card
  // specs) so the UI can render them like the GPU Instances list.
  const dims = it.dimensions;
  if (dims) {
    if (dims.product) flat.product = dims.product;
    if (dims.unit_cpu_milli != null) flat.unit_cpu_milli = dims.unit_cpu_milli;
    if (dims.unit_memory_mib != null)
      flat.unit_memory_mib = dims.unit_memory_mib;
    if (dims.vram_mib != null) flat.vram_mib = dims.vram_mib;
    if (dims.gpu_count != null) flat.gpu_count = dims.gpu_count;
    if (dims.ephemeral_mib != null) flat.ephemeral_mib = dims.ephemeral_mib;
    if (dims.local_storage_mib != null)
      flat.local_storage_mib = dims.local_storage_mib;
    if (dims.persistent_mib != null) flat.persistent_mib = dims.persistent_mib;
    if (dims.storage_type) flat.storage_type = dims.storage_type;
    if (dims.capacity_mib != null) flat.capacity_mib = dims.capacity_mib;
  }
  return flat;
}

function flattenResponse(
  groupBy: string | null | undefined,
  res: ServerBreakdownResponse
): ResourceBreakdownResponse {
  return {
    summary: flattenMetrics(res.summary || {}),
    group_by: res.group_by,
    pagination: res.pagination,
    items: (res.items || []).map((it) => flattenItem(groupBy, it))
  };
}

function toServerRequest(data: ResourceBreakdownRequest) {
  const groupBy = data.group_by ?? 'resource_type';
  const { creator_ids, instance_ids, volume_ids } = data.filters ?? {};
  return {
    body: {
      start_date: data.start_date,
      end_date: data.end_date,
      scope: data.scope ?? 'all',
      group_by: GROUP_BY_MAP[groupBy] ?? groupBy,
      granularity: data.granularity ?? 'day',
      // POST endpoints take proper id arrays. "filter by user" + "filter by
      // resource" (instance ids on the GPU tab / volume ids on Storage).
      ...(creator_ids?.length ? { creator_ids } : {}),
      ...(instance_ids?.length ? { instance_ids } : {}),
      ...(volume_ids?.length ? { volume_ids } : {}),
      ...(data.order_by ? { order_by: data.order_by } : {}),
      ...(data.descending !== undefined ? { descending: data.descending } : {}),
      page: data.page ?? 1,
      perPage: data.perPage ?? 20
    },
    groupBy
  };
}

// --- request helpers -----------------------------------------------------

async function _breakdown(
  url: string,
  data: ResourceBreakdownRequest
): Promise<ResourceBreakdownResponse> {
  const { body, groupBy } = toServerRequest(data);
  const res = await request<ServerBreakdownResponse>(url, {
    data: body,
    method: 'POST'
  });
  return flattenResponse(groupBy, res);
}

export async function queryResourceBreakdown(
  data: ResourceBreakdownRequest
): Promise<ResourceBreakdownResponse> {
  return _breakdown(URL.RESOURCE_BREAKDOWN, data);
}

export async function queryGpuInstancesBreakdown(
  data: ResourceBreakdownRequest
): Promise<ResourceBreakdownResponse> {
  return _breakdown(URL.GPU_BREAKDOWN, data);
}

export async function queryStorageBreakdown(
  data: ResourceBreakdownRequest
): Promise<ResourceBreakdownResponse> {
  return _breakdown(URL.STORAGE_BREAKDOWN, data);
}

export async function queryResourceEvents(data: {
  start_date?: string;
  end_date?: string;
  scope?: 'self' | 'all';
  filters?: ResourceUsageFilters;
  resource_types?: string[];
  event_types?: string[];
  page?: number;
  perPage?: number;
}): Promise<ResourceEventsResponse> {
  const creatorIds = data.filters?.creator_ids;
  return request<ResourceEventsResponse>(URL.EVENTS, {
    params: {
      start_date: data.start_date,
      end_date: data.end_date,
      scope: data.scope ?? 'all',
      resource_type: data.resource_types?.[0],
      // GET endpoints take creator_ids as a CSV string (avoids axios array
      // serialization quirks); the server splits it back into a list.
      ...(creatorIds?.length ? { creator_ids: creatorIds.join(',') } : {}),
      page: data.page ?? 1,
      perPage: data.perPage ?? 50
    },
    method: 'GET'
  });
}

export interface ResourceFilterOption {
  id: number;
  label: string;
  deleted?: boolean;
}

export interface ResourceFilterMeta {
  creators: ResourceFilterOption[];
  instances: ResourceFilterOption[];
  volumes: ResourceFilterOption[];
}

export async function queryResourceFilterMeta(
  scope: 'self' | 'all' = 'all'
): Promise<ResourceFilterMeta> {
  const res = await request<Partial<ResourceFilterMeta>>(URL.RESOURCE_META, {
    params: { scope },
    method: 'GET'
  });
  return {
    creators: res.creators || [],
    instances: res.instances || [],
    volumes: res.volumes || []
  };
}

export async function queryUsageSummary(params: {
  start_date: string;
  end_date: string;
  scope?: 'self' | 'all';
  creator_ids?: number[];
}): Promise<UsageSummaryResponse> {
  const { creator_ids, ...rest } = params;
  const res = await request<{
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    token_active_users: number;
    gpu_hours: number;
    instance_hours: number;
    storage_gb_days: number;
    active_users: number;
  }>(URL.SUMMARY, {
    params: {
      ...rest,
      scope: params.scope ?? 'all',
      ...(creator_ids?.length ? { creator_ids: creator_ids.join(',') } : {})
    },
    method: 'GET'
  });

  // Resource Distribution donut — by GPU type, using GPU-Hours (a single,
  // well-defined unit). Built from the GPU-instances breakdown grouped by
  // instance type. (A true cross-resource split needs a common unit.)
  let distribution: SummaryResourceDistributionItem[] = [];
  try {
    const byType = await queryGpuInstancesBreakdown({
      start_date: params.start_date,
      end_date: params.end_date,
      scope: params.scope ?? 'all',
      group_by: 'gpu_type',
      ...(creator_ids?.length ? { filters: { creator_ids } } : {}),
      page: 1,
      perPage: 100
    });
    const total = byType.items.reduce((s, i) => s + (i.gpu_hours || 0), 0);
    distribution = byType.items
      .filter((i) => (i.gpu_hours || 0) > 0)
      .map((i) => ({
        // Pretty product name (e.g. "NVIDIA-GeForce-RTX-5090-D") when known,
        // else the raw flavor slug — matches the GPU Instances list.
        label: i.product || i.gpu_type || 'unknown',
        value: i.gpu_hours,
        percentage: total > 0 ? (i.gpu_hours / total) * 100 : 0
      }));
  } catch {
    distribution = [];
  }

  return {
    total_tokens: num(res.total_tokens),
    input_tokens: num(res.input_tokens),
    output_tokens: num(res.output_tokens),
    token_active_users: num(res.token_active_users),
    gpu_hours: num(res.gpu_hours),
    instance_hours: num(res.instance_hours),
    active_instances: 0,
    storage_gb_days: num(res.storage_gb_days),
    active_users: num(res.active_users),
    distribution
  };
}

// Meta is synthesized client-side — the components hardcode their metric /
// group_by options and don't call these, but keep them for any external
// importers. Filter dropdowns are empty until a meta endpoint lands.
const STATIC_META: ResourceUsageMetaResponse = {
  metrics: [],
  granularities: [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' }
  ],
  group_bys: [],
  filters: {}
};

export async function queryResourceMeta(): Promise<ResourceUsageMetaResponse> {
  return STATIC_META;
}
export async function queryGpuInstancesMeta(): Promise<ResourceUsageMetaResponse> {
  return STATIC_META;
}
export async function queryStorageMeta(): Promise<ResourceUsageMetaResponse> {
  return STATIC_META;
}
