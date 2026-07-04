// columns.ts
import { tableSorter } from '@/config/settings';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import RowActions from '../components/row-actions';
import { BenchmarkListItem as ListItem } from '../config/types';
const useBenchmarkColumns = (params: {
  sortOrder: string[];
  columns: ColumnsType<ListItem>;
  handleSelect: (val: string, record: ListItem) => void;
  onCellClick?: (record: ListItem, dataIndex: string) => void;
}): ColumnsType<ListItem> => {
  const intl = useIntl();
  const { onCellClick, handleSelect, columns } = params;
  const pluginCols = usePluginListColumns('benchmarks');

  return useMemo(() => {
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      key: c.key,
      ellipsis: { showTitle: false },
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: (
          <AutoTooltip ghost minWidth={20}>
            {intl.formatMessage({ id: 'common.table.name' })}
          </AutoTooltip>
        ),
        dataIndex: 'name',
        key: 'name',
        mobileCard: 'primary',
        sorter: tableSorter(1),
        render: (text: string, record) => (
          <AutoTooltip ghost minWidth={20} title={text}>
            <Typography.Link onClick={() => onCellClick?.(record, 'name')}>
              {text}
            </Typography.Link>
          </AutoTooltip>
        )
      },
      ...pluginRendered,
      ...columns,
      {
        title: (
          <Typography.Text
            ellipsis={{ tooltip: true }}
            style={{ color: 'var(--color-text-table-header)' }}
          >
            {intl.formatMessage({ id: 'common.table.operation' })}
          </Typography.Text>
        ),
        dataIndex: 'operations',
        key: 'operations',
        mobileCard: 'action',
        width: 140,
        render: (value: string, record: ListItem) => (
          <RowActions record={record} handleSelect={handleSelect}></RowActions>
        )
      }
    ];
  }, [intl, onCellClick, handleSelect, columns, pluginCols]);
};

export default useBenchmarkColumns;
