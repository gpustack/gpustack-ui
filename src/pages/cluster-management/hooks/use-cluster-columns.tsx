// columns.ts
import { systemConfigAtom } from '@/atoms/system';
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import icons from '@/components/icon-font/icons';
import { SealColumnProps } from '@/components/seal-table/types';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import GrafanaIcon from '@/pages/_components/grafana-icon';
import { StarFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap,
  ProviderValueMap
} from '../config';
import { ClusterListItem } from '../config/types';

const clusterActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    label: 'resources.metrics.details',
    key: 'metrics',
    icon: (
      <span className="flex-center">
        <GrafanaIcon style={{ width: 14, height: 14 }}></GrafanaIcon>
      </span>
    )
  },
  {
    key: 'add_worker',
    label: 'resources.button.create',
    provider: ProviderValueMap.Docker,
    locale: true,
    icon: icons.DockerOutlined
  },
  {
    key: 'register_cluster',
    label: 'clusters.button.register',
    provider: ProviderValueMap.Kubernetes,
    locale: true,
    icon: icons.KubernetesOutlined
  },
  {
    key: 'addPool',
    label: 'clusters.button.addNodePool',
    provider: ProviderValueMap.DigitalOcean,
    locale: true,
    icon: icons.Catalog1
  },
  {
    key: 'isDefault',
    label: 'clusters.form.setDefault',
    icon: icons.StarOutlined
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

const useClusterColumns = (
  handleSelect: (val: string, record: ClusterListItem) => void,
  onCellClick?: (record: ClusterListItem, dataIndex: string) => void
): SealColumnProps[] => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);

  const setActionsItems = (row: ClusterListItem) => {
    return clusterActionList.filter((item) => {
      if (item.provider) {
        return item.provider === row.provider;
      }
      if (item.key === 'metrics') {
        return systemConfig?.showMonitoring;
      }
      return true;
    });
  };

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
