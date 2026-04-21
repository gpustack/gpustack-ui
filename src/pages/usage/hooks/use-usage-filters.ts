import { exportJsonToExcel } from '@/utils/excel-reader';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  generateColumns,
  GroupOption,
  transformTimelineToTable
} from '../config';
import { UsageFilterItem } from '../config/types';
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
  initialState: {
    activeModels: initialActiveModels = [],
    activeApiKeys: initialActiveApiKeys = []
  } = {},

  autoFetchOnFilterChange = true,
  onFetchData
}: UseUsageFiltersParams) => {
  const {
    detailData: timeSeriesData,
    loading,
    fetchData: fetchTimeSeriesData
  } = useQueryTimeSeriesData();
  const [commonFilters, setCommonFilters] = useState({
    scope: initialScope,
    models: [] as string[],
    users: [] as string[],
    api_keys: [] as string[],
    start_date: dayjs()
      .subtract(DefaultDateConfig.defaultRange, 'days')
      .format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  });

  const modelOptions = metaData?.models || [];
  const userOptions = metaData?.users || [];
  const apiKeyOptions = metaData?.api_keys || [];
  const [activeModels, setActiveModels] =
    useState<ValueType[][]>(initialActiveModels);
  const [activeApiKeys, setActiveApiKeys] =
    useState<ValueType[][]>(initialActiveApiKeys);

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

    fetchTimeSeriesData({
      ...currentChartFilters,
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
    const columns = generateColumns(timeSeriesData?.series || []);
    const tableData = transformTimelineToTable(timeSeriesData?.series || []);

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
