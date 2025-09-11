// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import ModelTag from '../components/model-tag';
import { generateSource, setModelActionList } from '../config/button-actions';
import { ListItem } from '../config/types';

interface ModelsColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: SortOrder;
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number }
  >[];
}

const useModelsColumns = ({
  handleSelect,
  clusterList,
  sortOrder
}: ModelsColumnsHookProps): SealColumnProps[] => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        span: 5,
        render: (text: string, record: ListItem) => (
          <span className="flex-center" style={{ maxWidth: '100%' }}>
            <AutoTooltip ghost>
              <span className="m-r-5">{text}</span>
            </AutoTooltip>
            <ModelTag categoryKey={record.categories?.[0] || ''} />
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster',
        key: 'cluster',
        span: 3,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            {
              clusterList.find((item) => item.value === record.cluster_id)
                ?.label
            }
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        key: 'source',
        span: 5,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            <AutoTooltip ghost>{generateSource(record)}</AutoTooltip>
          </span>
        )
      },
      {
        title: (
          <Tooltip
            title={intl.formatMessage(
              { id: 'models.form.replicas.tips' },
              { api: `${window.location.origin}/v1` }
            )}
          >
            <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
              {intl.formatMessage({ id: 'models.form.replicas' })}
            </span>
            <QuestionCircleOutlined className="m-l-5" />
          </Tooltip>
        ),
        dataIndex: 'replicas',
        key: 'replicas',
        align: 'center',
        span: 4,
        editable: {
          valueType: 'number',
          title: intl.formatMessage({ id: 'models.table.replicas.edit' })
        },
        render: (text: number, record: ListItem) => (
          <span style={{ paddingLeft: 10, minWidth: '33px' }}>
            {record.ready_replicas} / {record.replicas}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        defaultSortOrder: 'descend',
        sortOrder,
        sorter: false,
        span: 4,
        render: (text: number) => (
          <AutoTooltip ghost>
            {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        span: 3,
        render: (text, record) => (
          <DropdownButtons
            items={setModelActionList(record)}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [sortOrder, clusterList, intl, handleSelect]);
};

export default useModelsColumns;
