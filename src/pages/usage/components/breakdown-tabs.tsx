import { Tabs } from 'antd';
import React from 'react';
import { UsageFilterItem } from '../config/types';
import ApiKeysTable from '../tables/apikeys-table';
import ModelsTable from '../tables/models-table';
import UsersTable from '../tables/users-table';

type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;

const BreakdownTabs: React.FC<{
  dateRange: {
    start_date: string;
    end_date: string;
  };
  scope: string;
  filters: {
    models?: FilterOptionType[];
    users?: FilterOptionType[];
    api_keys?: FilterOptionType[];
  };
}> = ({ filters, dateRange, scope }) => {
  const items = [
    {
      key: 'models',
      label: 'Models',
      forceRender: true,
      children: (
        <ModelsTable
          models={filters.models || []}
          dateRange={dateRange}
          scope={scope}
        />
      )
    },
    {
      key: 'users',
      label: 'Users',
      forceRender: true,
      children: <UsersTable users={filters.users || []} dateRange={dateRange} />
    },
    {
      key: 'api_keys',
      label: 'API Keys',
      forceRender: true,
      children: (
        <ApiKeysTable
          apiKeys={filters.api_keys || []}
          dateRange={dateRange}
          scope={scope}
        />
      )
    }
  ].filter((item) => {
    if (item.key === 'users') {
      return scope === 'all';
    }
    return true;
  });

  return (
    <div style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="models" items={items} />
    </div>
  );
};
export default BreakdownTabs;
