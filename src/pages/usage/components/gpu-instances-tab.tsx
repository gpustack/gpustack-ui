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
import {
  buildInstanceTypeRecordFromMiB,
  renderInstanceType
} from '@/pages/gpu-service/instances/utils/render-instance-type';
import { formatLargeNumber } from '@/utils';
import { SimpleCard } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  queryGpuInstancesBreakdown,
  ResourceBreakdownItem,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse
} from '../apis/resource';
import useResourceMeta from '../hooks/use-resource-meta';
import { instanceTypeLabel } from '../utils/format-instance-type';
import {
  bucketKey,
  generateBucketRange,
  Granularity,
  parseRollup
} from '../utils/time-buckets';
import { buildTrendSeries } from '../utils/trend-series';
import MetricChartCard from './metric-chart-card';
import MetricLabel from './metric-label';
import ResourceExportData from './resource-export-data';
import ResourceFilterBar from './resource-filter-bar';

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

  const TABLE_TABS: { key: GroupKey; label: string }[] = useMemo(
    () => [
      {
        key: 'gpu_type',
        label: intl.formatMessage({ id: 'usage.table.instanceTypes' })
      },
      {
        key: 'instance',
        label: intl.formatMessage({ id: 'usage.table.instances' })
      },
      { key: 'user', label: intl.formatMessage({ id: 'usage.table.users' }) }
    ],
    [intl]
  );
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

  // Two independent fetches: one for the daily chart (group_by=date),
  // one for the table (group_by=tab key). Both reuse the same date /
  // scope filters so the views stay in sync.
  const [chartData, setChartData] = useState<ResourceBreakdownResponse | null>(
    null
  );
  const [tableData, setTableData] = useState<ResourceBreakdownResponse | null>(
    null
  );
  const [tablePage, setTablePage] = useState(1);
  // Server-side sort for the bottom tables; default GPU Hours, descending.
  const [tableSort, setTableSort] = useState<{
    field: Metric;
    order: 'ascend' | 'descend';
  }>({ field: 'gpu_hours', order: 'descend' });

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

  const fetchChart = async () => {
    try {
      const data = await queryGpuInstancesBreakdown({
        ...baseRequest(),
        // Split each bucket by the chosen dimension when grouping.
        group_by: chartGroupBy ? ['date', chartGroupBy] : ['date'],
        // A trend is a time series, not a paginated table: always fetch the
        // whole range. The default order is metric-desc, so partial (current/
        // recent) buckets have smaller values and would be pushed onto later
        // pages — dropping the newest hours from the chart under a small page.
        perPage: 10000
      });
      setChartData(data);
    } catch {
      // Network/auth errors surface via the global request interceptor;
      // keep the previous chart so the UI doesn't flash empty.
    }
  };

  const fetchTable = async () => {
    try {
      const data = await queryGpuInstancesBreakdown({
        ...baseRequest(),
        group_by: [activeTableTab],
        page: tablePage,
        order_by: tableSort.field,
        descending: tableSort.order === 'descend'
      });
      setTableData(data);
    } catch {
      // Same rationale as fetchChart.
    }
  };

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

  useEffect(() => {
    fetchTable();
  }, [
    dateRange,
    selectedUsers,
    selectedInstances,
    activeTableTab,
    tablePage,
    tableSort,
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
  // (Users only when org-wide, matching the table tabs).
  const chartGroupByOptions = useMemo(
    () =>
      TABLE_TABS.filter((t) => t.key !== 'user' || scope === 'all').map(
        (t) => ({
          value: t.key,
          label: t.label
        })
      ),
    [TABLE_TABS, scope]
  );

  // Table columns adapt to the active tab.
  const tableColumns = useMemo(() => {
    const baseValueCols = [
      {
        title: intl.formatMessage({ id: 'usage.metric.gpuHours' }),
        dataIndex: 'gpu_hours',
        key: 'gpu_hours',
        sorter: true,
        sortOrder: tableSort.field === 'gpu_hours' ? tableSort.order : null,
        render: (v: number) => (v ?? 0).toFixed(2)
      },
      {
        title: intl.formatMessage({ id: 'usage.metric.instanceHours' }),
        dataIndex: 'instance_hours',
        key: 'instance_hours',
        sorter: true,
        sortOrder:
          tableSort.field === 'instance_hours' ? tableSort.order : null,
        render: (v: number) => (v ?? 0).toFixed(2)
      }
    ];
    // Instance Types breakdown: just the pretty product name (or flavor slug
    // for older rows) — no spec sub-line.
    const instanceTypeColType = {
      title: intl.formatMessage({ id: 'usage.table.instanceType' }),
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) => instanceTypeLabel(row)
    };
    // Instances breakdown: render through the canonical GPU Instances list
    // renderer so the label + spec popover are identical. The breakdown row
    // carries flat MiB fields, so adapt it into the ListItem shape first.
    const instanceTypeColInstance = {
      title: intl.formatMessage({ id: 'usage.table.instanceType' }),
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) =>
        renderInstanceType(
          buildInstanceTypeRecordFromMiB({
            name: row.instance_name,
            product: row.product || row.gpu_type,
            gpuCount: row.gpu_count,
            unitCpuMilli: row.unit_cpu_milli,
            unitMemoryMib: row.unit_memory_mib,
            vramMib: row.vram_mib,
            localStorageMib: row.local_storage_mib,
            ephemeralMib: row.ephemeral_mib,
            persistentMib: row.persistent_mib
          }),
          { intl }
        )
    };
    // Last Active = the last active day. The backend sends a rollup-tz instant
    // with its offset; parseRollup keeps that wall clock (no browser-tz convert),
    // consistent with the trend chart buckets. Shown date-only.
    const lastActiveCol = {
      title: intl.formatMessage({ id: 'usage.table.lastActive' }),
      dataIndex: 'last_active',
      key: 'last_active',
      render: (v?: string) => (v ? parseRollup(v).format('YYYY-MM-DD') : '-')
    };
    if (activeTableTab === 'gpu_type') {
      return [
        instanceTypeColType,
        ...baseValueCols,
        {
          title: intl.formatMessage({ id: 'usage.metric.activeInstances' }),
          dataIndex: 'active_instances',
          key: 'active_instances'
        },
        lastActiveCol
      ];
    }
    if (activeTableTab === 'instance') {
      return [
        {
          title: intl.formatMessage({ id: 'usage.table.instance' }),
          dataIndex: 'instance_name',
          key: 'instance_name'
        },
        instanceTypeColInstance,
        ...baseValueCols,
        lastActiveCol
      ];
    }
    // user tab
    return [
      {
        title: intl.formatMessage({ id: 'usage.table.user' }),
        dataIndex: 'user_name',
        key: 'user_name'
      },
      ...baseValueCols,
      lastActiveCol
    ];
  }, [activeTableTab, tableSort, intl]);

  const tableRows: ResourceBreakdownItem[] = tableData?.items ?? [];

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
          columns: tableColumns,
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
          setTablePage(1);
        }}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        selectedUsers={selectedUsers}
        onUsersChange={(ids) => {
          setSelectedUsers(ids);
          setTablePage(1);
        }}
        resourceFilter={{
          options: instanceOptions,
          value: selectedInstances,
          onChange: (ids) => {
            setSelectedInstances(ids);
            setTablePage(1);
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
        />
      </div>

      {/* Bottom tabs + table */}
      <Tabs
        activeKey={activeTableTab}
        onChange={(k) => {
          setActiveTableTab(k as GroupKey);
          setTablePage(1);
        }}
        items={TABLE_TABS.filter(
          (t) => t.key !== 'user' || scope === 'all'
        ).map((t) => ({
          key: t.key,
          label: t.label,
          children: (
            <Table
              rowKey={(row) =>
                `${row.gpu_type ?? ''}|${row.instance_id ?? ''}|${row.user_id ?? ''}`
              }
              key={t.key}
              dataSource={tableRows}
              columns={tableColumns as any}
              onChange={(_pagination, _filters, sorter: any) => {
                const s = Array.isArray(sorter) ? sorter[0] : sorter;
                // Sort changed: reset to page 1. Cleared (3rd click) → default
                // back to GPU Hours descending.
                const next = s?.order
                  ? {
                      field: (s.columnKey as Metric) ?? 'gpu_hours',
                      order: s.order as 'ascend' | 'descend'
                    }
                  : { field: 'gpu_hours' as Metric, order: 'descend' as const };
                if (
                  next.field !== tableSort.field ||
                  next.order !== tableSort.order
                ) {
                  setTableSort(next);
                  setTablePage(1);
                }
              }}
              pagination={{
                size: 'middle',
                current: tablePage,
                pageSize: tableData?.pagination.perPage ?? 50,
                total: tableData?.pagination.total ?? 0,
                onChange: (p) => setTablePage(p)
              }}
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
