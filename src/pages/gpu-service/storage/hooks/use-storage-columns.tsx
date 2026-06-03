import { AutoTooltip, DropdownButtons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { rowActionList } from '../config';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  storageClassList: Global.BaseOption<string>[];
  sortOrder: string[];
}

const useStorageColumns = ({
  handleSelect,
  storageClassList,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip
            ghost
            style={{ maxWidth: 360 }}
            title={<span>{record.displayName || text}</span>}
          >
            <span className="text-primary">{record.displayName || text}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.type' }),
        dataIndex: ['spec', 'type'],
        key: 'type',
        sorter: false,
        render: (value: string) => {
          return (
            <AutoTooltip ghost>
              {storageClassList.find((item) => item.value === value)?.label ||
                '-'}
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.storage.capacity' }),
        dataIndex: ['spec', 'capacity'],
        key: 'capacity',
        sorter: false,
        render: (value: string) => (value ? value.replace(/Gi$/, 'GB') : '-')
      },
      // {
      //   title: intl.formatMessage({ id: 'common.table.status' }),
      //   dataIndex: ['status', 'phase'],
      //   key: 'status',
      //   sorter: false,
      //   render: (value: string) =>
      //     value ? (
      //       <StatusTag
      //         statusValue={{
      //           status: status[value],
      //           text: StoragePhaseLabelMap[value] || value
      //         }}
      //       ></StatusTag>
      //     ) : (
      //       '-'
      //     )
      // },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost>
            {text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        render: (_text, record) => (
          <DropdownButtons
            items={rowActionList}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [handleSelect, sortOrder, storageClassList, intl]);
};

export default useStorageColumns;
