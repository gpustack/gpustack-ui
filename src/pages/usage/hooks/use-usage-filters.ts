import { exportJsonToExcel } from '@gpustack/core-ui/excel';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { GroupOption } from '../config';
import { BreakdownItem, UsageFilterItem } from '../config/types';
import useQueryTimeSeriesData from '../services/use-query-timeseries-data';

const DefaultDateConfig = {
  defaultRange: 29
};

type UserOptionType = UsageFilterItem & {
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
  };
  chartFilters: {
    metric: string;
    group_by: string | null;
    granularity: string;
  };
  initialState?: {
    activeModels?: ValueType[][];
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
      models?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    };
    commonFilters: {
      scope: string;
      models: string[];
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
  const {
    activeModels: initialActiveModels = [],
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
    models: extractSelectedValues(initialActiveModels),
    users: initialUsers || [],
    api_keys: extractSelectedValues(initialActiveApiKeys),
    start_date:
      start_date ||
      dayjs()
        .subtract(DefaultDateConfig.defaultRange, 'days')
        .format('YYYY-MM-DD'),
    end_date: end_date || dayjs().format('YYYY-MM-DD')
  });

  const modelOptions = metaData?.models || [];
  const userOptions = metaData?.users || [];
  const apiKeyOptions = metaData?.api_keys || [];
  const [activeModels, setActiveModels] =
    useState<ValueType[][]>(initialActiveModels);
  const [activeApiKeys, setActiveApiKeys] =
    useState<ValueType[][]>(initialActiveApiKeys);

  useEffect(() => {
    if (!initialState) {
      return;
    }

    setActiveModels(initialActiveModels);
    setActiveApiKeys(initialActiveApiKeys);
    setCommonFilters((prev) => ({
      ...prev,
      scope: initialScope,
      models: extractSelectedValues(initialActiveModels),
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
    initialActiveModels,
    initialUsers,
    initialScope,
    initialState,
    start_date
  ]);

  const buildFilters = (selected: typeof commonFilters) => {
    const filters: {
      models?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    } = {};

    if (selected.models.length > 0) {
      const modelsSet = new Set(selected.models);
      filters.models = modelOptions
        .flatMap((group) =>
          group.children.filter((item) => modelsSet.has(item.value))
        )
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

  const filters = useMemo(
    () => buildFilters(commonFilters),
    [commonFilters, modelOptions, userOptions, apiKeyOptions]
  );

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

  const handleActiveModelsChange = (value: ValueType[][]) => {
    setActiveModels(value);
  };

  const handleActiveApiKeysChange = (value: ValueType[][]) => {
    setActiveApiKeys(value);
  };

  const handleFilterChange = (
    type: 'models' | 'users' | 'api_keys',
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
      | 'model'
      | 'api_key'
      | null;
    const metric = chartFilters.metric as keyof BreakdownItem;

    const dateMap: Record<string, Record<string, any>> = {};
    const groupLabels = new Set<string>();

    items.forEach((item) => {
      const date = item.date?.value;
      if (!date) return;
      const groupLabel = groupDim
        ? ((item[groupDim] as UsageFilterItem)?.label ?? '-')
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
    selectedModels: commonFilters.models,
    selectedUsers: commonFilters.users,
    selectedApiKeys: commonFilters.api_keys,
    modelOptions,
    userOptions,
    apiKeyOptions,
    activeApiKeys,
    activeModels,
    handleSearch,
    handleActiveModelsChange,
    handleActiveApiKeysChange,
    onScopeChange: handleScopeChange,
    onDateChange: handleDateChange,
    onModelsChange: (value: string[]) => handleFilterChange('models', value),
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
