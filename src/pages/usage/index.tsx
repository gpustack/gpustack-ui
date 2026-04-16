import { exportJsonToExcel } from '@/utils/excel-reader';
import { useModel } from '@@/plugin-model';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import BreakdownTabs from './components/breakdown-tabs';
import DailyUsage from './components/daily-usage';
import FilterBar from './components/filter-bar';
import { generateColumns, transformTimelineToTable } from './config';
import { UsageFilterItem } from './config/types';
import useExportTable from './hooks/use-export-table';
import useQueryUsageMetaData from './services/use-query-meta-data';
import useQueryTimeSeriesData from './services/use-query-timeseries-data';

const DefaultDateConfig = {
  defaultRange: 29
};

type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;

const Usage: React.FC = () => {
  const initialInfo = useModel('@@initialState');
  const { initialState } = initialInfo || {};
  const { exportTable } = useExportTable();

  const summaryColumns = [
    {
      title: 'Input Tokens',
      dataIndex: 'input_tokens',
      key: 'input_tokens'
    },
    {
      title: 'Output Tokens',
      dataIndex: 'output_tokens',
      key: 'output_tokens'
    },
    {
      title: 'Total Tokens',
      dataIndex: 'total_tokens',
      key: 'total_tokens'
    },
    {
      title: 'API Requests',
      dataIndex: 'api_requests',
      key: 'api_requests'
    },
    {
      title: 'Models Used',
      dataIndex: 'models_called',
      key: 'models_called'
    }
  ];

  const [chartFilters, setChartFilters] = useState<{
    metric: string;
    group_by: string;
    granularity: string;
  }>({
    metric: 'total_tokens',
    group_by: 'model',
    granularity: 'day'
  });
  const [commonFilters, setCommonFilters] = useState<{
    models: string[];
    users: string[];
    api_keys: string[];
    start_date: string;
    end_date: string;
    scope: string;
  }>({
    scope: initialState?.currentUser?.is_admin ? 'all' : 'self',
    models: [],
    users: [],
    api_keys: [],
    start_date: dayjs()
      .subtract(DefaultDateConfig.defaultRange, 'days')
      .format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  });

  const { detailData: metaData, fetchData: fetchMetaData } =
    useQueryUsageMetaData();
  const { detailData: timeSeriesData, fetchData: fetchTimeSeriesData } =
    useQueryTimeSeriesData();

  const modelOptions = metaData?.models || [];
  const userOptions = metaData?.users || [];
  const apiKeyOptions = metaData?.api_keys || [];

  const buildFilters = (selected: {
    models: string[];
    users: string[];
    api_keys: string[];
  }) => {
    const filters: {
      models?: FilterOptionType[];
      users?: FilterOptionType[];
      api_keys?: FilterOptionType[];
    } = {};

    if (selected.models?.length > 0) {
      // filter the options
      filters.models = modelOptions
        .filter((item) => selected.models?.includes(item.value || ''))
        .map((item) => ({
          identity: item.identity
        }));
    }

    if (selected.users?.length > 0) {
      filters.users = userOptions
        .filter((item) => selected.users?.includes(item.value || ''))
        .map((item) => ({
          identity: item.identity
        }));
    }

    if (selected.api_keys?.length > 0) {
      filters.api_keys = apiKeyOptions
        .filter((item) => selected.api_keys?.includes(item.value || ''))
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
    fetchTimeSeriesData({
      ...currentChartFilters,
      start_date: currentSelectedFilters.start_date,
      end_date: currentSelectedFilters.end_date,
      filters: buildFilters(currentSelectedFilters)
    });
  };

  useEffect(() => {
    fetchMetaData();
    fetchData(commonFilters, chartFilters);
  }, []);

  const handleScopeChange = (value: string) => {
    setCommonFilters((prev) => ({ ...prev, scope: value }));
    fetchData(
      {
        ...commonFilters,
        scope: value
      },
      chartFilters
    );
  };

  const handleDateChange = (_dates: any, dateStrings: [string, string]) => {
    const [start_date, end_date] = dateStrings;
    setCommonFilters((prev) => ({ ...prev, start_date, end_date }));
    fetchData({ ...commonFilters, start_date, end_date }, chartFilters);
  };

  const handleFilterChange = (type: string, value: string[]) => {
    setCommonFilters((prev) => ({ ...prev, [type]: value }));
    fetchData({ ...commonFilters, [type]: value }, chartFilters);
  };

  const handleChartFilterChange = (type: string, value: string) => {
    setChartFilters((prev) => ({ ...prev, [type]: value }));
    fetchData(commonFilters, { ...chartFilters, [type]: value });
  };

  console.log('timeSeriesData:', timeSeriesData);

  const handleOnExportChart = () => {
    const columns = generateColumns(timeSeriesData.series);
    const tableData = transformTimelineToTable(timeSeriesData.series);
    exportJsonToExcel({
      fileName: `${chartFilters.metric}_${chartFilters.group_by}_${chartFilters.granularity}_${commonFilters.start_date}_${commonFilters.end_date}.xlsx`,
      sheets: [
        {
          jsonData: tableData || [],
          sheetName: `${chartFilters.metric}`,
          fields: columns
            .map((col) => col.dataIndex)
            .filter(Boolean) as string[],
          fieldLabels: columns.reduce(
            (map, col) => {
              map[col.dataIndex] = col.title;
              return map;
            },
            {} as Record<string, any>
          ),
          formatMap: {}
        },
        {
          jsonData: [timeSeriesData.summary || {}],
          sheetName: `summary`,
          fields: summaryColumns
            .map((col) => col.dataIndex)
            .filter(Boolean) as string[],
          fieldLabels: summaryColumns.reduce(
            (map, col) => {
              map[col.dataIndex] = col.title;
              return map;
            },
            {} as Record<string, any>
          ),
          formatMap: {}
        }
      ]
    });
  };

  return (
    <div>
      <FilterBar
        scope={commonFilters.scope}
        startDate={commonFilters.start_date}
        endDate={commonFilters.end_date}
        selectedModels={commonFilters.models || []}
        selectedUsers={commonFilters.users || []}
        selectedApiKeys={commonFilters.api_keys || []}
        modelOptions={metaData?.models || []}
        userOptions={metaData?.users || []}
        apiKeyOptions={metaData?.api_keys || []}
        handleSearch={fetchData}
        onScopeChange={handleScopeChange}
        onDateChange={handleDateChange}
        onModelsChange={(value) => handleFilterChange('models', value)}
        onUsersChange={(value) => handleFilterChange('users', value)}
        onApiKeysChange={(value) => handleFilterChange('api_keys', value)}
        onExportChart={handleOnExportChart}
        onExportTable={exportTable}
      />
      <DailyUsage
        timeSeriesData={timeSeriesData}
        metric={chartFilters.metric}
        groupBy={chartFilters.group_by}
        granularity={chartFilters.granularity}
        onMetricChange={(value) => handleChartFilterChange('metric', value)}
        onGroupByChange={(value) => handleChartFilterChange('group_by', value)}
        onGranularityChange={(value) =>
          handleChartFilterChange('granularity', value)
        }
      />
      <BreakdownTabs
        filters={filters}
        dateRange={commonFilters}
        scope={commonFilters.scope}
      ></BreakdownTabs>
    </div>
  );
};

export default Usage;
