// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { tableSorter } from '@/config/settings';
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

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
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
  }, [intl, handleSelect]);
};

export default useCredentialColumns;
