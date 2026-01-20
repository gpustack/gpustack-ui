// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { SealColumnProps } from '@/components/seal-table/types';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { rowActionList } from '../config';
import { AccessItem } from '../config/types';

const useAccessColumns = (
  handleSelect: (val: string, record: AccessItem) => void,
  onCellClick?: (record: AccessItem, dataIndex: string) => void
): SealColumnProps[] => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        span: 5,
        render: (text: string, record: AccessItem) => (
          <>
            <AutoTooltip ghost title={text}>
              {text}
            </AutoTooltip>
          </>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        span: 5
      },
      {
        title: intl.formatMessage({ id: 'accesses.table.accessPoints' }),
        dataIndex: 'accessPoints',
        span: 5,
        render: (value: number) => <span>{value}</span>
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
        render: (value: string, record: AccessItem) => (
          <DropdownButtons
            items={rowActionList}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [handleSelect, onCellClick]);
};

export default useAccessColumns;
