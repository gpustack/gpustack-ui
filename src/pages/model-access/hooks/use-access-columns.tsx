// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import { SealColumnProps } from '@/components/seal-table/types';
import { tableSorter } from '@/config/settings';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  maasProviderLabelMap,
  providerIconsMap,
  rowActionList
} from '../config';
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
            {record.builtIn && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                BuiltIn
              </Tag>
            )}
          </>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        span: 5,
        render: (value: string) => (
          <>
            <IconFont
              type={providerIconsMap[value]}
              style={{ marginRight: 8, fontSize: 16 }}
            ></IconFont>
            <AutoTooltip ghost minWidth={20}>
              {maasProviderLabelMap[value]}
            </AutoTooltip>
          </>
        )
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
