// columns.ts
import { tableSorter } from '@/config/settings';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { AutoTooltip, DropdownButtons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import ProviderLogo from '../components/provider-logo';
import ProviderModels from '../components/provider-models';
import { rowActionList } from '../config';
import { maasProviderLabelMap } from '../config/providers';
import { MaasProviderItem, ProviderModel } from '../config/types';
const useProviderColumns = (
  handleSelect: (val: string, record: MaasProviderItem) => void,
  onCellClick?: (record: MaasProviderItem, dataIndex: string) => void
): ColumnsType<MaasProviderItem> => {
  const intl = useIntl();
  const pluginCols = usePluginListColumns('maasProviders');

  return useMemo(() => {
    const setActionList = (record: MaasProviderItem) => {
      return rowActionList.filter((action) => {
        if (action.key === 'registerRoute') {
          return record.models && record.models.length > 0;
        }
        return true;
      });
    };
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      span: c.span ?? 4,
      render: (_value: any, record: MaasProviderItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        minWidth: 160,
        span: 5,
        mobileCard: 'primary',
        render: (text: string, record: MaasProviderItem) => (
          <>
            <AutoTooltip ghost title={text}>
              <span className="text-primary">{text}</span>
            </AutoTooltip>
            {record.builtin && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                BuiltIn
              </Tag>
            )}
          </>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'providers.table.providerName' }),
        dataIndex: ['config', 'type'],
        sorter: false,
        span: 4,
        minWidth: 160,
        responsive: { hideBelow: 'md' },
        render: (value: string, record: MaasProviderItem) => {
          const providerType = String(value || record.config?.type || '');
          return (
            <div
              className="flex-center gap-8"
              style={{
                minWidth: 0,
                maxWidth: '100%',
                width: '100%',
                justifyContent: 'flex-end'
              }}
            >
              <ProviderLogo provider={providerType} />
              <AutoTooltip
                ghost
                minWidth={20}
                style={{ minWidth: 0, maxWidth: '100%' }}
              >
                {maasProviderLabelMap[providerType]
                  ? intl.formatMessage({
                      id: maasProviderLabelMap[providerType]
                    })
                  : providerType}
              </AutoTooltip>
            </div>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'providers.table.models' }),
        dataIndex: 'models',
        span: 3,
        minWidth: 200,
        responsive: { hideBelow: 'md' },
        render: (value: ProviderModel[]) => (
          <div style={{ minWidth: 0, maxWidth: '100%', width: '100%' }}>
            <ProviderModels dataList={value || []}></ProviderModels>
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        span: 3,
        responsive: { hideBelow: 'md' },
        render: (value: string) => (
          <AutoTooltip
            ghost
            minWidth={20}
            style={{ minWidth: 0, maxWidth: '100%', width: '100%' }}
          >
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
            items={setActionList(record)}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect, onCellClick, intl, pluginCols]);
};

export default useProviderColumns;
