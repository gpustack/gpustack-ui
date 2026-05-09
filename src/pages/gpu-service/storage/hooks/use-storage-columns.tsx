import { tableSorter } from '@/config/settings';
import { AutoTooltip, DropdownButtons } from '@gpustack/core-ui';
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
  return useMemo(() => {
    return [
      {
        title: '名称',
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
        title: '类型',
        dataIndex: ['spec', 'type'],
        key: 'type',
        sorter: tableSorter(2),
        render: (value: string) => StorageTypeLabelMap[value] || value || '-'
      },
      {
        title: '容量',
        dataIndex: ['spec', 'capacity'],
        key: 'capacity',
        sorter: tableSorter(3),
        render: (value: string) => value ?? '-'
      },
      {
        title: '访问模式',
        dataIndex: ['spec', 'accessMode'],
        key: 'accessMode',
        sorter: tableSorter(4),
        render: (value: string) => value || '-'
      },
      {
        title: '创建时间',
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
        title: '操作',
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
  }, [handleSelect, sortOrder]);
};

export default useStorageColumns;
