/**
 * Build the export preview's table columns from the server's column list.
 *
 * The dialog is called "Export Data", so its table shows what the file will
 * contain — same values, same order. The list therefore comes from
 * ``/export/estimate`` rather than being hand-written here: the exported
 * schema is defined server-side, and a second copy in the client is exactly
 * the drift this design exists to prevent.
 *
 * One deliberate difference from the file. An entity dimension is three
 * columns on disk (``<dim>_id`` / ``<dim>_name`` / ``<dim>_deleted``) because
 * a reconciliation script needs the join key and the flag as separate,
 * machine-readable fields. On screen that is three columns of chrome per
 * dimension, and a Tokens export has four dimensions. So the preview folds
 * each triplet into ONE cell — name, plus the same "Deleted·#id" tag the rest
 * of the Usage page uses — which shows the identical information in a third of
 * the width. No value is dropped: a live entity's id is the only thing not
 * spelled out, and it is redundant with a name that still resolves.
 *
 * The other client-side concern is reading a value out of a breakdown item:
 * both breakdown endpoints shape their JSON differently from the flat file, so
 * each gets a reader below.
 */
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { TableColumnType } from 'antd';
import React from 'react';
import DeletedTag from '../components/deleted-tag';
import type { UsageExportColumn } from '../config/types';

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
  resource_type_name: 'resource_type',
  instance_type_name: 'gpu_type',
  storage_type_name: 'gpu_type',
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

/**
 * One rendered column: a name, optionally carrying its dimension's id and
 * deletion state (which the file keeps as two extra columns).
 */
interface PreviewColumn {
  title: string;
  key: string;
  idKey?: string;
  deletedKey?: string;
}

const toPreviewColumns = (columns: UsageExportColumn[]): PreviewColumn[] => {
  const keys = new Set(columns.map((column) => column.key));
  const nameKeyFor = (key: string, suffix: string): string | null => {
    if (!key.endsWith(suffix)) return null;
    const nameKey = `${key.slice(0, -suffix.length)}_name`;
    return keys.has(nameKey) ? nameKey : null;
  };

  const result: PreviewColumn[] = [];
  for (const column of columns) {
    // Folded into the name column below — but only when that column is
    // actually present, so a lone id or flag still gets shown.
    if (nameKeyFor(column.key, '_id') || nameKeyFor(column.key, '_deleted')) {
      continue;
    }
    if (column.key.endsWith('_name')) {
      const prefix = column.key.slice(0, -'_name'.length);
      result.push({
        title: column.title,
        key: column.key,
        idKey: keys.has(`${prefix}_id`) ? `${prefix}_id` : undefined,
        deletedKey: keys.has(`${prefix}_deleted`)
          ? `${prefix}_deleted`
          : undefined
      });
      continue;
    }
    result.push({ title: column.title, key: column.key });
  }
  return result;
};

// Wide enough for the word "Index" plus a 3-digit row number; at 60 the
// header wrapped onto two lines.
const INDEX_WIDTH = 76;

/**
 * Width for one column, by what it holds.
 *
 * These are required, not cosmetic. The preview is a ``virtual`` table, which
 * lays out fixed: columns without a width share the modal evenly, so at a
 * dozen columns each gets ~100px and a name next to its Deleted tag is
 * squeezed to nothing. Sizing by content kind and scrolling horizontally is
 * what keeps a name readable.
 */
const columnWidth = (column: PreviewColumn): number => {
  // A name plus its "Deleted·#19" tag; the widest thing in the table.
  if (column.deletedKey) return 220;
  if (column.key.endsWith('_name')) return 180;
  if (column.key === 'date') return 110;
  if (column.key === 'last_active') return 130;
  return 140;
};

