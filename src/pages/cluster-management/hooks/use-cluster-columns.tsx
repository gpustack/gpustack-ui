// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import StatusTag from '@/components/status-tag';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap,
  clusterActionList
} from '../config';
import { ClusterListItem } from '../config/types';

const useClusterColumns = (
  handleSelect: (val: string, record: ClusterListItem) => void
): ColumnsType<ClusterListItem> => {
  const intl = useIntl();
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
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        render: (text: string) => <AutoTooltip ghost>{text}</AutoTooltip>
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.provider' }),
        dataIndex: 'provider',
        render: (value: string) => <span>{ProviderLabelMap[value]}</span>
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
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
        render: (value: number, record: ClusterListItem) => (
          <span>
            {record.ready_workers} / {record.workers}
          </span>
        )
      },
      {
        title: 'GPUs',
        dataIndex: 'gpus',
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.deployments' }),
        dataIndex: 'models',
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => (
          <span>{dayjs(value).format('YYYY-MM-DD HH:mm:ss')}</span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
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
