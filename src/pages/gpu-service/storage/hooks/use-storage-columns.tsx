import { tableSorter } from '@/config/settings';
import { AutoTooltip, DropdownButtons, StatusTag } from '@gpustack/core-ui';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  rowActionList,
  status,
  StorageStatusLabelMap,
  StorageStatusValueMap,
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
  return useMemo(() => {
    return [
      {
        title: '名称',
        dataIndex: 'name',
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
        dataIndex: 'type',
        key: 'type',
        sorter: tableSorter(2),
        render: (value: string) => StorageTypeLabelMap[value] || value || '-'
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        sorter: tableSorter(3),
        render: (statusValue: string) => {
          const value = statusValue || StorageStatusValueMap.Available;
          return (
            <StatusTag
              statusValue={{
                status: status[value],
                text: StorageStatusLabelMap[value] || value
              }}
            />
          );
        }
      },
      {
        title: '容量 (GB)',
        dataIndex: 'capacity_gb',
        key: 'capacity_gb',
        sorter: tableSorter(4),
        render: (value: number) => value ?? '-'
      },
      // {
      //   title: '挂载路径',
      //   dataIndex: 'mount_path',
      //   key: 'mount_path',
      //   ellipsis: {
      //     showTitle: false
      //   },
      //   render: (text: string) => (
      //     <AutoTooltip ghost minWidth={20}>
      //       {text || '-'}
      //     </AutoTooltip>
      //   )
      // },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
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
