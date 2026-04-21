// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import { useMemo } from 'react';
import { BreakdownItem as ListItem } from '../config/types';

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
        dataIndex: ['api_key', 'identity', 'value', 'api_key_name'],
        key: 'api_key_name',
        render: (text: string, record: ListItem) => (
          <span className="flex items-center">
            <AutoTooltip ghost title={<span>{text}</span>}>
              <span className="text-primary">{text}</span>
            </AutoTooltip>
            {record.api_key?.deleted && (
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
        title: intl.formatMessage({ id: 'usage.tabs.users' }),
        dataIndex: ['api_key', 'identity', 'value', 'user_name'],
        key: 'user_name',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 400 }}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.filter.modelsUsed' }),
        dataIndex: 'models_called',
        key: 'models_called',
        sorter: true,
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text || '-'}</AutoTooltip>
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
