import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import { ResourceBreakdownItem } from '../../apis/resource';
import { parseRollup } from '../../utils/time-buckets';

type GroupKey = 'volume' | 'user';

/**
 * Column factory for the storage breakdown tables, shared by the in-tab table
 * and the export preview. Sort indicators are uncontrolled (antd manages the
 * header arrows); the table reports changes through its `onChange`.
 */
const useStorageColumns = (groupKey: GroupKey) => {
  const intl = useIntl();

  return useMemo(() => {
    const valueCols = [
      {
        title: intl.formatMessage({ id: 'usage.metric.gbDays' }),
        dataIndex: 'storage_gb_days',
        key: 'storage_gb_days',
        sorter: true,
        render: (v: number) => (v ?? 0).toFixed(2)
      },
      {
        title: intl.formatMessage({ id: 'usage.metric.gbHours' }),
        dataIndex: 'storage_gb_hours',
        key: 'storage_gb_hours',
        sorter: true,
        render: (v: number) => (v ?? 0).toFixed(2)
      }
    ];
    // Last Active = the last active day. The backend sends a rollup-tz instant
    // with its offset; parseRollup keeps that wall clock (no browser-tz convert),
    // consistent with the trend chart buckets. Shown date-only.
    const lastActiveCol = {
      title: intl.formatMessage({ id: 'usage.table.lastActive' }),
      dataIndex: 'last_active',
      key: 'last_active',
      render: (v?: string) => (v ? parseRollup(v).format('YYYY-MM-DD') : '-')
    };
    if (groupKey === 'volume') {
      return [
        {
          title: intl.formatMessage({ id: 'usage.tabs.storage' }),
          dataIndex: 'volume_name',
          key: 'volume_name'
        },
        {
          title: intl.formatMessage({ id: 'usage.table.type' }),
          dataIndex: 'storage_type',
          key: 'storage_type',
          render: (_v: string, row: ResourceBreakdownItem) =>
            row.storage_type || row.gpu_type || '-'
        },
        {
          title: intl.formatMessage({ id: 'usage.table.capacity' }),
          dataIndex: 'capacity_mib',
          key: 'capacity_mib',
          render: (v?: number) => (v ? `${Math.round(v / 1024)}GB` : '-')
        },
        ...valueCols,
        lastActiveCol
      ];
    }
    return [
      {
        title: intl.formatMessage({ id: 'usage.table.user' }),
        dataIndex: 'user_name',
        key: 'user_name'
      },
      ...valueCols,
      {
        title: intl.formatMessage({ id: 'usage.metric.activeStorage' }),
        dataIndex: 'active_volumes',
        key: 'active_volumes'
      },
      lastActiveCol
    ];
  }, [groupKey, intl]);
};

export default useStorageColumns;