export const useExportPreviewColumns = (
  columns: UsageExportColumn[] | undefined,
  readValue: (item: any, key: string) => any,
  // Where the visible page starts in the whole result set. antd's render
  // callback only knows the row's position within the CURRENT page, so
  // without this the numbering restarts at 1 on every page — which reads as
  // "the preview didn't move" next to a row count of 142.
  pagination?: { page: number; perPage: number }
): { columns: TableColumnType<any>[]; scrollX: number } => {
  const intl = useIntl();

  const offset = pagination
    ? (Math.max(1, pagination.page) - 1) * pagination.perPage
    : 0;
  const indexColumn: TableColumnType<any> = {
    title: intl.formatMessage({ id: 'resources.table.index' }),
    width: INDEX_WIDTH,
    // Not frozen: at 76px it buys almost nothing, and a fixed column sits in
    // its own stacking context that floated over the dialog's sticky filter
    // bar.
    render: (_: any, __: any, index: number) => offset + index + 1
  };
  if (!columns?.length) return { columns: [indexColumn], scrollX: INDEX_WIDTH };

  const previewColumns = toPreviewColumns(columns);
  return {
    scrollX: previewColumns.reduce(
      (total, column) => total + columnWidth(column),
      INDEX_WIDTH
    ),
    columns: [
      indexColumn,
      ...previewColumns.map((column) => {
        const width = columnWidth(column);
        return {
          title: column.title,
          key: column.key,
          width,
          render: (_: any, record: any) => {
            const value = readValue(record, column.key);
            const text =
              value === null || value === undefined ? '' : String(value);
            // Mirrors the Usage tables: a gone entity dims its label and
            // carries the tag, whose "#id" tells apart two rows left sharing a
            // now-stale name. ``maxWidth`` is what AutoTooltip measures
            // against — without one it collapses inside a flex row.
            const deleted =
              !!column.deletedKey && !!readValue(record, column.deletedKey);
            if (!deleted) {
              return (
                <AutoTooltip ghost style={{ maxWidth: width - 16 }}>
                  {text}
                </AutoTooltip>
              );
            }
            return (
              <span className="flex items-center gap-8">
                <AutoTooltip
                  ghost
                  style={{
                    maxWidth: width - 100,
                    color: 'var(--ant-color-text-tertiary)'
                  }}
                >
                  {text}
                </AutoTooltip>
                <DeletedTag
                  id={column.idKey ? readValue(record, column.idKey) : null}
                />
              </span>
            );
          }
        } as TableColumnType<any>;
      })
    ]
  };
};

// ``ScrollerModal`` caps its scrolling content at 500px unless told
// otherwise, and everything below that line is simply out of view. With a
// 400px table body the pager landed at ~560px — present in the DOM, reachable
// only by scrolling the dialog, which reads as "there is no pagination".
//
// So the budget flows the other way: decide how tall the modal's content may
// be, then give the table what's left. Sizing the body off the WINDOW instead
// (an earlier attempt) makes it worse on a large monitor — the window is not
// the constraint, the modal is.
const CONTENT_VIEWPORT_RATIO = 0.72;
const MIN_CONTENT_HEIGHT = 380;
const MAX_CONTENT_HEIGHT = 760;
// Filter bar, table header, pager, and the margins between them.
const PREVIEW_CHROME_HEIGHT = 200;
// The over-limit alert, when it is showing.
const SUGGESTIONS_HEIGHT = 96;
const MIN_PREVIEW_BODY = 200;

/**
 * How tall the dialog's content box and the table's scrolling body may be.
 *
 * ``hasSuggestions`` matters because the remedy alert appears and disappears
 * with the row count: leaving room for it unconditionally wastes a chunk of
 * every normal export, and not accounting for it pushes the pager back out of
 * view exactly when the user most needs the dialog's controls.
 */
export const useExportPreviewLayout = (
  hasSuggestions: boolean
): { contentHeight: number; bodyHeight: number } => {
  const [viewport, setViewport] = React.useState(() => window.innerHeight);
  React.useEffect(() => {
    const onResize = () => setViewport(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const contentHeight = Math.min(
    MAX_CONTENT_HEIGHT,
    Math.max(MIN_CONTENT_HEIGHT, Math.round(viewport * CONTENT_VIEWPORT_RATIO))
  );
  const bodyHeight = Math.max(
    MIN_PREVIEW_BODY,
    contentHeight -
      PREVIEW_CHROME_HEIGHT -
      (hasSuggestions ? SUGGESTIONS_HEIGHT : 0)
  );
  return { contentHeight, bodyHeight };
};
