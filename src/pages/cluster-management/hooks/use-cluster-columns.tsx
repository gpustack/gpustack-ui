// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import StatusTag from '@/components/status-tag';
import { Link, useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap,
  clusterActionList
} from '../config';
import { ClusterListItem } from '../config/types';

const setActionsItems = (row: ClusterListItem) => {
  return clusterActionList.filter((item) => {
    if (item.provider) {
      return item.provider === row.provider;
    }
    return true;
  });
};

const useClusterColumns = (
  handleSelect: (val: string, record: ClusterListItem) => void
): SealColumnProps[] => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        span: 3,
        render: (text: string, record: ClusterListItem) => (
          <AutoTooltip ghost>
            <Link
              to={`/cluster-management/clusters/detail?id=${record.id}&provider=${record.provider}&name=${record.name}`}
            >
              {text}
            </Link>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.provider' }),
        dataIndex: 'provider',
        span: 4,
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {ProviderLabelMap[value]}
          </AutoTooltip>
        )
      },
      {
        title: 'GPUs',
        dataIndex: 'gpus',
        span: 2,
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.deployments' }),
        dataIndex: 'models',
        span: 2,
        render: (value: number) => <span>{value}</span>
      },
      {
        title: 'Workers',
        dataIndex: 'workers',
        span: 3,
        render: (value: number, record: ClusterListItem) => (
          <span>
            {record.ready_workers} / {record.workers}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        span: 3,
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
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        span: 4,
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        span: 3,
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
