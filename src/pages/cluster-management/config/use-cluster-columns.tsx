// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import StatusTag from '@/components/status-tag';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap,
  clusterActionList
} from '.';
import { ClusterListItem } from './types';

const useClusterColumns = (
  handleSelect: (val: string, record: ClusterListItem) => void
): ColumnsType<ClusterListItem> => {
  const setActionsItems = (row: ClusterListItem) => {
    return clusterActionList.filter((item) => {
      if (item.provider) {
        return item.provider === row.provider;
      }
      return true;
    });
  };

  return useMemo(() => {
    return [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (text: string) => <AutoTooltip ghost>{text}</AutoTooltip>
      },
      {
        title: 'Provider',
        dataIndex: 'provider',
        render: (value: string) => <span>{ProviderLabelMap[value]}</span>
      },
      {
        title: 'Status',
        dataIndex: 'state',
        render: (value: number) => (
          <StatusTag
            statusValue={{
              status: ClusterStatus[value],
              text: ClusterStatusLabelMap[value]
            }}
          />
        )
      },
      {
        title: 'Workers',
        dataIndex: 'workers',
        render: (value: number) => <span>{value}</span>
      },
      {
        title: 'GPUs',
        dataIndex: 'gpus',
        render: (value: number) => <span>{value}</span>
      },
      {
        title: 'Deployments',
        dataIndex: 'models',
        render: (value: number) => <span>{value}</span>
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => (
          <span>{dayjs(value).format('YYYY-MM-DD HH:mm:ss')}</span>
        )
      },
      {
        title: 'Operations',
        dataIndex: 'operations',
        render: (value: string, record: ClusterListItem) => (
          <DropdownButtons
            items={setActionsItems(record)}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect]);
};

export default useClusterColumns;
