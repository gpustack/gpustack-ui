/**
 * GPU Instances Tab — per-instance compute usage view.
 *
 * Layout mirrors the existing Token tab:
 *   1. Top filter bar (date range + scope)
 *   2. KPI row (GPU-Hours / GPU-Minutes / Instances / GPU Types / Active Users)
 *   3. Daily bar chart with metric + group_by switches
 *   4. Bottom tab table grouped by GPU Type / Instance / User
 *
 * Talks to the new ``/usage/gpu-instances/{meta,breakdown}`` endpoints.
 */
import useCoolColors from '@/hooks/use-cool-colors';
import { formatLargeNumber } from '@/utils';
import { SimpleCard } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  queryGpuInstancesBreakdown,
  ResourceBreakdownRequest
} from '../apis/resource';
import MetricChartCard from '../components/metric-chart-card';
import MetricLabel from '../components/metric-label';
import ResourceExportData from '../components/resource-export-data';
import ResourceFilterBar from '../components/resource-filter-bar';
import useResourceMeta from '../hooks/use-resource-meta';
import {
  bucketKey,
  generateBucketRange,
  Granularity
} from '../utils/time-buckets';
import { buildTrendSeries } from '../utils/trend-series';
import useQueryGpuInstancesBreakdown from './services/use-query-gpu-instances-breakdown';
import InstancesBreakdownTable from './tables/instances-breakdown-table';
import useInstancesColumns from './tables/use-instances-columns';

type Scope = 'self' | 'all';
type Metric = 'gpu_hours' | 'instance_hours';
type GroupKey = 'gpu_type' | 'instance' | 'user';

