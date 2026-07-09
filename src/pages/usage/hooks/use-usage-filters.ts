import { exportJsonToExcel } from '@gpustack/core-ui/excel';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { GroupOption } from '../config';
import { BreakdownItem, UsageFilterItem } from '../config/types';
import useQueryTimeSeriesData from '../services/use-query-timeseries-data';
import { withDeletedMark } from '../utils/deleted-label';

// group dimension → the id field inside ``identity.current`` (null for deleted
// entities on the Tokens tab, so the marker degrades to just "[Deleted]").
const GROUP_ID_KEY: Record<string, 'route_id' | 'user_id' | 'api_key_id'> = {
  route: 'route_id',
  user: 'user_id',
  api_key: 'api_key_id'
};

const DefaultDateConfig = {
  defaultRange: 29
};

type UserOptionType = UsageFilterItem & {
  value: string;
};
type RouteOptionType = UsageFilterItem & {
  value: string;
};
type ValueType = string | number | null;

type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;
type GroupOptionType = GroupOption<UsageFilterItem>;

interface UseUsageFiltersParams {
  initialScope: string;
  metaData: {
    models?: GroupOptionType[];
    users?: UserOptionType[];
    api_keys?: GroupOptionType[];
    routes?: RouteOptionType[];
  };
  chartFilters: {
    metric: string;
    group_by: string | null;
    granularity: string;
  };
  initialState?: {
    activeRoutes?: string[];
    activeApiKeys?: ValueType[][];
    users?: string[];
    start_date?: string;
    end_date?: string;
  };
  summaryColumns: {
    title: string;
    dataIndex: string;
    key: string;
  }[];
  autoFetchOnFilterChange?: boolean;
  onFetchData?: (params: {
    chartFilters: UseUsageFiltersParams['chartFilters'];
    filters: {
      routes?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    };
    commonFilters: {
      scope: string;
      routes: string[];
      users: string[];
      api_keys: string[];
      start_date: string;
      end_date: string;
    };
  }) => void;
}

