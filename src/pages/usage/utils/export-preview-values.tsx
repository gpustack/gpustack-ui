/**
 * Read an exported column's value out of a breakdown item.
 *
 * The export's columns are flat (``<dim>_id`` / ``<dim>_name`` /
 * ``<dim>_deleted``) while the two breakdown endpoints each shape their JSON
 * differently — the token one nests a dimension as ``{ identity, label,
 * deleted }``, the resource adapter flattens and renames on the way in. So each
 * gets a reader here.
 *
 * Kept out of the column hook on purpose: these change when a breakdown
 * RESPONSE changes, while the columns change when the exported SCHEMA does.
 */
// The token breakdown's entity dimensions. Matched whole, not by prefix, so
// ``api_key_id`` can't be read as the ``api`` dimension's ``key_id``.
const TOKEN_DIMENSIONS = ['organization', 'api_key', 'route', 'user'];

const splitDimensionColumn = (
  key: string
): { dimension: string; part: string } | null => {
  for (const dimension of TOKEN_DIMENSIONS) {
    for (const part of ['id', 'name', 'deleted', 'kind']) {
      if (key === `${dimension}_${part}`) return { dimension, part };
    }
  }
  return null;
};

/**
 * Read an exported column's value out of a token breakdown item.
 *
 * ``/breakdown`` nests each dimension as ``{ identity, label, deleted }``
 * while the file flattens it into three columns, so the mapping lives here.
 */
export const tokenPreviewValue = (item: any, key: string): any => {
  // ``value`` is what the file writes; ``label`` is the pretty bucket name.
  // Prefer the former so the preview cell and the exported cell agree.
  if (key === 'date') return item?.date?.value ?? item?.date?.label;
  const split = splitDimensionColumn(key);
  if (!split) return item?.[key];
  const dimension = item?.[split.dimension];
  if (!dimension) return undefined;
  switch (split.part) {
    case 'id':
      return dimension.identity?.current?.[`${split.dimension}_id`];
    case 'name':
      return dimension.label;
    case 'kind':
      return dimension.identity?.value?.organization_kind;
    default:
      return dimension.deleted;
  }
};

/**
 * Export column key → field on a flattened resource breakdown item.
 *
 * The resource adapter (``apis/resource.ts``) renames the server's generic
 * shape on the way in: ``metrics.gb_days`` becomes ``storage_gb_days``,
 * ``metrics.resources`` becomes ``active_instances``, and the grouped entity's
 * ``key``/``id`` are unpacked into ``<dim>_name``/``<dim>_id``. The export
 * columns keep the server's names, so without this table the renamed ones
 * would silently render as empty cells.
 */
const RESOURCE_FIELD_BY_KEY: Record<string, string> = {
  gb_days: 'storage_gb_days',
  gb_hours: 'storage_gb_hours',
  // Back-compat only. The server now names this column after what it counts
  // (``active_instances`` / ``active_volumes``, both already on the item, so
  // they need no entry here); an older server still sends the generic
  // ``resources``, which holds the same number under either tab.
  resources: 'active_instances',
  // Non-entity buckets: the adapter parks the group label on its own field.
  // Only instance_type is reachable today — the Storage tab groups by
  // volume / user only, and no tab exports resource_type — so mapping those
  // would be guessing at a shape no response has.
  instance_type_name: 'gpu_type',
  // A per-resource row's owner rides at the item root as ``user_*``.
  owner_id: 'user_id',
  owner_name: 'user_name',
  owner_deleted: 'user_deleted'
};

/** Same, for resource breakdown items. */
export const resourcePreviewValue = (item: any, key: string): any => {
  // The resource breakdown buckets hourly, so its dates arrive as instants
  // while the FILE writes calendar days (matching the token export). Slice
  // the ISO string rather than re-parsing — a tz-offset timestamp would shift
  // the calendar day on format.
  if (key === 'last_active') {
    return item?.last_active
      ? String(item.last_active).slice(0, 10)
      : undefined;
  }
  const mapped = RESOURCE_FIELD_BY_KEY[key];
  if (mapped) return item?.[mapped];
  // ``organization_deleted`` is the one ambiguous key: on an Organization
  // table it IS the row's own entity, but on an instance/volume row in the
  // "All" view it is the TENANT that owns the row — "this volume is gone" and
  // "the org that owned it is gone" are different facts, and the generic
  // fallback below would answer the first for both. The adapter only sets the
  // attribute form, so its presence is what tells the two roles apart.
  if (key === 'organization_deleted' && item?.organization_deleted != null) {
    return item.organization_deleted;
  }
  // The adapter unpacks the entity's id and name onto ``<dim>_id`` /
  // ``<dim>_name``, but leaves ``deleted`` generic — whatever the grouping, it
  // refers to the row's own entity.
  if (key.endsWith('_deleted')) return item?.deleted;
  return item?.[key];
};
