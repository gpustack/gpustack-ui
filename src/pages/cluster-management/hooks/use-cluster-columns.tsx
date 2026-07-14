// columns.ts
import { systemConfigAtom } from '@/atoms/system';
import { tableSorter } from '@/config/settings';
import { getGPUStackPlugin } from '@/plugins';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { StarFilled } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  GrafanaIcon,
  StatusTag,
  icons,
  type TableColumnProps as SealColumnProps
} from '@gpustack/core-ui';
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
    order: 0,
    icon: icons.EditOutlined
  },
  {
    label: 'resources.metrics.details',
    key: 'metrics',
    order: 10,
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
    order: 20,
    icon: icons.DockerOutlined
  },
  {
    key: 'register_cluster',
    label: 'clusters.button.register',
    provider: ProviderValueMap.Kubernetes,
    locale: true,
    order: 30,
    icon: icons.KubernetesOutlined
  },
  {
    key: 'addPool',
    label: 'clusters.button.addNodePool',
    provider: ProviderValueMap.DigitalOcean,
    locale: true,
    order: 40,
    icon: icons.Catalog1
  },
  {
    key: 'isDefault',
    label: 'clusters.form.setDefault',
    locale: true,
    order: 50,
    icon: icons.StarOutlined
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    order: 999,
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

const useClusterColumns = (
  handleSelect: (val: string, record: ClusterListItem, item?: any) => void
): SealColumnProps[] => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);
  const pluginCols = usePluginListColumns('clusters');
  // The cluster name is plain text: there is no cluster-detail page
  // to route into. A plugin may still contribute extra row actions
  // (topology, Cluster Access) via `clusterDetail.useGenerateActions`.
  const { useGenerateActions } = getGPUStackPlugin()?.clusterDetail || {};

  const actionList =
    useGenerateActions?.({ actions: clusterActionList }) || clusterActionList;

  const setActionsItems = (row: ClusterListItem) => {
    return actionList.filter((item: any) => {
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
    // Two prebuilt span maps for the 24-unit SealTable grid: one for
    // the default layout, one for when a plugin contributes an extra
    // column (currently always the 3-span Organization cell — wider
    // would visually dominate this row of 2/3-span built-ins). Width
    // absorbed comes from the columns whose content underfills its
    // slot (single-digit `provider` / `models` / `status` tag), not
    // from `created_at` (a full date string) or `workers` (the
    // `x / y` digit pair reads better with breathing room). Picking
    // by map rather than a `pluginSpan`-driven formula trades the
    // formula's built-in handling of multi-column / variable-width
    // plugins for readability and easier tweaks — the sole consumer
    // today is one fixed-width column, so the formula's generality
    // was unused.
    const SPANS_DEFAULT = {
      provider: 3,
      deployments: 3,
      workers: 3,
      status: 3,
      createTime: 4
    };
    const SPANS_WITH_PLUGIN = {
      provider: 2,
      deployments: 2,
      workers: 3,
      status: 2,
      createTime: 4
    };
    const spans = pluginCols.length > 0 ? SPANS_WITH_PLUGIN : SPANS_DEFAULT;
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      span: c.span ?? 4,
      render: (_value: any, record: ClusterListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        span: 3,
        render: (text: string, record: ClusterListItem) => (
          <>
            <AutoTooltip ghost title={text}>
              <span className="text-primary">{record.name}</span>
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
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.table.provider' }),
        dataIndex: 'provider',
        sorter: tableSorter(2),
        span: spans.provider,
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {ProviderLabelMap[value]}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'dashboard.totalgpus' }),
        dataIndex: 'gpus',
        span: 2,
        sorter: tableSorter(3),
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'clusters.table.deployments' }),
        dataIndex: 'models',
        sorter: tableSorter(4),
        span: spans.deployments,
        render: (value: number) => <span>{value}</span>
      },
      {
        title: intl.formatMessage({ id: 'resources.nodes' }),
        dataIndex: 'workers',
        sorter: tableSorter(5),
        span: spans.workers,
        render: (value: number, record: ClusterListItem) => (
          <span>
            {record.ready_workers} / {record.workers}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        span: spans.status,
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
        span: spans.createTime,
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
            onSelect={(val: string, item: any) =>
              handleSelect(val, record, item)
            }
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect, intl, pluginCols]);
};

export default useClusterColumns;
