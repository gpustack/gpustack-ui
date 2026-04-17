// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import { tableSorter } from '@/config/settings';
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import { BreakdownItem as ListItem } from '../config/types';

interface ColumnsHookProps {
  sortOrder: string[];
}

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
        dataIndex: 'model_name',
        key: 'model_name',
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
        title: 'Cluster',
        dataIndex: 'cluster_name',
        key: 'cluster_name',
        sorter: tableSorter(2),
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text || '-'}</AutoTooltip>
        )
      },
      {
        title: 'Provider',
        dataIndex: 'provider_name',
        key: 'provider_name',
        render: (text: string, record: ListItem) => (
          <span className="flex-center gap-8">
            <ProviderLogo provider={record.provider_type || 'deployments'} />
            <AutoTooltip ghost style={{ maxWidth: 400 }}>
              {text ||
                (!record.provider_type &&
                  intl.formatMessage({ id: 'menu.models.deployment' }))}
            </AutoTooltip>
          </span>
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
