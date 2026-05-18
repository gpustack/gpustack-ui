import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useMemo } from 'react';
import { UsageFilterItem } from '../config/types';
import ApiKeysTable from '../tables/apikeys-table';
import ModelsTable from '../tables/models-table';
import UsersTable from '../tables/users-table';

type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;
const EMPTY_FILTERS: FilterOptionType[] = [];

const BreakdownTabs: React.FC<{
  dateRange: {
    start_date: string;
    end_date: string;
  };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
  filters: {
    routes?: FilterOptionType[];
    users?: FilterOptionType[];
    api_keys?: FilterOptionType[];
  };
}> = ({ filters, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
  const intl = useIntl();
  const routes = filters.routes || EMPTY_FILTERS;
  const users = filters.users || EMPTY_FILTERS;
  const apiKeys = filters.api_keys || EMPTY_FILTERS;

  const items = useMemo(() => {
    return [
      {
        key: 'models',
        label: intl.formatMessage({ id: 'usage.tabs.models' }),
        forceRender: true,
        children: (
          <ModelsTable
            key="models"
            routes={routes}
            dateRange={dateRange}
            scope={scope}
            pageResetKey={pageResetKey}
            refreshKey={refreshKey}
          />
        )
      },
      {
        key: 'users',
        label: intl.formatMessage({ id: 'usage.tabs.users' }),
        forceRender: true,
        children: (
          <UsersTable
            key="users"
            users={users}
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
            apiKeys={apiKeys}
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
  }, [apiKeys, dateRange, routes, pageResetKey, refreshKey, scope, users]);

  return (
    <div style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="models" items={items} />
    </div>
  );
};
export default BreakdownTabs;
