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

export interface ExportColumn {
  title: string;
  dataIndex: string;
}

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

export const exportBreakdownRows = (
  rows: any[],
  columns: ExportColumn[],
  fileName: string,
  sheetName = 'usage'
): void => {
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
  exportJsonToExcel({
    fileName,
    sheets: [{ jsonData, sheetName, fields, fieldLabels, formatMap: {} }]
  });
};