export const useUsageFilters = ({
  initialScope,
  metaData,
  chartFilters,
  summaryColumns,
  initialState,
  autoFetchOnFilterChange = true,
  onFetchData
}: UseUsageFiltersParams) => {
  const intl = useIntl();
  const {
    activeRoutes: initialActiveRoutes = [],
    activeApiKeys: initialActiveApiKeys = [],
    users: initialUsers = [],
    start_date = '',
    end_date = ''
  } = initialState || {};
  const {
    detailData: timeSeriesData,
    loading,
    fetchData: fetchTimeSeriesData
  } = useQueryTimeSeriesData();

  const extractSelectedValues = (value: ValueType[][] = []) =>
    value.map((item) => {
      if (Array.isArray(item)) {
        return item[item.length - 1] as string;
      }

      return item as string;
    });

  const [commonFilters, setCommonFilters] = useState({
    scope: initialScope,
    routes: initialActiveRoutes,
    users: initialUsers || [],
    api_keys: extractSelectedValues(initialActiveApiKeys),
    start_date:
      start_date ||
      dayjs()
        .subtract(DefaultDateConfig.defaultRange, 'days')
        .format('YYYY-MM-DD'),
    end_date: end_date || dayjs().format('YYYY-MM-DD')
  });

  const routeOptions = metaData?.routes || [];
  const userOptions = metaData?.users || [];
  const apiKeyOptions = metaData?.api_keys || [];
  const [activeApiKeys, setActiveApiKeys] =
    useState<ValueType[][]>(initialActiveApiKeys);

  useEffect(() => {
    if (!initialState) {
      return;
    }

    setActiveApiKeys(initialActiveApiKeys);
    setCommonFilters((prev) => ({
      ...prev,
      scope: initialScope,
      routes: initialActiveRoutes,
      users: initialUsers || [],
      api_keys: extractSelectedValues(initialActiveApiKeys),
      start_date:
        start_date ||
        dayjs()
          .subtract(DefaultDateConfig.defaultRange, 'days')
          .format('YYYY-MM-DD'),
      end_date: end_date || dayjs().format('YYYY-MM-DD')
    }));
  }, [
    end_date,
    initialActiveApiKeys,
    initialActiveRoutes,
    initialUsers,
    initialScope,
    initialState,
    start_date
  ]);

  const buildFilters = (selected: typeof commonFilters) => {
    const filters: {
      routes?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    } = {};

    if (selected.routes.length > 0) {
      const routesSet = new Set(selected.routes);
      filters.routes = routeOptions
        .filter((item) => routesSet.has(item.value))
        .map((item) => ({
          identity: item.identity
        }));
    }

    if (selected.users.length > 0) {
      filters.users = userOptions
        .filter((item) => selected.users.includes(item.value || ''))
        .map((item) => ({
          identity: item.identity
        }));
    }

    if (selected.api_keys.length > 0) {
      const apiKeysSet = new Set(selected.api_keys);
      filters.api_keys = apiKeyOptions
        .flatMap((group) =>
          group.children.filter((item) => apiKeysSet.has(item.value))
        )
        .map((item) => ({
          identity: item.identity
        }));
    }

    return filters;
  };

  // Keep a stable reference while the content is unchanged. ``buildFilters``
  // returns a fresh object every render — and again when the meta options
  // resolve after mount — which would otherwise retrigger every breakdown
  // table's fetch effect a second time on first load. Only a real selection
  // change (or options resolving a previously-selected id) should swap it.
  const filtersRef = useRef<ReturnType<typeof buildFilters>>({});
  const nextFilters = buildFilters(commonFilters);
  if (!_.isEqual(nextFilters, filtersRef.current)) {
    filtersRef.current = nextFilters;
  }
  const filters = filtersRef.current;

  const fetchData = (
    currentSelectedFilters = commonFilters,
    currentChartFilters = chartFilters
  ) => {
    const nextFilters = buildFilters(currentSelectedFilters);

    if (onFetchData) {
      onFetchData({
        chartFilters: currentChartFilters,
        filters: nextFilters,
        commonFilters: currentSelectedFilters
      });
      return;
    }

    const groupByArray = currentChartFilters.group_by
      ? ['date', currentChartFilters.group_by]
      : ['date'];

    fetchTimeSeriesData({
      ...currentChartFilters,
      group_by: groupByArray,
      // The trend chart needs the complete date series. ``page: -1`` is the
      // backend's no-pagination sentinel — without it the default page (20
      // buckets, sorted by total tokens) drops low-traffic dates, leaving
      // gaps in the chart for ranges spanning more than a handful of buckets.
      page: -1,
      // Without ``scope`` the backend defaults to ``all``, while the
      // breakdown tables pass ``scope`` explicitly. The mismatch makes
      // the chart and the tables run different filters on the same
      // page — an Org owner viewing a cross-Org-granted model sees the
      // chart empty while the tables render the same usage.
      scope: currentSelectedFilters.scope,
      start_date: currentSelectedFilters.start_date,
      end_date: currentSelectedFilters.end_date,
      filters: nextFilters
    });
  };

  const handleScopeChange = (value: string) => {
    const next = { ...commonFilters, scope: value };
    setCommonFilters(next);
    if (autoFetchOnFilterChange) {
      fetchData(next, chartFilters);
    }
  };

  const handleDateChange = (_: any, dateStrings: [string, string]) => {
    console.log('Selected Time: ', dateStrings);
    const [start_date, end_date] = dateStrings;
    const next = { ...commonFilters, start_date, end_date };
    setCommonFilters(next);
    if (autoFetchOnFilterChange) {
      fetchData(next, chartFilters);
    }
  };

  const handleActiveApiKeysChange = (value: ValueType[][]) => {
    setActiveApiKeys(value);
  };

  const handleFilterChange = (
    type: 'routes' | 'users' | 'api_keys',
    value: string[]
  ) => {
    const selectedValues: string[] = value.map((item) => {
      if (Array.isArray(item)) {
        return item[item.length - 1] as string; // Get the last value in the array
      }
      return item as string;
    });

    const next = { ...commonFilters, [type]: selectedValues };
    setCommonFilters(next);
    if (autoFetchOnFilterChange) {
      fetchData(next, chartFilters);
    }
  };

  const handleSearch = () => {
    fetchData(commonFilters, chartFilters);
  };

  const handleOnExportChart = () => {
    const items = timeSeriesData?.items || [];
    const groupDim = chartFilters.group_by as
      | 'user'
      | 'route'
      | 'api_key'
      | null;
    const metric = chartFilters.metric as keyof BreakdownItem;

    const dateMap: Record<string, Record<string, any>> = {};
    const groupLabels = new Set<string>();
    const deletedWord = intl.formatMessage({ id: 'usage.table.deleted' });

    items.forEach((item) => {
      const date = item.date?.value;
      if (!date) return;
      const groupEntity = groupDim
        ? (item[groupDim] as UsageFilterItem)
        : undefined;
      const groupLabel = groupDim
        ? withDeletedMark(
            groupEntity?.label ?? '-',
            groupEntity?.deleted,
            deletedWord,
            groupEntity?.identity?.current?.[GROUP_ID_KEY[groupDim]]
          )
        : metric;
      groupLabels.add(groupLabel);
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][groupLabel] = item[metric];
    });

    const tableData = Object.values(dateMap).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );

    const columns = [
      { title: 'Date', dataIndex: 'date' },
      ...Array.from(groupLabels).map((label) => ({
        title: label,
        dataIndex: label
      }))
    ];

    exportJsonToExcel({
      fileName: `${chartFilters.metric}_${chartFilters.group_by}_${chartFilters.granularity}_${commonFilters.start_date}_${commonFilters.end_date}.xlsx`,
      sheets: [
        {
          jsonData: tableData,
          sheetName: chartFilters.metric,
          fields: columns.map((col) => col.dataIndex).filter(Boolean),
          fieldLabels: Object.fromEntries(
            columns.map((col) => [col.dataIndex, col.title])
          ),
          formatMap: {}
        },
        {
          jsonData: [timeSeriesData?.summary || {}],
          sheetName: 'summary',
          fields: summaryColumns.map((col) => col.dataIndex),
          fieldLabels: Object.fromEntries(
            summaryColumns.map((col) => [col.dataIndex, col.title])
          ),
          formatMap: {}
        }
      ]
    });
  };

  const filterBar = {
    scope: commonFilters.scope,
    startDate: commonFilters.start_date,
    endDate: commonFilters.end_date,
    selectedRoutes: commonFilters.routes,
    selectedUsers: commonFilters.users,
    selectedApiKeys: commonFilters.api_keys,
    routeOptions,
    userOptions,
    apiKeyOptions,
    activeApiKeys,
    handleSearch,
    handleActiveApiKeysChange,
    onScopeChange: handleScopeChange,
    onDateChange: handleDateChange,
    onRoutesChange: (value: string[]) => handleFilterChange('routes', value),
    onUsersChange: (value: string[]) => handleFilterChange('users', value),
    onApiKeysChange: (value: string[]) => handleFilterChange('api_keys', value),
    onExportChart: handleOnExportChart
  };

  return {
    filters,
    loading,
    commonFilters,
    timeSeriesData,
    fetchData,
    filterBar
  };
};
