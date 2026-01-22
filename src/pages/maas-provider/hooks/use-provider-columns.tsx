// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import ProviderLogo from '../components/provider-logo';
import ProviderModels from '../components/provider-models';
import { maasProviderLabelMap, rowActionList } from '../config';
import { MaasProviderItem } from '../config/types';

const useProviderColumns = (
  handleSelect: (val: string, record: MaasProviderItem) => void,
  onCellClick?: (record: MaasProviderItem, dataIndex: string) => void
): SealColumnProps[] => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        minWidth: 160,
        span: 5,
        render: (text: string, record: MaasProviderItem) => (
          <>
            <AutoTooltip ghost title={text}>
              {text}
            </AutoTooltip>
            {record.builtin && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                BuiltIn
              </Tag>
            )}
          </>
        )
      },
      {
        title: intl.formatMessage({ id: 'providers.table.providerName' }),
        dataIndex: 'provider',
        sorter: tableSorter(2),
        span: 4,
        minWidth: 160,
        render: (value: string) => (
          <div className="flex-center gap-8">
            <ProviderLogo provider={value} />
            <AutoTooltip ghost minWidth={20}>
              {maasProviderLabelMap[value]
                ? intl.formatMessage({ id: maasProviderLabelMap[value] })
                : value}
            </AutoTooltip>
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'providers.table.models' }),
        dataIndex: 'models',
        span: 3,
        minWidth: 200,
        sorter: tableSorter(3),
        render: (value: number) => <ProviderModels></ProviderModels>
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        span: 3,
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
        minWidth: 120,
        render: (value: string, record: MaasProviderItem) => (
          <DropdownButtons
            items={rowActionList}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect, onCellClick]);
};

export default useProviderColumns;
