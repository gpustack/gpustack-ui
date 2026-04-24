import { tableSorter } from '@/config/settings';
import { AutoTooltip, DropdownButtons } from '@gpustack/core-ui';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  InstanceStatusLabelMap,
  InstanceStatusValueMap,
  rowActionList
} from '../config';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
}

const statusColorMap: Record<string, string> = {
  [InstanceStatusValueMap.Running]: 'success',
  [InstanceStatusValueMap.Pending]: 'processing',
  [InstanceStatusValueMap.Stopped]: 'default',
  [InstanceStatusValueMap.Failed]: 'error'
};

const useInstancesColumns = ({
  handleSelect,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  return useMemo(() => {
    return [
      {
        title: '实例名称',
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
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        sorter: tableSorter(2),
        render: (status: string) => {
          const value = status || InstanceStatusValueMap.Pending;
          return (
            <Tag
              color={statusColorMap[value] || 'default'}
              style={{ marginRight: 0 }}
            >
              {InstanceStatusLabelMap[value] || value}
            </Tag>
          );
        }
      },
      {
        title: '镜像',
        dataIndex: 'image',
        key: 'image',
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: 'GPU 数量',
        dataIndex: 'gpu_count',
        key: 'gpu_count',
        sorter: tableSorter(3),
        render: (value: number) => value ?? '-'
      },
      {
        title: '副本数',
        dataIndex: 'replicas',
        key: 'replicas',
        sorter: tableSorter(4),
        render: (value: number) => value ?? '-'
      },
      {
        title: '访问端点',
        dataIndex: 'endpoint',
        key: 'endpoint',
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text || '-'}
          </AutoTooltip>
        )
      },
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

export default useInstancesColumns;
