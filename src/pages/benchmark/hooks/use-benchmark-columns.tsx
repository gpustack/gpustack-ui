// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import icons from '@/components/icon-font/icons';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { BenchmarkStatus, BenchmarkStatusLabelMap } from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';

const actionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

const useBenchmarkColumns = (
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
        title: intl.formatMessage({ id: 'benchmark.table.model' }),
        dataIndex: 'model_name',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.dataset' }),
        dataIndex: 'dataset_name',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        render: (value: number, record: ListItem) => (
          <StatusTag
            statusValue={{
              status: BenchmarkStatus[value],
              text: BenchmarkStatusLabelMap[value],
              message: record.state_message || undefined
            }}
          />
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.requestRate' }),
        dataIndex: 'request_rate',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.gpu' }),
        dataIndex: 'gpu_summary',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.itl' }),
        dataIndex: 'itl',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.tpot' }),
        dataIndex: 'tpot',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.ttft' }),
        dataIndex: 'ttft',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.rps' }),
        dataIndex: 'requests_per_second',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'benchmark.table.tps' }),
        dataIndex: 'tokens_per_second',
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(3),
        render: (value: string) => (
          <span>{dayjs(value).format('YYYY-MM-DD HH:mm:ss')}</span>
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
            items={actionList}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [intl, handleSelect]);
};

export default useBenchmarkColumns;
