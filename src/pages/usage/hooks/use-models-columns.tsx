// columns.ts
import { getGPUStackPlugin } from '@/plugins';
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import { useMemo } from 'react';
import { BreakdownItem as ListItem } from '../config/types';

// Plugin slot: enterprise plugins can contribute extra columns to the
// usage breakdown Models table via `usage.modelsExtraColumns`. Each
// entry renders a per-row cell keyed off `record.route.identity.current
// .route_id`. `placement` decides where in the existing column order
// the column lands (currently only `before-last-active` is supported,
// which is the natural spot for per-route quota / usage indicators).
export type UsageModelsPluginColumn = {
  key: string;
  titleId: string;
  placement?: 'before-last-active';
  render: (record: ListItem) => React.ReactNode;
};

type ColumnDef = {
  title: React.ReactNode;
  dataIndex?: string | string[];
  key: string;
  sorter?: boolean;
  ellipsis?: { showTitle: boolean };
  render?: (text: any, record: ListItem) => React.ReactNode;
};

const useModelsColumns = (): ColumnDef[] => {
  const intl = useIntl();

  return useMemo(() => {
    const pluginColumns: UsageModelsPluginColumn[] =
      getGPUStackPlugin()?.usage?.modelsExtraColumns ?? [];

    const pluginCols: ColumnDef[] = pluginColumns.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      key: c.key,
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    const beforeLastActive = pluginCols.filter(
      (_c, i) =>
        (pluginColumns[i].placement ?? 'before-last-active') ===
        'before-last-active'
    );
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: ['route', 'label'],
        key: 'route_name',
        render: (text: string, record: ListItem) => (
          <span className="flex items-center">
            <AutoTooltip
              ghost
              style={{ maxWidth: 400 }}
              title={<span>{text}</span>}
            >
              <span className="text-primary">{text}</span>
            </AutoTooltip>
            {record.route?.deleted && (
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
      ...beforeLastActive,
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
