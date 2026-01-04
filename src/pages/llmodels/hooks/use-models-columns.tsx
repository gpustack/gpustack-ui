// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import { OPENAI_COMPATIBLE, tableSorter } from '@/config/settings';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';
import ModelTag from '../components/model-tag';
import { ActionList, generateSource } from '../config/button-actions';
import { ListItem } from '../config/types';

const setModelActionList = (record: any) => {
  return _.filter(ActionList, (action: any) => {
    if (action.key === 'chat' || action.key === 'api') {
      return record.ready_replicas > 0;
    }

    if (action.key === 'start') {
      return record.replicas === 0;
    }

    if (action.key === 'stop') {
      return record.replicas > 0;
    }

    return true;
  });
};

interface ModelsColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
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
        sorter: tableSorter(1),
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
        dataIndex: 'cluster_id',
        key: 'cluster_id',
        sorter: tableSorter(2),
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
        sorter: tableSorter(3),
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
              { api: `${window.location.origin}/${OPENAI_COMPATIBLE}` }
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
        align: 'left',
        sorter: tableSorter(4),
        span: 4,
        editable: {
          valueType: 'number',
          title: intl.formatMessage({ id: 'models.table.replicas.edit' })
        },
        render: (text: number, record: ListItem) => (
          <span style={{ minWidth: '23px' }}>
            {record.ready_replicas} / {record.replicas}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: tableSorter(5),
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
