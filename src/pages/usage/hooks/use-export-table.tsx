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

type ColumnLike = {
  title: any;
  // Plugin-contributed columns may omit `dataIndex` — they render via a
  // bound component and aren't tied to a single row field. The export
  // path skips those entries; an exported sheet has no place for a
  // computed cell anyway.
  dataIndex?: string | string[];
  key?: string;
};

const toFieldKey = (dataIndex: string | string[]): string =>
  Array.isArray(dataIndex) ? dataIndex.join('_') : dataIndex;

const buildSheetMeta = (columns: ColumnLike[]) => {
  const fields: string[] = [];
  const fieldLabels: Record<string, any> = {};
  const formatMap: Record<string, (raw: any, row: any) => any> = {};

  columns.forEach((col) => {
    if (!col.dataIndex) return;
    const key = toFieldKey(col.dataIndex);
    fields.push(key);
    fieldLabels[key] = col.title;
    if (Array.isArray(col.dataIndex)) {
      const path = col.dataIndex;
      formatMap[key] = (_raw, row) => _.get(row, path);
    }
  });

  return { fields, fieldLabels, formatMap };
};

const useExportTable = () => {
  const store = useStore();
  const modelsColumns = useModelsColumns();
  const apiKeysColumns = useAPIKeysColumns();
  const usersColumns = useUsersColumns();

  const exportTable = () => {
    const usersTableData = store.get(usersTableDataAtom);
    const apiKeysTableData = store.get(apiKeysTableDataAtom);
    const modelsTableData = store.get(modelsTableDataAtom);

    const modelsMeta = buildSheetMeta(modelsColumns);
    const apiKeysMeta = buildSheetMeta(apiKeysColumns);
    const usersMeta = buildSheetMeta(usersColumns);

    exportJsonToExcel({
      fileName: 'table_data.xlsx',
      sheets: [
        {
          jsonData: modelsTableData.dataList || [],
          sheetName: 'models',
          fields: modelsMeta.fields,
          fieldLabels: modelsMeta.fieldLabels,
          formatMap: modelsMeta.formatMap
        },
        {
          jsonData: apiKeysTableData.dataList || [],
          sheetName: 'api_keys',
          fields: apiKeysMeta.fields,
          fieldLabels: apiKeysMeta.fieldLabels,
          formatMap: apiKeysMeta.formatMap
        },
        {
          jsonData: usersTableData.dataList || [],
          sheetName: 'users',
          fields: usersMeta.fields,
          fieldLabels: usersMeta.fieldLabels,
          formatMap: usersMeta.formatMap
        }
      ]
    });
  };
  return { exportTable };
};

export default useExportTable;
