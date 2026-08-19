// columns.ts
import { systemConfigAtom } from '@/atoms/system';
import { tableSorter } from '@/config/settings';
import {
  AutoTooltip,
  DropdownButtons,
  IconFont,
  StatusTag,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import {
  rowActionList,
  ServiceModeColorMap,
  ServiceModeMap,
  ServiceStateLabelMap,
  ServiceStatus
} from '../config';
import { CacheProviderItem, ListItem, ServiceMode } from '../config/types';

// Single source of the column min-widths: the parent table reads them for its
// columns and the expanded instance rows rebuild the same track layout from
// them so child cells align under these columns.
export const serviceColumnMinWidths = {
  name: 160,
  provider: 160,
  mode: 100,
  cluster: 120,
  status: 120,
  createTime: 160,
  operations: 120
};

const useServiceColumns = (
  handleSelect: (val: string, record: ListItem) => void,
  options: {
    getProvider: (name: string) => CacheProviderItem | undefined;
    clusterNameMap: Record<number, string>;
    onCellClick?: (record: ListItem) => void;
  }
): ColumnsType<ListItem> => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);
  const { getProvider, clusterNameMap, onCellClick } = options;

  return useMemo(() => {
    const renderProvider = (value: string) => {
      const provider = getProvider(value);
      const iconUrl = provider?.icon;
      return (
        <div className="flex-center gap-8">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={`${value} icon`}
              style={{ width: 16, height: 16 }}
            />
          ) : (
            <IconFont type="icon-storage-outlined" />
          )}
          <AutoTooltip ghost minWidth={20}>
            {provider?.display_name || value}
          </AutoTooltip>
        </div>
      );
    };

    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        minWidth: serviceColumnMinWidths.name,
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost title={text}>
            <Typography.Link onClick={() => onCellClick?.(record)}>
              {text}
            </Typography.Link>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'kvCache.table.provider' }),
        dataIndex: 'provider_name',
        minWidth: serviceColumnMinWidths.provider,
        render: (value: string) => renderProvider(value)
      },
      {
        title: intl.formatMessage({ id: 'kvCache.table.mode' }),
        dataIndex: 'mode',
        minWidth: serviceColumnMinWidths.mode,
        render: (value: ServiceMode) => (
          <ThemeTag color={ServiceModeColorMap[value] || 'blue'} opacity={0.7}>
            {intl.formatMessage({ id: ServiceModeMap[value] })}
          </ThemeTag>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        minWidth: serviceColumnMinWidths.cluster,
        render: (value: number) => (
          <AutoTooltip ghost minWidth={20}>
            {clusterNameMap[value] || '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        minWidth: serviceColumnMinWidths.status,
        render: (value: string, record: ListItem) => (
          <StatusTag
            statusValue={{
              status: ServiceStatus[value],
              text: ServiceStateLabelMap[value],
              message: record.state_message || undefined
            }}
          />
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        minWidth: serviceColumnMinWidths.createTime,
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        minWidth: serviceColumnMinWidths.operations,
        render: (value: string, record: ListItem) => (
          <DropdownButtons
            items={rowActionList
              .filter((action) => {
                if (action.key === 'metrics') {
                  return !!systemConfig?.showMonitoring;
                }
                return action.show
                  ? action.show(record, getProvider(record.provider_name))
                  : true;
              })
              .map(({ show, ...action }) => action)}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [
    handleSelect,
    intl,
    systemConfig,
    getProvider,
    clusterNameMap,
    onCellClick
  ]);
};

export default useServiceColumns;
