import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import LabelsCell from '@/components/label-cell';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/es/table';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { NodePoolListItem as ListItem } from '../config/types';

const actionItems = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined />
  },

  {
    key: 'delete',
    label: 'common.button.delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];
const usePoolsColumns = (
  handleSelect: (val: string, record: ListItem) => void,
  sortOrder?: SortOrder
): ColumnsType<ListItem> => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'clusters.workerpool.instanceType' }),
        dataIndex: 'instance_type',
        key: 'instance_type',
        ellipsis: {
          showTitle: false
        },
        span: 4,
        style: {
          paddingInline: 'var(--ant-table-cell-padding-inline)'
        },
        render: (text: string) => (
          <AutoTooltip title={text} ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.workerpool.replicas' }),
        dataIndex: 'replicas',
        span: 3,
        key: 'replicas'
      },
      {
        title: intl.formatMessage({ id: 'clusters.workerpool.batchSize' }),
        dataIndex: 'batch_size',
        key: 'batch_size',
        span: 3
      },
      {
        title: intl.formatMessage({ id: 'clusters.workerpool.osImage' }),
        dataIndex: 'os_image',
        key: 'os_image',
        span: 3,
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip title={text} ghost minWidth={20}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.labels' }),
        dataIndex: 'labels',
        key: 'labels',
        width: 200,
        span: 4,
        render: (text: string, record: ListItem) => (
          <LabelsCell labels={record.labels}></LabelsCell>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'create_at',
        key: 'created_at',
        span: 4,
        showSorterTooltip: false,
        defaultSortOrder: 'descend',
        sortOrder: sortOrder,
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        style: {
          paddingLeft: 42
        },
        render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operations',
        span: 3,
        style: {
          paddingLeft: 36
        },
        render: (text: string, record: ListItem) => (
          <DropdownButtons
            items={actionItems}
            onSelect={(key) => handleSelect?.(key, record)}
          />
        )
      }
    ];
  }, [sortOrder, handleSelect]);
};

export default usePoolsColumns;
