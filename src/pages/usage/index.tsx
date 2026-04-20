import { SimpleCard } from '@/components/card-wrapper/simple-card';
import { baseColorMap } from '@/pages/dashboard/config';
import { formatLargeNumber } from '@/utils';
import { useModel } from '@@/plugin-model';
import React, { useEffect, useMemo, useState } from 'react';
import BreakdownTabs from './components/breakdown-tabs';
import DailyUsage from './components/daily-usage';
import ExportData from './components/export-data';
import FilterBar from './components/filter-bar';
import useExportTable from './hooks/use-export-table';
import { useUsageFilters } from './hooks/use-usage-filters';
import useQueryUsageMetaData from './services/use-query-meta-data';

const Usage: React.FC = () => {
  const initialInfo = useModel('@@initialState');
  const { initialState } = initialInfo || {};
  const { exportTable } = useExportTable();
  const [openExportModal, setOpenExportModal] = useState(false);

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

  const { detailData: metaData, fetchData: fetchMetaData } =
    useQueryUsageMetaData();

  const { filters, commonFilters, fetchData, timeSeriesData, filterBar } =
    useUsageFilters({
      initialScope: initialState?.currentUser?.is_admin ? 'all' : 'self',
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
        value: 'Input tokens',
        color: baseColorMap.baseR3
        // iconType: 'roundRect'
      },
      {
        label: formatLargeNumber(summary.output_tokens) as string,
        value: 'Output tokens',
        color: baseColorMap.base
        // iconType: 'roundRect'
      },
      {
        label: formatLargeNumber(summary.total_tokens) as string,
        value: 'Total tokens',
        color: baseColorMap.baseL1
        // iconType: 'roundRect'
      },
      {
        label: formatLargeNumber(summary.api_requests) as string,
        value: 'API requests',
        color: baseColorMap.baseR1
        // iconType: 'circle'
      },
      {
        label: summary.models_called.toString(),
        value: 'Models used',
        color: baseColorMap.baseR2
        // iconType: 'roundRect'
      }
    ];
  }, [timeSeriesData.summary]);

  const handleExportChart = () => {
    setOpenExportModal(true);
  };

  return (
    <div>
      <FilterBar
        {...filterBar}
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
              borderBottom: '1px solid var(--ant-color-split)',
              backgroundColor: 'var(--ant-color-fill-quaternary)',
              borderRadius: '6px 6px 0 0'
            }
          }}
        />
      </div>
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
        dateRange={{
          start_date: commonFilters.start_date,
          end_date: commonFilters.end_date
        }}
        scope={commonFilters.scope}
      ></BreakdownTabs>
      <ExportData
        metaData={metaData}
        initialScope={commonFilters.scope}
        open={openExportModal}
        onCancel={() => setOpenExportModal(false)}
      ></ExportData>
    </div>
  );
};

export default Usage;
