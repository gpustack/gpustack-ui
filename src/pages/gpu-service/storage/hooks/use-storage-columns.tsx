import { tableSorter } from '@/config/settings';
import { AutoTooltip, DropdownButtons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { rowActionList, StorageTypeLabelMap } from '../config';
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
        sorter: tableSorter(1),
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
        sorter: tableSorter(2),
        render: (value: string) =>
          StorageTypeLabelMap[value]
            ? intl.formatMessage({ id: StorageTypeLabelMap[value] })
            : value || '-'
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.storage.capacity' }),
        dataIndex: ['spec', 'capacity'],
        key: 'capacity',
        sorter: tableSorter(3),
        render: (value: string) => value ?? '-'
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.storage.accessMode' }),
        dataIndex: ['spec', 'accessMode'],
        key: 'accessMode',
        sorter: tableSorter(4),
        render: (value: string) => value || '-'
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: ['metadata', 'creationTimestamp'],
        key: 'creationTimestamp',
        sorter: tableSorter(5),
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
