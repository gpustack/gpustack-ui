import { AutoTooltip, DropdownButtons, StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  rowActionList,
  status,
  StoragePhaseLabelMap,
  StorageTypeLabelMap
} from '../config';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
}

const useStorageColumns = ({
  handleSelect,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: ['metadata', 'name'],
        key: 'name',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost style={{ maxWidth: 360 }}>
            <span className="text-primary">{text}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.type' }),
        dataIndex: ['spec', 'type'],
        key: 'type',
        sorter: false,
        render: (value: string) =>
          StorageTypeLabelMap[value]
            ? intl.formatMessage({ id: StorageTypeLabelMap[value] })
            : value || '-'
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.storage.capacity' }),
        dataIndex: ['spec', 'capacity'],
        key: 'capacity',
        sorter: false,
        render: (value: string) => (value ? value.replace(/Gi$/, 'GB') : '-')
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: ['status', 'phase'],
        key: 'status',
        sorter: false,
        render: (value: string) => (
          <StatusTag
            statusValue={{
              status: status[value],
              text: StoragePhaseLabelMap[value] || value
            }}
          ></StatusTag>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: ['metadata', 'creationTimestamp'],
        key: 'creationTimestamp',
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
  }, [handleSelect, sortOrder, intl]);
};

export default useStorageColumns;
