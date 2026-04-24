import {
  apiKeysTableDataAtom,
  modelsTableDataAtom,
  usersTableDataAtom
} from '@/atoms/usage';
import { exportJsonToExcel } from '@gpustack/core-ui/excel';
import { useStore } from 'jotai';
import _ from 'lodash';
import useAPIKeysColumns from './use-apikeys-columns';
import useModelsColumns from './use-models-columns';
import useUsersColumns from './use-users-columns';

const useExportTable = () => {
  const store = useStore();
  const modelsColumns = useModelsColumns();
  const apiKeysColumns = useAPIKeysColumns();
  const usersColumns = useUsersColumns();

  const exportTable = () => {
    const usersTableData = store.get(usersTableDataAtom);
    const apiKeysTableData = store.get(apiKeysTableDataAtom);
    const modelsTableData = store.get(modelsTableDataAtom);
    exportJsonToExcel({
      fileName: 'table_data.xlsx',
      sheets: [
        {
          jsonData: modelsTableData.dataList || [],
          sheetName: 'models',
          fields: modelsColumns
            .map((col: any) => _.join(col.dataIndex, '_'))
            .filter(Boolean) as string[],
          fieldLabels: modelsColumns.reduce(
            (map, col) => {
              map[_.join(col.dataIndex, '_')] = col.title;
              return map;
            },
            {} as Record<string, any>
          ),
          formatMap: {}
        },
        {
          jsonData: apiKeysTableData.dataList || [],
          sheetName: 'api_keys',
          fields: apiKeysColumns
            .map((col: any) => col.dataIndex)
            .filter(Boolean) as string[],
          fieldLabels: apiKeysColumns.reduce(
            (map, col) => {
              map[_.join(col.dataIndex, '_')] = col.title;
              return map;
            },
            {} as Record<string, any>
          ),
          formatMap: {}
        },
        {
          jsonData: usersTableData.dataList || [],
          sheetName: 'users',
          fields: usersColumns
            .map((col: any) => col.dataIndex)
            .filter(Boolean) as string[],
          fieldLabels: usersColumns.reduce(
            (map, col) => {
              map[_.join(col.dataIndex, '_')] = col.title;
              return map;
            },
            {} as Record<string, any>
          ),
          formatMap: {}
        }
      ]
    });
  };
  return { exportTable };
};

export default useExportTable;