const GpuInstancesTab: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();

  const METRIC_OPTIONS: { value: Metric; label: string }[] = useMemo(
    () => [
      {
        value: 'gpu_hours',
        label: intl.formatMessage({ id: 'usage.metric.gpuHours' })
      },
      {
        value: 'instance_hours',
        label: intl.formatMessage({ id: 'usage.metric.instanceHours' })
      }
    ],
    [intl]
  );

  const TABLE_TABS: { key: GroupKey; label: string }[] = useMemo(() => {
    const tabs = [
      {
        key: 'gpu_type' as GroupKey,
        label: intl.formatMessage({ id: 'usage.table.instanceTypes' })
      },
      {
        key: 'instance' as GroupKey,
        label: intl.formatMessage({ id: 'usage.table.instances' })
      }
    ];
    // Managers see the org-wide User breakdown; members only their own rows.
    if (access.canSeeOrgAdmin) {
      tabs.push({
        key: 'user' as GroupKey,
        label: intl.formatMessage({ id: 'usage.table.users' })
      });
    }
    return tabs;
  }, [intl, access.canSeeOrgAdmin]);
  // ``useCoolColors`` returns a memoized factory; resolve a fixed 5-slot
  // palette for the KPI cards, and keep the factory for the grouped trend
  // (sized to the group count).
  const colorFactory = useCoolColors();
  const coolColors = colorFactory(5);

  // No All/My dropdown (matches the Tokens tab): managers see the org-wide
  // view and narrow it with the user filter, others only their own rows.
  const canManageUsers = !!access.canSeeOrgAdmin;
  const scope: Scope = canManageUsers ? 'all' : 'self';

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs()
  ]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [metric, setMetric] = useState<Metric>('gpu_hours');
  const [granularity, setGranularity] = useState<Granularity>('day');
  // Optional trend group-by (split the chart into one series per group).
  const [chartGroupBy, setChartGroupBy] = useState<GroupKey | null>(null);
  // ``null`` group_by = no row grouping, just the summary KPIs.
  // The chart needs the ``date`` group; tables use the active table tab.
  const [activeTableTab, setActiveTableTab] = useState<GroupKey>('gpu_type');

  const { creators: userOptions, instances: instanceOptions } =
    useResourceMeta(scope);

  // The daily chart fetches group_by=date here; each bottom table owns its own
  // fetch (group_by=tab key) inside InstancesBreakdownTable. Bumped on any
  // filter change to snap every mounted table back to page 1.
  const [pageResetKey, setPageResetKey] = useState(0);

  const {
    detailData: chartData,
    loading: chartLoading,
    fetchData: fetchChartData
  } = useQueryGpuInstancesBreakdown({ key: 'gpuInstancesBreakdownChart' });

  const baseRequest = (): Omit<ResourceBreakdownRequest, 'group_by'> => ({
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
    scope,
    granularity,
    filters:
      selectedUsers.length || selectedInstances.length
        ? {
            ...(selectedUsers.length ? { creator_ids: selectedUsers } : {}),
            ...(selectedInstances.length
              ? { instance_ids: selectedInstances }
              : {})
          }
        : undefined,
    page: 1,
    perPage: 50
  });

  const fetchChart = () =>
    fetchChartData({
      ...baseRequest(),
      // Split each bucket by the chosen dimension when grouping.
      group_by: chartGroupBy ? ['date', chartGroupBy] : ['date'],
      // A trend is a time series, not a paginated table: always fetch the
      // whole range. The default order is metric-desc, so partial (current/
      // recent) buckets have smaller values and would be pushed onto later
      // pages — dropping the newest hours from the chart under a small page.
      perPage: 10000
    });

  useEffect(() => {
    fetchChart();
  }, [
    dateRange,
    selectedUsers,
    selectedInstances,
    granularity,
    chartGroupBy,
    refreshKey
  ]);

  // KPI summary cards — pull from the chart summary since both queries
  // return the same scope-wide totals.
  const summary = chartData?.summary;
  const summaryCards = useMemo(
    () => [
      {
        label: formatLargeNumber(
          Math.round((summary?.gpu_hours ?? 0) * 10) / 10
        ) as string,
        value: (
          <MetricLabel
            text={intl.formatMessage({ id: 'usage.metric.gpuHours' })}
            tooltip={intl.formatMessage({ id: 'usage.metric.gpuHours.tip' })}
          />
        ),
        color: coolColors[0]
      },
      {
        label: formatLargeNumber(
          Math.round((summary?.instance_hours ?? 0) * 10) / 10
        ) as string,
        value: (
          <MetricLabel
            text={intl.formatMessage({ id: 'usage.metric.instanceHours' })}
            tooltip={intl.formatMessage({
              id: 'usage.metric.instanceHours.tip'
            })}
          />
        ),
        color: coolColors[1]
      },
      {
        label: (summary?.active_instances ?? 0).toString(),
        value: intl.formatMessage({ id: 'usage.metric.activeInstances' }),
        color: coolColors[2]
      },
      {
        label: (summary?.active_users ?? 0).toString(),
        value: intl.formatMessage({ id: 'usage.metric.activeUsers' }),
        color: coolColors[3]
      }
    ],
    [summary, coolColors, intl]
  );

  // x-axis = the contiguous date range plus any buckets present in the data.
  const xAxis = useMemo(() => {
    const keys = new Set(
      generateBucketRange(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        granularity
      )
    );
    chartData?.items?.forEach((i) => {
      if (i.date) keys.add(bucketKey(i.date, granularity));
    });
    return Array.from(keys).sort();
  }, [chartData, dateRange, granularity]);

  // Single series, or one stacked series per group when grouping is on.
  const seriesData = useMemo(
    () =>
      buildTrendSeries({
        items: chartData?.items,
        metric,
        granularity,
        xAxis,
        groupBy: chartGroupBy,
        palette: colorFactory,
        singleName:
          METRIC_OPTIONS.find((m) => m.value === metric)?.label || metric
      }),
    [chartData, metric, granularity, xAxis, chartGroupBy, colorFactory]
  );

  // Group-by options for the trend = the same dimensions as the bottom tables
  // (TABLE_TABS already gates Users to org admins).
  const chartGroupByOptions = useMemo(
    () =>
      TABLE_TABS.map((t) => ({
        value: t.key,
        label: t.label
      })),
    [TABLE_TABS]
  );

  // Columns for the export preview of the active tab (sort arrows omitted —
  // the in-tab table owns its own sort state). Same factory the tables use.
  const exportTableColumns = useInstancesColumns(activeTableTab);

  // Export opens a preview modal (matches the Tokens tab): re-filter + preview
  // the rows, then download. "Chart" = the by-date trend, "Table" = the active
  // bottom-table grouping.
  const [exportMode, setExportMode] = useState<'chart' | 'table' | null>(null);
  const dateSuffix = `${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format(
    'YYYY-MM-DD'
  )}`;

  const chartExportColumns = [
    {
      title: intl.formatMessage({ id: 'usage.table.date' }),
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: intl.formatMessage({ id: 'usage.metric.gpuHours' }),
      dataIndex: 'gpu_hours',
      key: 'gpu_hours',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: intl.formatMessage({ id: 'usage.metric.instanceHours' }),
      dataIndex: 'instance_hours',
      key: 'instance_hours',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: intl.formatMessage({ id: 'usage.metric.activeInstances' }),
      dataIndex: 'active_instances',
      key: 'active_instances'
    },
    {
      title: intl.formatMessage({ id: 'usage.metric.activeUsers' }),
      dataIndex: 'active_users',
      key: 'active_users'
    }
  ];

  const tabLabel = TABLE_TABS.find((t) => t.key === activeTableTab)?.label;
  const exportConfig =
    exportMode === 'chart'
      ? {
          groupBy: ['date'],
          columns: chartExportColumns,
          fileName: `gpu-instances_chart_${dateSuffix}.xlsx`,
          sheetName: intl.formatMessage({ id: 'usage.tabs.gpuInstances' })
        }
      : {
          groupBy: [activeTableTab],
          columns: exportTableColumns,
          fileName: `gpu-instances_${activeTableTab}_${dateSuffix}.xlsx`,
          sheetName: tabLabel || 'gpu-instances'
        };

  return (
    <div>
      {/* Top filter row */}
      <ResourceFilterBar
        value={dateRange}
        onChange={(dates) => {
          setDateRange(dates);
          setPageResetKey((k) => k + 1);
        }}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        selectedUsers={selectedUsers}
        onUsersChange={(ids) => {
          setSelectedUsers(ids);
          setPageResetKey((k) => k + 1);
        }}
        resourceFilter={{
          options: instanceOptions,
          value: selectedInstances,
          onChange: (ids) => {
            setSelectedInstances(ids);
            setPageResetKey((k) => k + 1);
          },
          placeholder: intl.formatMessage({ id: 'usage.filter.instance' })
        }}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        onExportChart={() => setExportMode('chart')}
        onExportTable={() => setExportMode('table')}
      />

      {/* KPI cards */}
      <div style={{ height: 24 }} />
      <div style={{ marginBottom: 24 }}>
        <SimpleCard
          dataList={summaryCards}
          height={80}
          styles={{
            item: {
              backgroundColor: 'var(--ant-color-fill-quaternary)',
              borderRadius: 6
            }
          }}
        />
      </div>

      {/* Daily trend chart */}
      <div style={{ marginBottom: 24 }}>
        <MetricChartCard
          metric={metric}
          metricOptions={METRIC_OPTIONS}
          granularity={granularity}
          onMetricChange={(v) => setMetric(v as Metric)}
          onGranularityChange={(v) => setGranularity(v as Granularity)}
          seriesData={seriesData}
          xAxisData={xAxis}
          groupBy={chartGroupBy}
          groupByOptions={chartGroupByOptions}
          onGroupByChange={(v) => setChartGroupBy(v as GroupKey | null)}
          loading={chartLoading}
        />
      </div>

      {/* Bottom tabs + table */}
      <Tabs
        activeKey={activeTableTab}
        onChange={(k) => setActiveTableTab(k as GroupKey)}
        items={TABLE_TABS.map((t) => ({
          key: t.key,
          label: t.label,
          // Keep every pane mounted so each table holds its own page/sort and
          // switching tabs neither refetches nor resets the others.
          forceRender: true,
          children: (
            <InstancesBreakdownTable
              key={t.key}
              groupKey={t.key}
              dateRange={dateRange}
              scope={scope}
              selectedUsers={selectedUsers}
              selectedInstances={selectedInstances}
              pageResetKey={pageResetKey}
              refreshKey={refreshKey}
            />
          )
        }))}
      />

      <ResourceExportData
        open={exportMode !== null}
        onCancel={() => setExportMode(null)}
        title={
          exportMode === 'chart'
            ? intl.formatMessage({ id: 'usage.export.chart' })
            : intl.formatMessage(
                { id: 'usage.export.tableNamed' },
                { name: tabLabel }
              )
        }
        queryFn={queryGpuInstancesBreakdown}
        groupBy={exportConfig.groupBy}
        columns={exportConfig.columns}
        fileName={exportConfig.fileName}
        sheetName={exportConfig.sheetName}
        scope={scope}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        resourceFilter={{
          options: instanceOptions,
          placeholder: intl.formatMessage({ id: 'usage.filter.instance' }),
          key: 'instance_ids'
        }}
        initialDateRange={dateRange}
        initialSelectedUsers={selectedUsers}
        initialSelectedResources={selectedInstances}
      />
    </div>
  );
};

export default GpuInstancesTab;
