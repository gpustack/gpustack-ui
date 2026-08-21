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
import { getIntl, request } from '@umijs/max';
import { withDeletedMark } from '../utils/deleted-label';
import { instanceTypeSeriesLabel } from '../utils/format-instance-type';

export interface ResourceUsageFilters {
  creator_ids?: number[];
  cluster_ids?: number[];
  instance_ids?: number[];
  gpu_types?: string[];
  volume_ids?: number[];
  // Platform-wide "All" view only (backend-gated): consumer-Org ids and
  // user-group ids (expanded server-side to the groups' direct members).
  organization_ids?: number[];
  user_group_ids?: number[];
}

export interface ResourceBreakdownRequest {
  start_date: string;
  end_date: string;
  scope?: 'self' | 'all';
  filters?: ResourceUsageFilters;
  // One or more grouping dimensions, combined left-to-right (mirrors the token
  // usage API). A trend uses ['date', '<dim>']; a table uses ['<dim>'].
  group_by?: string[];
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
  // Uptime x sku_count — the quantity an invoice multiplies by the unit price.
  //
  // It exists because the other two cannot describe a CPU instance's cost:
  // ``instance_hours`` is unweighted wall clock and ``gpu_hours`` is 0 for a CPU
  // row, so a 4-unit instance used to look identical to a 1-unit one (or even
  // smaller, if it ran for less time). On a GPU row this EQUALS ``gpu_hours``,
  // so it is a generalization rather than a competing number.
  unit_hours: number;
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
  // The organization, in either of its two roles: the GROUPED entity (an
  // Organization table), or an ATTRIBUTE of a per-instance / per-volume row in
  // the platform-wide "All" view, naming which tenant owns it. ``*_name`` is
  // resolved live server-side.
  organization_id?: number;
  organization_name?: string;
  // ``org`` / ``user`` / ``group`` — which kind of principal the consumer is.
  organization_kind?: string;
  // Only meaningful in the attribute role: the ORGANIZATION is gone, which is
  // a different fact from the row's own ``deleted`` (the instance/volume).
  organization_deleted?: boolean;
  // The grouped entity (instance / volume / user) no longer exists. The name
  // fields keep the clean (stale) name; the tables show a DeletedTag off this
  // flag plus the id, matching the Tokens tab.
  deleted?: boolean;
  // Owner user of a per-instance / per-volume row (compound date+dim grouping),
  // with its own deletion state — independent of the row's ``deleted`` (which
  // refers to the grouped instance/volume). Lets the export mark the User
  // column separately, matching the Tokens tab.
  user_deleted?: boolean;
  // Grouped-trend rows carry the sub-group label (sku / instance / user / …)
  // alongside ``date`` so the chart can pivot one series per group.
  group?: string;
  last_active?: string;
  // Instance-type rows carry the flavor's display fields (pretty product name +
  // per-card specs) so the UI matches the GPU Instances list.
  product?: string;
  unit_cpu_milli?: number;
  unit_memory_mib?: number;
  vram_mib?: number;
  // Instance totals (requested cpu/ram) — the real size, so CPU instance types
  // show "CPU-only · 2 vCPU · 4 GB" instead of just the per-unit spec.
  cpu_milli?: number;
  memory_mib?: number;
  // Per-instance rows also carry the card count + ephemeral disk so the
  // Instances table can render "<product> x <count>" + the spec popover.
  gpu_count?: number;
  ephemeral_mib?: number;
  local_storage_mib?: number;
  persistent_mib?: number;
  // Storage volume rows: provisioned capacity + storage type.
  storage_type?: string;
  capacity_mib?: number;
  // The priced unit's identity. For instances this is the instance type's
  // snapshot hash ("sha1:<40hex>") — an opaque reference key, joinable back to
  // the type catalog. NEVER render it: it carries no readable information. The
  // label is ``instance_type_name`` (below), the card pool is ``gpu_type``.
  sku?: string;
  // Per-cluster instance type name, snapshotted at metering time — the readable
  // label behind the opaque sku.
  instance_type_name?: string;
  // Billed unit multiplier: card count, fractional for a sliced card (0.5 = half
  // a card). Instance-type rows are grouped by ``(sku, sku_count)``, so BOTH are
  // needed to identify a row — keying on the display label alone collides
  // whenever one type name appears twice (the same definition on two clusters,
  // or a whole-card row next to a sliced row of the same type).
  sku_count?: number;
  // How the card is carved up, so a sliced row is distinguishable from a
  // whole-card row of the same type.
  //
  // The wire also carries ``definition_snapshot`` (cross-cluster type identity)
  // and ``slice_share_milli`` (the billed share in thousandths) — see
  // ResourceBreakdownRawItem. They are NOT flattened onto the row: no column,
  // cell or export reads them, and this type is the set of fields the page
  // actually renders, not a mirror of the payload.
  slice_mode?: 'whole' | 'ratio' | 'profile';
  sliced_memory_percentage?: number;
  partitioned_profile?: string;
  // Per-instance rows: every billed shape this instance held during the period.
  // The server emits it for EVERY such row (one entry minimum), not only for
  // reconfigured ones — the usage cell states each shape's composition, so it
  // needs the count and per-unit spec of every row. Optional on the wire all the
  // same: a server predating the field sends nothing, so treat absence as "no
  // breakdown available" and fall back to the bare total. Parts are rounded
  // server-side so they sum exactly to the row's totals.
  shapes?: InstanceShape[];
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
  // The billed quantity across every instance kind. ``gpu_hours`` is the same
  // expression filtered to GPU rows, so it reports 0 for a CPU-only fleet.
  unit_hours: number;
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
  GPU_BREAKDOWN_EXPORT: '/usage/gpu-instances/breakdown/export',
  GPU_BREAKDOWN_EXPORT_ESTIMATE:
    '/usage/gpu-instances/breakdown/export/estimate',
  STORAGE_BREAKDOWN_EXPORT: '/usage/storage/breakdown/export',
  STORAGE_BREAKDOWN_EXPORT_ESTIMATE: '/usage/storage/breakdown/export/estimate',
  EVENTS: '/usage/resource-events',
  SUMMARY: '/usage/summary',
  RESOURCE_META: '/usage/resource/meta'
};

