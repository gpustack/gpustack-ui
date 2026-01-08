import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';
import { RenderOption } from '../components/pool-form';
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
  sortOrder?: string[]
): SealColumnProps[] => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        ellipsis: {
          showTitle: false
        },
        span: 3,
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
        title: intl.formatMessage({ id: 'clusters.workerpool.instanceType' }),
        dataIndex: 'instance_type',
        key: 'instance_type',
        ellipsis: {
          showTitle: false
        },
        span: 4,
        style: {
          paddingLeft: 62
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip
            title={
              <RenderOption
                styles={{
                  description: {
                    color: 'var(--color-white-quaternary)'
                  }
                }}
                data={{
                  vendor: record.instance_spec?.vendor,
                  description: record.instance_spec?.description,
                  specInfo: _.omit(record.instance_spec, [
                    'label',
                    'vendor',
                    'description'
                  ])
                }}
              />
            }
            ghost
            minWidth={20}
          >
            {record.instance_spec?.description || record.instance_spec?.label}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.workerpool.osImage' }),
        dataIndex: 'image_name',
        key: 'image_name',
        span: 4,
        ellipsis: {
          showTitle: false
        },
        style: {
          paddingLeft: 56
        },
        render: (text: string) => (
          <AutoTooltip
            title={
              <span className="flex-column">
                <span className="text-tertiary">
                  {intl.formatMessage({ id: 'clusters.workerpool.osImage' })}
                  :{' '}
                </span>
                {text}
              </span>
            }
            showTitle
            ghost
            minWidth={20}
          >
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.nodes' }),
        dataIndex: 'replicas',
        span: 6,
        key: 'replicas',
        style: {
          paddingLeft: 50
        },
        editable: {
          valueType: 'number',
          title: intl.formatMessage({ id: 'models.table.replicas.edit' })
        },
        render: (text: string, record: ListItem) => (
          <span>
            {record.ready_workers} / {record.replicas}
          </span>
        )
      },

      // {
      //   title: intl.formatMessage({ id: 'clusters.workerpool.batchSize' }),
      //   dataIndex: 'batch_size',
      //   key: 'batch_size',
      //   span: 4
      // },
      // {
      //   title: intl.formatMessage({ id: 'resources.table.labels' }),
      //   dataIndex: 'labels',
      //   key: 'labels',
      //   width: 200,
      //   span: 4,
      //   render: (text: string, record: ListItem) => (
      //     <LabelsCell labels={record.labels}></LabelsCell>
      //   )
      // },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        span: 4,
        showSorterTootip: false,
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        style: {
          paddingLeft: 42
        },
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20}>
            {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operations',
        dataIndex: 'operations',
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
  }, [handleSelect]);
};

export default usePoolsColumns;
