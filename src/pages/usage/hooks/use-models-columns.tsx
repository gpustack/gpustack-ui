// columns.ts
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
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
            <AutoTooltip
              ghost
              style={{ maxWidth: 400 }}
              title={<span>{text}</span>}
            >
              <span className="text-primary">{text}</span>
            </AutoTooltip>
            {record.model?.deleted && (
              <Tag
                style={{
                  marginLeft: 8,
                  borderRadius: 12,
                  color: 'var(--ant-color-text-tertiary)',
                  borderColor: 'var(--ant-color-split)',
                  backgroundColor: 'transparent'
                }}
                variant="outlined"
              >
                {intl.formatMessage({ id: 'usage.table.deleted' })}
              </Tag>
            )}
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
        dataIndex: ['model', 'identity', 'value', 'provider_type'],
        key: 'provider_type',
        render: (text: string, record: ListItem) => (
          <span className="flex-center gap-8">
            <ProviderLogo provider={text || 'deployments'} />
            <AutoTooltip ghost style={{ maxWidth: 400 }}>
              {text ||
                (!text && intl.formatMessage({ id: 'menu.models.deployment' }))}
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