// --- server (generic) shapes ---------------------------------------------

interface ServerMetrics {
  instance_hours?: number;
  gpu_hours?: number;
  // The billed quantity: uptime x sku_count, for every instance kind. Equals
  // gpu_hours on a GPU row; it is the only metric that reflects a CPU row's
  // unit count. See ResourceBreakdownSummary.unit_hours.
  unit_hours?: number;
  gb_days?: number;
  gb_hours?: number;
  resources?: number;
  active_users?: number;
  last_active?: string;
}

// One billed shape an instance held during the queried period. Emitted for every
// per-instance row, one entry minimum — not only for reconfigured ones, whose
// single Instance Type cell cannot tell the truth on its own but which are not
// the only rows that need their composition stated.
export interface InstanceShape {
  sku?: string | null;
  sku_count?: number | null;
  instance_hours?: number | null;
  unit_hours?: number | null;
  product?: string | null;
  gpu_count?: number | null;
  vram_mib?: number | null;
  cpu_milli?: number | null;
  memory_mib?: number | null;
  // The spec of ONE unit — the usage formula's multiplicand (`1c2g × 4 × …`).
  // Each shape carries its OWN: changing the instance type gives the shapes
  // different per-unit specs, and the row-level dimensions only has the latest.
  // Absent when the type declares no ``unitResources``.
  unit_cpu_milli?: number | null;
  unit_memory_mib?: number | null;
  slice_mode?: 'whole' | 'ratio' | 'profile' | null;
  sliced_memory_percentage?: number | null;
  partitioned_profile?: string | null;
}

// gpu_type / type both mean the sku (Type) on the server.

