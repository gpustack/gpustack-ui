// columns.ts
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import DeletedTag from '../components/deleted-tag';
import { BreakdownItem as ListItem } from '../config/types';

interface ColumnsHookProps {
  sortOrder: string[];
}

const useUsersColumns = () => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: ['user', 'identity', 'value', 'user_name'],
        key: 'user_name',
        render: (text: string, record: ListItem) => (
          <span className="flex items-center gap-8">
            <AutoTooltip
              ghost
              style={{ maxWidth: 400 }}
              title={<span>{text}</span>}
            >
              <span
                className={
                  record.user?.deleted ? 'text-tertiary' : 'text-primary'
                }
              >
                {text}
              </span>
            </AutoTooltip>
            {record.user?.deleted && (
              <DeletedTag id={record.user?.identity?.current?.user_id} />
            )}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.filter.modelsUsed' }),
        dataIndex: 'models_called',
        key: 'models_called',
        sorter: true,
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 400 }}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'usage.table.user.apiKeysUsed' }),
        dataIndex: 'api_keys_used',
        key: 'api_keys_used',
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
        title: (
          <AutoTooltip ghost>
            {intl.formatMessage({ id: 'usage.table.inputTokensCached' })}
          </AutoTooltip>
        ),
        dataIndex: 'input_cached_tokens',
        key: 'input_cached_tokens',
        sorter: true,
        render: (text: number, record: ListItem) => (
          <AutoTooltip ghost>{text ?? '-'}</AutoTooltip>
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

export default useUsersColumns;
