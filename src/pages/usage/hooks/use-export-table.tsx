import {
  apiKeysTableDataAtom,
  modelsTableDataAtom,
  usersTableDataAtom
} from '@/atoms/usage';
import { exportJsonToExcel } from '@gpustack/core-ui/excel';
import { useIntl } from '@umijs/max';
import { useStore } from 'jotai';
import _ from 'lodash';
import { withDeletedMark } from '../utils/deleted-label';
import useAPIKeysColumns from './use-apikeys-columns';
import useModelsColumns from './use-models-columns';
import useUsersColumns from './use-users-columns';

// The name column's ``dataIndex`` starts with the embedded entity object
// (route / user / api_key); that entity carries ``deleted`` + the id used for
// the "[Deleted.<id>]" export marker.
const ID_KEY_BY_ENTITY: Record<string, 'route_id' | 'user_id' | 'api_key_id'> =
  {
    route: 'route_id',
    user: 'user_id',
    api_key: 'api_key_id'
  };

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

const buildSheetMeta = (columns: ColumnLike[], deletedWord: string) => {
  const fields: string[] = [];
  const fieldLabels: Record<string, any> = {};
  const formatMap: Record<string, (raw: any, row: any) => any> = {};

  // The first entity-backed column is the name column; its exported value gets
  // the "<name> [Deleted.<id>]" marker for deleted rows.
  let nameMarked = false;
  columns.forEach((col) => {
    if (!col.dataIndex) return;
    const key = toFieldKey(col.dataIndex);
    fields.push(key);
    fieldLabels[key] = col.title;
    if (Array.isArray(col.dataIndex)) {
      const path = col.dataIndex;
      if (!nameMarked) {
        nameMarked = true;
        const entityKey = path[0];
        const idKey = ID_KEY_BY_ENTITY[entityKey];
        formatMap[key] = (_raw, row) => {
          const entity = row?.[entityKey];
          return withDeletedMark(
            _.get(row, path),
            entity?.deleted,
            deletedWord,
            idKey ? entity?.identity?.current?.[idKey] : undefined
          );
        };
      } else {
        formatMap[key] = (_raw, row) => _.get(row, path);
      }
    }
  });

  return { fields, fieldLabels, formatMap };
};

const useExportTable = () => {
  const store = useStore();
  const intl = useIntl();
  const modelsColumns = useModelsColumns();
  const apiKeysColumns = useAPIKeysColumns();
  const usersColumns = useUsersColumns();

  const exportTable = () => {
    const deletedWord = intl.formatMessage({ id: 'usage.table.deleted' });
    const usersTableData = store.get(usersTableDataAtom);
    const apiKeysTableData = store.get(apiKeysTableDataAtom);
    const modelsTableData = store.get(modelsTableDataAtom);

    const modelsMeta = buildSheetMeta(modelsColumns, deletedWord);
    const apiKeysMeta = buildSheetMeta(apiKeysColumns, deletedWord);
    const usersMeta = buildSheetMeta(usersColumns, deletedWord);

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
