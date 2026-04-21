import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useMemo } from 'react';
import { GroupOption } from '../config';
import { UsageFilterItem } from '../config/types';
import ApiKeysTable from '../tables/apikeys-table';
import ModelsTable from '../tables/models-table';
import UsersTable from '../tables/users-table';

type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;
type GroupOptionType = GroupOption<UsageFilterItem>;
const EMPTY_FILTERS: FilterOptionType[] = [];

const BreakdownTabs: React.FC<{
  dateRange: {
    start_date: string;
    end_date: string;
  };
  scope: string;
  refreshKey?: number;
  filters: {
    models?: FilterOptionType[];
    users?: FilterOptionType[];
    api_keys?: FilterOptionType[];
  };
}> = ({ filters, dateRange, scope, refreshKey = 0 }) => {
  const intl = useIntl();
  const models = filters.models || EMPTY_FILTERS;
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
            models={models}
            dateRange={dateRange}
            scope={scope}
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
  }, [apiKeys, dateRange, models, refreshKey, scope, users]);

  return (
    <div style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="models" items={items} />
    </div>
  );
};
export default BreakdownTabs;
