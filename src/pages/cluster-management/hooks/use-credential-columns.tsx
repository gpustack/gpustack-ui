// columns.ts
import { tableSorter } from '@/config/settings';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { AutoTooltip, DropdownButtons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { ProviderLabelMap, credentialActionList } from '../config';
import { CredentialListItem as ListItem } from '../config/types';
const useCredentialColumns = (
  sortOrder: string[],
  handleSelect: (val: string, record: ListItem) => void
): ColumnsType<ListItem> => {
  const intl = useIntl();
  const pluginCols = usePluginListColumns('cloudCredentials');

  return useMemo(() => {
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      key: c.key,
      ellipsis: { showTitle: false },
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20} title={text}>
            <span className="text-primary">{text}</span>
          </AutoTooltip>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.table.provider' }),
        dataIndex: 'provider',
        sorter: false,
        render: (value: string) => <span>{ProviderLabelMap[value]}</span>
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(3),
        ellipsis: {
          showTitle: false
        },
        render: (value: string) => (
          <span>{dayjs(value).format('YYYY-MM-DD HH:mm:ss')}</span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.description' }),
        dataIndex: 'description',
        ellipsis: {
          showTitle: false
        },
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {value}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        ellipsis: {
          showTitle: false
        },
        render: (value: string, record: ListItem) => (
          <DropdownButtons
            items={credentialActionList}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [intl, handleSelect, pluginCols]);
};

export default useCredentialColumns;
