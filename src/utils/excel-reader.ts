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

interface FormatMap {
  [key: string]: (value: any, row?: any) => any;
}

/**
 * @param jsonData raw JSON data to export
 * @param fields export fields (keys in the JSON objects)
 * @param fieldLabels custom the table header labels
 * @param formatMap custom the cell format functions
 * @param fileName file name for the exported Excel file
 */
export function exportJsonToExcel(data: {
  jsonData: any[];
  fields: string[];
  fieldLabels?: Record<string, string>;
  formatMap?: FormatMap;
  fileName: string;
}) {
  const {
    jsonData,
    fields,
    fieldLabels,
    formatMap,
    fileName = 'data.xlsx'
  } = data;
  // 1. Process data: filter fields and format values
  const formattedData = jsonData.map((row) => {
    const result: Record<string, any> = {};
    for (const field of fields) {
      const rawValue = row[field];
      const formatFn = formatMap?.[field];
      result[field] = formatFn ? formatFn(rawValue, row) : rawValue;
    }
    return result;
  });

  // 2. Convert to worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: fields });

  // 3. Add headers if provided
  if (fieldLabels) {
    const headerRow = fields.map((key) => fieldLabels[key] || key);
    XLSX.utils.sheet_add_aoa(worksheet, [headerRow], { origin: 'A1' });
  }

  // 4. Create workbook and write to file
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
}
