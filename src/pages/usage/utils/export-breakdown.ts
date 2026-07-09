/**
 * Export a resource-breakdown table to Excel — the GPU Instances / Storage
 * tabs' counterpart to the Tokens tab export.
 *
 * Columns are derived from the same antd column specs the table renders, so the
 * export always matches what's on screen (whichever group_by tab is active).
 * Raw values are written (not the table's formatted render output) so numbers
 * stay sortable / calculable in the spreadsheet.
 */
import { exportJsonToExcel } from '@gpustack/core-ui/excel';
import { withDeletedMark } from './deleted-label';

export interface ExportColumn {
  title: string;
  dataIndex: string;
}

// group_by key → the row's clean name field + its id field. Only these
// groupings carry a clean name (their tables render a DeletedTag); other
// groupings (e.g. instance type) are already marked by the adapter.
const RESOURCE_NAME_FIELD: Record<string, { name: string; id: string }> = {
  instance: { name: 'instance_name', id: 'instance_id' },
  volume: { name: 'volume_name', id: 'volume_id' },
  user: { name: 'user_name', id: 'user_id' }
};

// Append the "[Deleted.<id>]" marker to the name field of deleted export rows,
// so the Excel export matches the on-screen tag. Rows are export-only copies,
// never the displayed data. Non-name groupings pass through unchanged.
export const markDeletedNames = (
  rows: any[],
  groupKey: string,
  deletedWord: string
): any[] => {
  const field = RESOURCE_NAME_FIELD[groupKey];
  if (!field) return rows || [];
  return (rows || []).map((row) =>
    row?.deleted
      ? {
          ...row,
          [field.name]: withDeletedMark(
            row[field.name] ?? '',
            true,
            deletedWord,
            row[field.id]
          )
        }
      : row
  );
};

// Keep only real data columns (drop index / render-only columns), and only
// those whose title is a plain string so the header is meaningful.
export const toExportColumns = (columns: any[]): ExportColumn[] =>
  (columns || [])
    .filter(
      (c) => typeof c?.dataIndex === 'string' && typeof c?.title === 'string'
    )
    .map((c) => ({
      title: c.title as string,
      dataIndex: c.dataIndex as string
    }));

export interface ExportSheet {
  rows: any[];
  columns: ExportColumn[];
  sheetName: string;
}

const buildSheet = ({ rows, columns, sheetName }: ExportSheet) => {
  const fields = columns.map((c) => c.dataIndex);
  const fieldLabels = Object.fromEntries(
    columns.map((c) => [c.dataIndex, c.title])
  );
  const jsonData = (rows || []).map((r) => {
    const o: Record<string, any> = {};
    columns.forEach((c) => {
      o[c.dataIndex] = r?.[c.dataIndex] ?? '';
    });
    return o;
  });
  return { jsonData, sheetName, fields, fieldLabels, formatMap: {} };
};

// Write one or more breakdown result sets to a single workbook, one sheet each.
export const exportBreakdownSheets = (
  sheets: ExportSheet[],
  fileName: string
): void => {
  exportJsonToExcel({ fileName, sheets: sheets.map(buildSheet) });
};

export const exportBreakdownRows = (
  rows: any[],
  columns: ExportColumn[],
  fileName: string,
  sheetName = 'usage'
): void => {
  exportBreakdownSheets([{ rows, columns, sheetName }], fileName);
};
