import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useMemo } from 'react';
import { BreakdownFilters } from '../../config/types';
import ApiKeysTable from '../tables/apikeys-table';
import ModelsTable from '../tables/models-table';
import UsersTable from '../tables/users-table';

const BreakdownTabs: React.FC<{
  dateRange: {
    start_date: string;
    end_date: string;
  };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
  filters: BreakdownFilters;
}> = ({ filters, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
  const intl = useIntl();

  const items = useMemo(() => {
    return [
      {
        key: 'models',
        label: intl.formatMessage({ id: 'usage.tabs.models' }),
        forceRender: true,
        children: (
          <ModelsTable
            key="models"
            filters={filters}
            dateRange={dateRange}
            scope={scope}
            pageResetKey={pageResetKey}
            refreshKey={refreshKey}
          />
        )
      },
      {
        key: 'users',
        label: intl.formatMessage({ id: 'usage.table.users' }),
        forceRender: true,
        children: (
          <UsersTable
            key="users"
            filters={filters}
            dateRange={dateRange}
            scope={scope}
            pageResetKey={pageResetKey}
            refreshKey={refreshKey}
          />
        )
      },
      {
        key: 'api_keys',
        label: intl.formatMessage({ id: 'usage.tabs.apikeys' }),
        forceRender: true,
        children: (
          <ApiKeysTable
            key="api_keys"
            filters={filters}
            dateRange={dateRange}
            scope={scope}
            pageResetKey={pageResetKey}
            refreshKey={refreshKey}
          />
        )
      }
    ].filter((item) => {
      if (item.key === 'users') {
        return scope === 'all';
      }
      return true;
    });
  }, [filters, dateRange, pageResetKey, refreshKey, scope]);

  return (
    <div style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="models" items={items} />
    </div>
  );
};
export default BreakdownTabs;