interface ServerBreakdownItem {
  date?: string | null;
  // Grouped entity: ``key`` is its display name, ``id`` its id, ``deleted`` its
  // own lifecycle state (instance / volume / user / sku, per group_by).
  key?: string | null;
  id?: number | null;
  sku?: string | null;
  deleted?: boolean | null;
  // Owner (creator) of the instance/volume row (compound date+dim grouping),
  // at the item root alongside the grouped entity, with its OWN deletion state
  // — independent of ``deleted`` — so the export can show a User column that
  // marks a deleted owner separately from a deleted instance/volume.
  creator_id?: number | null;
  creator_name?: string | null;
  creator_deleted?: boolean | null;
  // The consumer principal, sent in two situations: as the grouped entity's
  // kind when grouping BY organization, and as the full id/name/kind/deleted
  // set on a per-instance / per-volume row in the platform-wide view, where it
  // names the tenant the resource belongs to.
  organization_id?: number | null;
  organization_name?: string | null;
  organization_kind?: string | null;
  organization_deleted?: boolean | null;
  // Readable label + cross-cluster definition id for the opaque ``sku``. Absent
  // on rows metered before the server carried them.
  instance_type_name?: string | null;
  definition_snapshot?: string | null;
  // Present on instance-type rows: the other half of their grouping key.
  sku_count?: number | null;
  // Per-instance rows: one entry per billed shape, one minimum (see
  // InstanceShape). Absent from a server that predates the field.
  shapes?: InstanceShape[] | null;
  dimensions?: {
    product?: string | null;
    unit_cpu_milli?: number | null;
    unit_memory_mib?: number | null;
    vram_mib?: number | null;
    cpu_milli?: number | null;
    memory_mib?: number | null;
    gpu_count?: number | null;
    ephemeral_mib?: number | null;
    local_storage_mib?: number | null;
    persistent_mib?: number | null;
    storage_type?: string | null;
    capacity_mib?: number | null;
    // Card-pool key (the accelerator group, e.g. "nvidia-a100") + slicing
    // facets. See ResourceBreakdownItem for what slice_share_milli means.
    gpu_type?: string | null;
    slice_mode?: 'whole' | 'ratio' | 'profile' | null;
    sliced_memory_percentage?: number | null;
    partitioned_profile?: string | null;
    slice_share_milli?: number | null;
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
  organization: 'organization',
  date: 'date'
};

const num = (v?: number) => Number(v ?? 0);

function flattenMetrics(m: ServerMetrics): ResourceBreakdownSummary {
  const gpuHours = num(m.gpu_hours);
  return {
    gpu_hours: gpuHours,
    gpu_minutes: gpuHours * 60,
    instance_hours: num(m.instance_hours),
    unit_hours: num(m.unit_hours),
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
  const deleted = !!it.deleted;
  const rawKey = it.key ?? undefined;
  // The chart series legend can't render a tag, so it carries the deleted
  // marker as text ("<name> [Deleted.<id>]"); the tables render a DeletedTag off
  // ``flat.deleted`` + the id and so keep the clean name.
  const key =
    rawKey != null
      ? withDeletedMark(
          rawKey,
          deleted,
          deleted ? getIntl().formatMessage({ id: 'usage.table.deleted' }) : '',
          id
        )
      : rawKey;
  // Generic group label — for a compound (date + dim) trend row the key is the
  // sub-group value (the switch below targets single-dimension table rows).
  if (rawKey != null) flat.group = key;
  flat.deleted = deleted;
  switch (groupBy) {
    case 'resource_type':
      flat.resource_type = key;
      break;
    case 'gpu_type':
    case 'type':
      // The instance-type grouping keys on the opaque sku, and the server swaps
      // in the readable name only when it can still resolve a representative row
      // for the shape. When it can't, the raw "sha1:<40hex>" arrives as the key —
      // so prefer the name snapshotted onto the usage row, which survives the
      // type itself being gone. ``type`` (storage) carries no such name and falls
      // through to the key unchanged.
      flat.gpu_type = it.instance_type_name ?? key;
      break;
    case 'instance':
      flat.instance_name = rawKey;
      flat.instance_id = id;
      break;
    case 'volume':
      flat.volume_name = rawKey;
      flat.volume_id = id;
      break;
    case 'user':
      flat.user_name = rawKey;
      flat.user_id = id;
      break;
    case 'organization':
      flat.organization_name = rawKey;
      flat.organization_id = id;
      // Carried through for the export preview's Organization Type column —
      // the exported file has one, so the preview must be able to fill it.
      if (it.organization_kind != null) {
        flat.organization_kind = it.organization_kind;
      }
      break;
    default:
      break;
  }
  flat.sku = it.sku ?? undefined;
  flat.instance_type_name = it.instance_type_name ?? undefined;
  if (it.sku_count != null) flat.sku_count = it.sku_count;
  if (it.shapes?.length) flat.shapes = it.shapes;
  // Per-resource rows (instance / volume) carry their type → surface it as the
  // Instance Type / Type column when not already the group key.
  //
  // Deliberately NOT ``it.sku``: for instances the sku is an opaque
  // "sha1:<40hex>" reference key, so using it here would print a hash in the
  // Instance Type column. Prefer the snapshotted type name, then the card-pool
  // key from dimensions. A volume's sku IS readable ("volume--nfs--aws"), so it
  // stays the last resort — which is also what pre-upgrade instance rows, whose
  // sku is the old flavor name, need.
  if (!flat.gpu_type) {
    flat.gpu_type =
      it.instance_type_name ?? it.dimensions?.gpu_type ?? it.sku ?? undefined;
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
    if (dims.cpu_milli != null) flat.cpu_milli = dims.cpu_milli;
    if (dims.memory_mib != null) flat.memory_mib = dims.memory_mib;
    if (dims.gpu_count != null) flat.gpu_count = dims.gpu_count;
    if (dims.ephemeral_mib != null) flat.ephemeral_mib = dims.ephemeral_mib;
    if (dims.local_storage_mib != null)
      flat.local_storage_mib = dims.local_storage_mib;
    if (dims.persistent_mib != null) flat.persistent_mib = dims.persistent_mib;
    if (dims.storage_type) flat.storage_type = dims.storage_type;
    if (dims.capacity_mib != null) flat.capacity_mib = dims.capacity_mib;
    if (dims.slice_mode) flat.slice_mode = dims.slice_mode;
    if (dims.sliced_memory_percentage != null)
      flat.sliced_memory_percentage = dims.sliced_memory_percentage;
    if (dims.partitioned_profile)
      flat.partitioned_profile = dims.partitioned_profile;
  }
  // The tenant a per-instance / per-volume row belongs to, sent only in the
  // platform-wide view. Copied through rather than derived: when organization
  // is the GROUPING these came from ``key``/``id`` above, and this branch must
  // not overwrite that with an absent attribute.
  if (groupBy !== 'organization' && it.organization_name != null) {
    flat.organization_id = it.organization_id ?? undefined;
    flat.organization_name = it.organization_name;
    flat.organization_kind = it.organization_kind ?? undefined;
    flat.organization_deleted = !!it.organization_deleted;
  }
  // Owner (creator) of a per-instance / per-volume row — the grouped entity is
  // the instance/volume (``key``/``deleted``), so the owner sits at the item
  // root with its own deleted flag for the export's User column.
  if (it.creator_name != null) flat.user_name = it.creator_name;
  if (it.creator_id != null) flat.user_id = it.creator_id;
  if (it.creator_deleted != null) flat.user_deleted = !!it.creator_deleted;
  // Instance-type grouped trend: the series label (``group``) defaults to the
  // raw flavor slug. Instance Types are grouped by actual shape, so label each
  // series by that shape — "<product> x <cards>" / "CPU-only · 3 vCPU · 6 GB" —
  // matching the table and keeping every shape a distinct series (#5700).
  // ``groupBy`` is the unmapped frontend dimension; the instance-type axis is
  // ``gpu_type`` (→ backend ``instance_type`` via GROUP_BY_MAP).
  if (groupBy === 'gpu_type') {
    flat.group = instanceTypeSeriesLabel(flat);
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
  const groupByList = data.group_by?.length ? data.group_by : ['resource_type'];
  const {
    creator_ids,
    instance_ids,
    volume_ids,
    organization_ids,
    user_group_ids
  } = data.filters ?? {};
  // The non-date dimension drives response flattening into the right field.
  const dim = groupByList.find((g) => g !== 'date');
  return {
    body: {
      start_date: data.start_date,
      end_date: data.end_date,
      scope: data.scope ?? 'all',
      group_by: groupByList.map((g) => GROUP_BY_MAP[g] ?? g),
      granularity: data.granularity ?? 'day',
      // POST endpoints take proper id arrays. "filter by user" + "filter by
      // resource" (instance ids on the GPU tab / volume ids on Storage).
      ...(creator_ids?.length ? { creator_ids } : {}),
      ...(instance_ids?.length ? { instance_ids } : {}),
      ...(volume_ids?.length ? { volume_ids } : {}),
      ...(organization_ids?.length ? { organization_ids } : {}),
      ...(user_group_ids?.length ? { user_group_ids } : {}),
      ...(data.order_by ? { order_by: data.order_by } : {}),
      ...(data.descending !== undefined ? { descending: data.descending } : {}),
      page: data.page ?? 1,
      perPage: data.perPage ?? 20
    },
    groupBy: dim
  };
}

// --- request helpers -----------------------------------------------------

async function _breakdown(
  url: string,
  data: ResourceBreakdownRequest,
  options?: {
    token?: any;
  }
): Promise<ResourceBreakdownResponse> {
  const { body, groupBy } = toServerRequest(data);
  const res = await request<ServerBreakdownResponse>(url, {
    data: body,
    method: 'POST',
    cancelToken: options?.token
  });
  return flattenResponse(groupBy, res);
}

// Export endpoints per resource tab. Exported so the tabs reference URL's
// entries instead of re-typing the same paths in a local constant, which is
// how one of two copies gets missed when a path changes.
export const GPU_INSTANCES_EXPORT_ENDPOINTS = {
  exportUrl: URL.GPU_BREAKDOWN_EXPORT,
  estimateUrl: URL.GPU_BREAKDOWN_EXPORT_ESTIMATE
};

export const STORAGE_EXPORT_ENDPOINTS = {
  exportUrl: URL.STORAGE_BREAKDOWN_EXPORT,
  estimateUrl: URL.STORAGE_BREAKDOWN_EXPORT_ESTIMATE
};

export async function queryResourceBreakdown(
  data: ResourceBreakdownRequest,
  options?: {
    token?: any;
  }
): Promise<ResourceBreakdownResponse> {
  return _breakdown(URL.RESOURCE_BREAKDOWN, data, options);
}

export async function queryGpuInstancesBreakdown(
  data: ResourceBreakdownRequest,
  options?: {
    token?: any;
  }
): Promise<ResourceBreakdownResponse> {
  return _breakdown(URL.GPU_BREAKDOWN, data, options);
}

export async function queryStorageBreakdown(
  data: ResourceBreakdownRequest,
  options?: {
    token?: any;
  }
): Promise<ResourceBreakdownResponse> {
  return _breakdown(URL.STORAGE_BREAKDOWN, data, options);
}

export async function queryResourceEvents(
  data: {
    start_date?: string;
    end_date?: string;
    scope?: 'self' | 'all';
    filters?: ResourceUsageFilters;
    resource_types?: string[];
    resource_name?: string;
    event_types?: string[];
    page?: number;
    perPage?: number;
  },
  options?: { skipErrorHandler?: boolean; token?: any }
): Promise<ResourceEventsResponse> {
  const creatorIds = data.filters?.creator_ids;
  const organizationIds = data.filters?.organization_ids;
  const userGroupIds = data.filters?.user_group_ids;
  return request<ResourceEventsResponse>(URL.EVENTS, {
    params: {
      start_date: data.start_date,
      end_date: data.end_date,
      scope: data.scope ?? 'all',
      resource_type: data.resource_types?.[0],
      // GET endpoints take list params as CSV strings (avoids axios array
      // serialization quirks); the server splits them back into lists.
      ...(creatorIds?.length ? { creator_ids: creatorIds.join(',') } : {}),
      ...(organizationIds?.length
        ? { organization_ids: organizationIds.join(',') }
        : {}),
      ...(userGroupIds?.length
        ? { user_group_ids: userGroupIds.join(',') }
        : {}),
      ...(data.event_types?.length
        ? { event_types: data.event_types.join(',') }
        : {}),
      ...(data.resource_name ? { resource_name: data.resource_name } : {}),
      page: data.page ?? 1,
      perPage: data.perPage ?? 50
    },
    method: 'GET',
    skipErrorHandler: options?.skipErrorHandler,
    cancelToken: options?.token
  });
}

export interface ResourceFilterOption {
  id: number;
  label: string;
  deleted?: boolean;
  // ``org`` / ``user`` / ``group`` — only set on organization options so the
  // filter dropdown can tag a personal (USER) consumer.
  kind?: string;
}

export interface ResourceFilterMeta {
  creators: ResourceFilterOption[];
  instances: ResourceFilterOption[];
  volumes: ResourceFilterOption[];
  // Platform-wide "All" view only (backend returns them empty otherwise).
  organizations: ResourceFilterOption[];
  user_groups: ResourceFilterOption[];
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
    volumes: res.volumes || [],
    organizations: res.organizations || [],
    user_groups: res.user_groups || []
  };
}

export async function queryUsageSummary(
  params: {
    start_date: string;
    end_date: string;
    scope?: 'self' | 'all';
    creator_ids?: number[];
    organization_ids?: number[];
    user_group_ids?: number[];
  },
  options?: { token?: any }
): Promise<UsageSummaryResponse> {
  const { creator_ids, organization_ids, user_group_ids, ...rest } = params;
  const res = await request<{
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    token_active_users: number;
    gpu_hours: number;
    unit_hours: number;
    instance_hours: number;
    storage_gb_days: number;
    active_users: number;
  }>(URL.SUMMARY, {
    params: {
      ...rest,
      scope: params.scope ?? 'all',
      ...(creator_ids?.length ? { creator_ids: creator_ids.join(',') } : {}),
      ...(organization_ids?.length
        ? { organization_ids: organization_ids.join(',') }
        : {}),
      ...(user_group_ids?.length
        ? { user_group_ids: user_group_ids.join(',') }
        : {})
    },
    method: 'GET',
    cancelToken: options?.token
  });

  // Resource Distribution donut — by instance type, using Usage. NOT GPU-Hours:
  // that is 0 on every CPU-only shape, so those slices vanished and a CPU-only
  // deployment rendered an empty ring while its tables showed hundreds of hours.
  // Usage is defined for every kind, which is what makes one ring possible.
  let distribution: SummaryResourceDistributionItem[] = [];
  try {
    const byType = await queryGpuInstancesBreakdown(
      {
        start_date: params.start_date,
        end_date: params.end_date,
        scope: params.scope ?? 'all',
        group_by: ['gpu_type'],
        ...(creator_ids?.length ||
        organization_ids?.length ||
        user_group_ids?.length
          ? {
              filters: {
                ...(creator_ids?.length ? { creator_ids } : {}),
                ...(organization_ids?.length ? { organization_ids } : {}),
                ...(user_group_ids?.length ? { user_group_ids } : {})
              }
            }
          : {}),
        page: 1,
        perPage: 100
      },
      { token: options?.token }
    );
    // Rows are per SHAPE (the breakdown groups by ``(sku, sku_count)``), so a
    // pool that runs whole cards and quarter cards produces several rows. Label
    // each by its shape — the same label the Instance Types table uses — rather
    // than by the bare product name: identical labels made the ring show four
    // slices against a two-entry legend, and the raw flavor slug
    // (``gpustack--generic-linux-amd64``) was what a CPU shape fell back to.
    const merged = new Map<string, number>();
    byType.items.forEach((i) => {
      const value = i.unit_hours || 0;
      if (value <= 0) return;
      const label = instanceTypeSeriesLabel(i);
      merged.set(label, (merged.get(label) ?? 0) + value);
    });
    const total = Array.from(merged.values()).reduce((s, v) => s + v, 0);
    distribution = Array.from(merged, ([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
      // Largest first: the ring is drawn in array order, so an unsorted list
      // scatters the big slices and makes the legend hard to read against it.
    })).sort((a, b) => b.value - a.value);
  } catch {
    distribution = [];
  }

  return {
    total_tokens: num(res.total_tokens),
    input_tokens: num(res.input_tokens),
    output_tokens: num(res.output_tokens),
    token_active_users: num(res.token_active_users),
    gpu_hours: num(res.gpu_hours),
    unit_hours: num(res.unit_hours),
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

// --- Export -----------------------------------------------------------------

/**
 * Build the export payload from a breakdown request.
 *
 * Reuses ``toServerRequest`` so the exported set is narrowed by exactly the
 * predicate the table was showing, then drops pagination (an export is the
 * whole set) and swaps in the export-only knobs. ``sheets`` group_by values go
 * through the same ``GROUP_BY_MAP`` as the single-table form — the UI's
 * ``gpu_type`` is the backend's ``instance_type``.
 */
export function toResourceExportRequest(
  data: ResourceBreakdownRequest,
  options: {
    sheets?: { key: string; group_by: string[]; name?: string }[];
    format?: 'csv' | 'xlsx';
  } = {}
) {
  const { body } = toServerRequest(data);
  const { page, perPage, group_by, ...shared } = body as Record<string, any>;
  return {
    ...shared,
    ...(options.sheets
      ? {
          sheets: options.sheets.map((sheet) => ({
            ...sheet,
            // Map the KEY as well as group_by. The key names the CSV member
            // (`by_<key>.csv`) that customer scripts match on, so it has to be
            // the backend's vocabulary everywhere — the Tokens tab already
            // emits `by_route.csv`, and this tab must not emit the UI's
            // `by_gpu_type.csv` for the same kind of thing.
            key: GROUP_BY_MAP[sheet.key] ?? sheet.key,
            group_by: sheet.group_by.map((g) => GROUP_BY_MAP[g] ?? g)
          }))
        }
      : { group_by }),
    ...(options.format ? { format: options.format } : {})
  };
}

// The resource tabs share the token tabs' export helpers now
// (``downloadUsageExport`` / ``queryUsageExportEstimate`` in ./index), which
// take the url and so need no per-tab duplicate.
