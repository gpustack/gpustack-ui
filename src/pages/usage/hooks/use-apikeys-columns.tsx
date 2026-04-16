// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import { BreakdownItem as ListItem } from '../config/types';

const useModelsColumns = (): Array<{
  title: string;
  dataIndex: string;
  key: string;
}> => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'api_key_name',
        key: 'api_key_name',
        sorter: tableSorter(1),
        render: (text: string, record: ListItem) => (
          <span className="flex items-center">
            <AutoTooltip ghost style={{ maxWidth: 400 }}>
              <span className="text-primary">{text}</span>
            </AutoTooltip>
          </span>
        )
      },
      {
        title: 'User',
        dataIndex: 'user_name',
        key: 'user_name',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 400 }}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: 'Models Used',
        dataIndex: 'models_called',
        key: 'models_called',
        sorter: tableSorter(2),
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text || '-'}</AutoTooltip>
        )
      },
      {
        title: 'Input Tokens',
        dataIndex: 'input_tokens',
        key: 'input_tokens',
        render: (text: string[], record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: 'Output Tokens',
        dataIndex: 'output_tokens',
        key: 'output_tokens',
        render: (text: string[], record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: 'Total Tokens',
        dataIndex: 'total_tokens',
        key: 'total_tokens',
        sorter: tableSorter(3),
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => <AutoTooltip ghost>{text}</AutoTooltip>
      },
      {
        title: 'API Requests',
        dataIndex: 'api_requests',
        key: 'api_requests',
        sorter: tableSorter(3),
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => <AutoTooltip ghost>{text}</AutoTooltip>
      },
      {
        title: 'Last Active',
        dataIndex: 'last_active',
        key: 'last_active',
        sorter: tableSorter(3),
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => <AutoTooltip ghost>{text}</AutoTooltip>
      }
    ];
  }, [intl]);
};

export default useModelsColumns;
