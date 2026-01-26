import { exportJsonToExcel } from '@/utils/excel-reader';

const useExportData = (params: { columns: any[] }) => {
  const { columns } = params;
  const colIndexMap = columns.reduce(
    (map, col) => {
      if (col.dataIndex !== 'operations') {
        map[col.dataIndex] = col.title;
      }
      return map;
    },
    {} as Record<string, any>
  );

  const exportData = (dataList: any[]) => {
    const fileName = `benchmark.xlsx`;
    exportJsonToExcel({
      jsonData: dataList || [],
      fileName: fileName,
      fields: Object.keys(colIndexMap),
      fieldLabels: colIndexMap,
      formatMap: {}
    });
  };
  return { exportData };
};

export default useExportData;
