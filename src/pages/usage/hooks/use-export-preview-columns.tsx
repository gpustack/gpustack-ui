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
 * columns on disk because a reconciliation script needs the join key and the
 * flag as separate, machine-readable fields. On screen that is three columns
 * of chrome per dimension, and a Tokens export has four dimensions. So the
 * preview folds each triplet into ONE cell — name, plus the same
 * "Deleted·#id" tag the rest of the Usage page uses — which shows the
 * identical information in a third of the width. No value is dropped: a live
 * entity's id is the only thing not spelled out, and it is redundant with a
 * name that still resolves.
 */
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { TableColumnType } from 'antd';
import DeletedTag from '../components/deleted-tag';
import type { UsageExportColumn } from '../config/types';

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
