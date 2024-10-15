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
