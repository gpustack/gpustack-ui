import { saveAs } from 'file-saver';
import XLSX from 'xlsx';

export default function readExcelContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e: any) {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'string' });
      const ws = workbook.Sheets[workbook.SheetNames[0]]; // get the first worksheet
      const data = XLSX.utils.sheet_to_json(ws);
      resolve(JSON.stringify(data));
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * @param jsonData raw JSON data to export
 * @param fields export fields (keys in the JSON objects)
 * @param fieldLabels custom the table header labels
 * @param formatMap custom the cell format functions
 * @param fileName file name for the exported Excel file
 */

interface FormatMap {
  [key: string]: (value: any, row?: any) => any;
}

interface ExportSheetConfig {
  sheetName: string;
  jsonData: any[];
  fields: string[];
  fieldLabels?: Record<string, string>;
  formatMap?: FormatMap;
}

interface ExportExcelOptions {
  sheets: ExportSheetConfig[];
  fileName: string;
}

export function exportJsonToExcel({
  sheets,
  fileName = 'data.xlsx'
}: ExportExcelOptions) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const { sheetName, jsonData, fields, fieldLabels, formatMap } = sheet;

    // 1. format data
    const formattedData = jsonData.map((row) => {
      const result: Record<string, any> = {};

      for (const field of fields) {
        const rawValue = row[field];
        const formatFn = formatMap?.[field];
        result[field] = formatFn ? formatFn(rawValue, row) : rawValue;
      }

      return result;
    });

    // 2. convert to  worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: fields
    });

    // 3. customize headers
    if (fieldLabels) {
      const headerRow = fields.map((key) => fieldLabels[key] || key);
      XLSX.utils.sheet_add_aoa(worksheet, [headerRow], { origin: 'A1' });
    }

    // 4. add to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  // 5. export file
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/octet-stream'
  });

  saveAs(blob, fileName);
}
