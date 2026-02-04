// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import { tableSorter } from '@/config/settings';
import ModelTag from '@/pages/_components/model-tag';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { rowActionList } from '../config';
import { RouteItem } from '../config/types';

const useAccessColumns = (
  handleSelect: (val: string, record: RouteItem) => void,
  onCellClick?: (record: RouteItem, dataIndex: string) => void
): SealColumnProps[] => {
  const intl = useIntl();

  const filterActions = (record: RouteItem) => {
    return rowActionList.filter((action) => {
      if (action.key === 'chat' || action.key === 'api') {
        return record.ready_targets > 0;
      }
      return true;
    });
  };

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        span: 5,
        render: (text: string, record: RouteItem) => (
          <span className="flex-center" style={{ maxWidth: '100%' }}>
            <AutoTooltip ghost title={text}>
              <span className="m-r-5">{text}</span>
            </AutoTooltip>
            <ModelTag categoryKey={record.categories?.[0]}></ModelTag>
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'routes.table.routeTargets' }),
        dataIndex: 'targets',
        span: 10,
        render: (value: number, record: RouteItem) => (
          <span>
            {record.ready_targets} / {value}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        span: 5,
        render: (value: string) => (
          <AutoTooltip ghost minWidth={20}>
            {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        span: 4,
        render: (value: string, record: RouteItem) => (
          <DropdownButtons
            items={filterActions(record)}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect, onCellClick]);
};

export default useAccessColumns;
