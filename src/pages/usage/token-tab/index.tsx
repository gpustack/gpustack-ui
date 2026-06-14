import { baseColorMap } from '@/pages/dashboard/config';
import { formatLargeNumber } from '@/utils';
import { SimpleCard } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import React, { useEffect, useMemo, useState } from 'react';
import DailyUsage from '../components/daily-usage';
import ExportData from '../components/export-data';
import FilterBar from '../components/filter-bar';
import useExportTable from '../hooks/use-export-table';
import { useUsageFilters } from '../hooks/use-usage-filters';
import useQueryUsageMetaData from '../services/use-query-meta-data';
import BreakdownTabs from './components/breakdown-tabs';

type DateType = 'date' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Token Usage tab — the original ``/usage`` page wrapped so the parent
 * route can host it inside a ``Tabs`` shell alongside Resource / GPU
 * Instances / Storage / Summary panes.
 *
 * Body identical to the previous ``pages/usage/index.tsx``; only the
 * relative paths (``./components/...`` → ``./`` / ``./hooks`` →
 * ``../hooks`` / ``./services`` → ``../services``) were rewritten.
 */
const TokenTab: React.FC = () => {
  const intl = useIntl();
  const access = useAccess();
  const { exportTable } = useExportTable();
  const [openExportModal, setOpenExportModal] = useState(false);
  const [breakdownRefreshKey, setBreakdownRefreshKey] = useState(0);
  const [breakdownPageResetKey, setBreakdownPageResetKey] = useState(0);

  const summaryColumns = [
    {
      title: intl.formatMessage({ id: 'usage.filter.inputTokens' }),
      dataIndex: 'input_tokens',
      key: 'input_tokens'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.outputTokens' }),
      dataIndex: 'output_tokens',
      key: 'output_tokens'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.totalTokens' }),
      dataIndex: 'total_tokens',
      key: 'total_tokens'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.apiRequests' }),
      dataIndex: 'api_requests',
      key: 'api_requests'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.modelsUsed' }),
      dataIndex: 'models_called',
      key: 'models_called'
    }
  ];

  const [chartFilters, setChartFilters] = useState<{
    metric: string;
    group_by: string | null;
    granularity: string;
  }>({
    metric: 'total_tokens',
    group_by: null,
    granularity: 'day'
  });

  const { detailData: metaData, fetchData: fetchMetaData } =
    useQueryUsageMetaData();

  const { filters, commonFilters, fetchData, timeSeriesData, filterBar } =
    useUsageFilters({
      initialScope: access.canSeeOrgAdmin ? 'all' : 'self',
      metaData,
      chartFilters,
      summaryColumns
    });

  useEffect(() => {
    fetchMetaData();
    fetchData(commonFilters, chartFilters);
  }, []);

  const handleChartFilterChange = (type: string, value: string) => {
    setChartFilters((prev) => ({ ...prev, [type]: value }));
    fetchData(commonFilters, { ...chartFilters, [type]: value });
  };

  const summaryCards = useMemo(() => {
    const summary = timeSeriesData?.summary || {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      api_requests: 0,
      models_called: 0
    };
    return [
      {
        label: formatLargeNumber(summary.input_tokens) as string,
        value: intl.formatMessage({ id: 'usage.filter.inputTokens' }),
        color: baseColorMap.baseR3
      },
      {
        label: formatLargeNumber(summary.output_tokens) as string,
        value: intl.formatMessage({ id: 'usage.filter.outputTokens' }),
        color: baseColorMap.base
      },
      {
        label: formatLargeNumber(summary.total_tokens) as string,
        value: intl.formatMessage({ id: 'usage.filter.totalTokens' }),
        color: baseColorMap.baseL1
      },
      {
        label: formatLargeNumber(summary.api_requests) as string,
        value: intl.formatMessage({ id: 'usage.filter.apiRequests' }),
        color: baseColorMap.baseR1
      },
      {
        label: summary.models_called.toString(),
        value: intl.formatMessage({ id: 'usage.filter.modelsUsed' }),
        color: baseColorMap.baseR2
      }
    ];
  }, [timeSeriesData.summary]);

  const breakdownDateRange = useMemo(
    () => ({
      start_date: commonFilters.start_date,
      end_date: commonFilters.end_date
    }),
    [commonFilters.end_date, commonFilters.start_date]
  );

  const handlePickerChange = (picker: DateType) => {
    setChartFilters((prev) => ({
      ...prev,
      granularity: picker === 'date' ? 'day' : picker
    }));
  };

  const handleExportChart = () => {
    setOpenExportModal(true);
  };

  const handleSearch = () => {
    filterBar.handleSearch();
    setBreakdownRefreshKey((prev) => prev + 1);
  };

  const handleBreakdownPageReset = () => {
    setBreakdownPageResetKey((prev) => prev + 1);
  };

  return (
    <div>
      <FilterBar
        {...filterBar}
        onScopeChange={(value) => {
          filterBar.onScopeChange(value);
          handleBreakdownPageReset();
        }}
        onDateChange={(dates, dateStrings) => {
          filterBar.onDateChange(dates, dateStrings);
          handleBreakdownPageReset();
        }}
        onRoutesChange={(value) => {
          filterBar.onRoutesChange(value);
          handleBreakdownPageReset();
        }}
        onUsersChange={(value) => {
          filterBar.onUsersChange(value);
          handleBreakdownPageReset();
        }}
        onApiKeysChange={(value) => {
          filterBar.onApiKeysChange(value);
          handleBreakdownPageReset();
        }}
        handleSearch={handleSearch}
        handlePickerChange={handlePickerChange}
        onExportTable={exportTable}
        onExportChart={handleExportChart}
      />
      <div
        style={{
          marginBlock: 24
        }}
      >
        <SimpleCard
          dataList={summaryCards}
          height={80}
          styles={{
            item: {
              backgroundColor: 'var(--ant-color-fill-quaternary)',
              borderRadius: '6px'
            }
          }}
        />
      </div>
      <DailyUsage
        timeSeriesData={timeSeriesData}
        metric={chartFilters.metric}
        groupBy={chartFilters.group_by}
        granularity={chartFilters.granularity}
        startDate={commonFilters.start_date}
        endDate={commonFilters.end_date}
        onMetricChange={(value) => handleChartFilterChange('metric', value)}
        onGroupByChange={(value) =>
          handleChartFilterChange('group_by', value as string)
        }
        onGranularityChange={(value) =>
          handleChartFilterChange('granularity', value)
        }
      />
      <BreakdownTabs
        filters={filters}
        dateRange={breakdownDateRange}
        scope={commonFilters.scope}
        pageResetKey={breakdownPageResetKey}
        refreshKey={breakdownRefreshKey}
      ></BreakdownTabs>
      <ExportData
        metaData={metaData}
        granularity={chartFilters.granularity}
        initialScope={commonFilters.scope}
        commonFilters={commonFilters}
        open={openExportModal}
        handlePickerChange={handlePickerChange}
        onCancel={() => setOpenExportModal(false)}
        initialState={{
          activeRoutes: filterBar.selectedRoutes,
          activeApiKeys: filterBar.activeApiKeys,
          users: commonFilters.users,
          start_date: commonFilters.start_date,
          end_date: commonFilters.end_date
        }}
      ></ExportData>
    </div>
  );
};

export default TokenTab;
