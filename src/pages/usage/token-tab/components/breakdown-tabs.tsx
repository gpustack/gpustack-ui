import { getGPUStackPlugin } from '@/plugins';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useMemo } from 'react';
import { BreakdownFilters } from '../../config/types';
import ApiKeysTable from '../tables/apikeys-table';
import ModelsTable from '../tables/models-table';
import UsersTable from '../tables/users-table';

// A breakdown sub-tab contributed by a plugin (e.g. the enterprise
// Organization tab). ``useVisible`` is a React hook the host calls
// unconditionally per descriptor (stable array length → hook-safe) so the
// plugin can gate visibility on its own runtime state (e.g. platform-wide
// "All" context).
export interface BreakdownExtraTab {
  key: string;
  labelId: string;
  useVisible?: () => boolean;
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
  // Call each descriptor's visibility hook here (outside useMemo) so React's
  // rules of hooks hold; the plugin's array is stable, so call order is too.
  const extraVisible = extraTabs.map((tab) =>
    tab.useVisible ? tab.useVisible() : true
  );

  const items = useMemo(() => {
    const extraItems = extraTabs
      .map((tab, index) => ({ tab, visible: extraVisible[index] }))
      .filter(({ visible }) => visible)
      .map(({ tab }) => {
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
  }, [
    filters,
    dateRange,
    pageResetKey,
    refreshKey,
    scope,
    extraTabs,
    extraVisible,
    intl
  ]);

  return (
    <div style={{ marginTop: 16 }}>
      <Tabs defaultActiveKey="models" items={items} />
    </div>
  );
};
export default BreakdownTabs;
