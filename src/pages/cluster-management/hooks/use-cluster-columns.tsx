// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import { StarFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
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
  handleSelect: (val: string, record: ClusterListItem) => void,
  onCellClick?: (record: ClusterListItem, dataIndex: string) => void
): SealColumnProps[] => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        span: 3,
        render: (text: string, record: ClusterListItem) => (
          <>
            <AutoTooltip ghost title={text}>
              {/* <Typography.Link onClick={() => onCellClick?.(record, 'name')}>
                {record.name}
              </Typography.Link> */}
              {text}
            </AutoTooltip>
            {record.is_default && (
              <Tooltip
                title={intl.formatMessage({
                  id: 'clusters.form.setDefault.tips'
                })}
              >
                <StarFilled
                  style={{ color: 'var(--ant-gold-4)', marginLeft: 4 }}
                />
              </Tooltip>
            )}
          </>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.provider' }),
        dataIndex: 'provider',
        sorter: tableSorter(2),
        span: 3,
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
        sorter: tableSorter(3),
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.deployments' }),
        dataIndex: 'models',
        sorter: tableSorter(4),
        span: 3,
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'resources.nodes' }),
        dataIndex: 'workers',
        sorter: tableSorter(5),
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
        render: (value: number, record: ClusterListItem) => (
          <StatusTag
            statusValue={{
              status: ClusterStatus[value],
              text: ClusterStatusLabelMap[value],
              message: record.state_message || undefined
            }}
          />
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
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
  }, [handleSelect, onCellClick]);
};

export default useClusterColumns;
