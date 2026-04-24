import { exportJsonToExcel } from '@gpustack/core-ui/excel';

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
      fileName,
      sheets: [
        {
          jsonData: dataList || [],
          sheetName: 'benchmark_data',
          fields: Object.keys(colIndexMap),
          fieldLabels: colIndexMap,
          formatMap: {}
        }
      ]
    });
  };
  return { exportData };
};

export default useExportData;
