import { getGPUStackPlugin } from '@/plugins';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useMemo } from 'react';
import { BreakdownFilters } from '../../config/types';
import ApiKeysTable from '../tables/apikeys-table';
import ModelsTable from '../tables/models-table';
import UsersTable from '../tables/users-table';

// A breakdown sub-tab contributed by a plugin (e.g. the enterprise
// Organization tab). ``isVisible`` is a PLAIN function (not a hook) called
// during render to gate the tab on the current context — the plugin reads any
// runtime state it needs non-reactively (e.g. the selected-org from storage),
// so the host never calls a hook in a loop (Rules of Hooks).
export interface BreakdownExtraTab {
  key: string;
  labelId: string;
  isVisible?: (ctx: { scope: string }) => boolean;
  Component: React.ComponentType<{
    filters: BreakdownFilters;
    dateRange: { start_date: string; end_date: string };
    scope: string;
    pageResetKey?: number;
    refreshKey?: number;
  }>;
}

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

  const extraTabs: BreakdownExtraTab[] =
    getGPUStackPlugin()?.usage?.breakdownExtraTabs ?? [];

  const items = useMemo(() => {
    const extraItems = extraTabs
      .filter((tab) => (tab.isVisible ? tab.isVisible({ scope }) : true))
      .map((tab) => {
        const Component = tab.Component;
        return {
          key: tab.key,
          label: intl.formatMessage({ id: tab.labelId }),
          forceRender: true,
          children: (
            <Component
              key={tab.key}
              filters={filters}
              dateRange={dateRange}
              scope={scope}
              pageResetKey={pageResetKey}
              refreshKey={refreshKey}
            />
          )
        };
      });

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
    ]
      .filter((item) => {
        if (item.key === 'users') {
          return scope === 'all';
        }
        return true;
      })
      .concat(extraItems);
  }, [filters, dateRange, pageResetKey, refreshKey, scope, extraTabs, intl]);

  return (
    <div style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="models" items={items} />
    </div>
  );
};
export default BreakdownTabs;
