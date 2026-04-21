// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import { BreakdownItem as ListItem } from '../config/types';

interface ColumnsHookProps {
  sortOrder: string[];
}

const useModelsColumns = (): Array<{
  title: string;
  dataIndex: string | string[];
  key: string;
}> => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: ['model', 'identity', 'value', 'model_name'],
        key: 'model_name',
        render: (text: string, record: ListItem) => (
          <span className="flex items-center">
            <AutoTooltip ghost style={{ maxWidth: 400 }}>
              <span className="text-primary">{text}</span>
            </AutoTooltip>
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.table.cluster' }),
        dataIndex: ['model', 'identity', 'value', 'cluster_name'],
        key: 'cluster_name',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text || '-'}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.table.provider' }),
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
        title: intl.formatMessage({ id: 'usage.filter.inputTokens' }),
        dataIndex: 'input_tokens',
        key: 'input_tokens',
        sorter: true,
        render: (text: string[], record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.filter.outputTokens' }),
        dataIndex: 'output_tokens',
        key: 'output_tokens',
        sorter: true,
        render: (text: string[], record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.filter.totalTokens' }),
        dataIndex: 'total_tokens',
        key: 'total_tokens',
        sorter: true,
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => <AutoTooltip ghost>{text}</AutoTooltip>
      },
      {
        title: intl.formatMessage({ id: 'usage.filter.apiRequests' }),
        dataIndex: 'api_requests',
        key: 'api_requests',
        sorter: true,
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => <AutoTooltip ghost>{text}</AutoTooltip>
      },
      {
        title: intl.formatMessage({ id: 'usage.table.lastActive' }),
        dataIndex: 'last_active',
        key: 'last_active',
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => <AutoTooltip ghost>{text}</AutoTooltip>
      }
    ];
  }, [intl]);
};

export default useModelsColumns;
