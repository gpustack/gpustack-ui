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
import InstanceTypeCell from '@/pages/gpu-service/instances/components/instance-type-cell';
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
import {
  instanceTypeLabel,
  instanceTypeSections,
  instanceTypeTitle
} from '../utils/format-instance-type';
import {
  bucketKey,
  generateBucketRange,
  Granularity
} from '../utils/time-buckets';
import MetricChartCard from './metric-chart-card';
import MetricLabel from './metric-label';
import ResourceExportData from './resource-export-data';
import ResourceFilterBar from './resource-filter-bar';

type Scope = 'self' | 'all';
type Metric = 'gpu_hours' | 'instance_hours';
type GroupKey = 'gpu_type' | 'instance' | 'user';

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'gpu_hours', label: 'GPU Hours' },
  { value: 'instance_hours', label: 'Instance Hours' }
];

const TABLE_TABS: { key: GroupKey; label: string }[] = [
  { key: 'gpu_type', label: 'Instance Types' },
  { key: 'instance', label: 'Instances' },
  { key: 'user', label: 'Users' }
];

const GpuInstancesTab: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  // ``useCoolColors`` returns a memoized factory; resolve it once into a
  // fixed 5-slot palette here so the rest of the component reads as
  // array access.
  const coolColors = useCoolColors()(5);

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
        group_by: 'date'
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
        group_by: activeTableTab,
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
  }, [dateRange, selectedUsers, selectedInstances, granularity, refreshKey]);

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
            text="GPU Hours"
            tooltip="Instance running time weighted by GPU count: an instance with N GPUs running for H hours counts as N × H GPU-hours. Equal to Instance Hours when every instance uses a single GPU."
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
            text="Instance Hours"
            tooltip="Total running time summed across all instances, regardless of how many GPUs each uses. One instance running for 2 hours = 2 instance-hours."
          />
        ),
        color: coolColors[1]
      },
      {
        label: (summary?.active_instances ?? 0).toString(),
        value: 'Active Instances',
        color: coolColors[2]
      },
      {
        label: (summary?.active_users ?? 0).toString(),
        value: 'Active Users',
        color: coolColors[3]
      }
    ],
    [summary, coolColors]
  );

  // Build chart series — single series of the selected metric, plotted
  // along the contiguous date range.
  const dataByDate = useMemo(() => {
    const map = new Map<string, number>();
    chartData?.items?.forEach((item) => {
      if (!item.date) return;
      map.set(bucketKey(item.date, granularity), Number(item[metric] ?? 0));
    });
    return map;
  }, [chartData, metric, granularity]);
  const xAxis = useMemo(() => {
    const keys = new Set(
      generateBucketRange(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        granularity
      )
    );
    dataByDate.forEach((_v, k) => keys.add(k));
    return Array.from(keys).sort();
  }, [dataByDate, dateRange, granularity]);

  const seriesData = [
    {
      name: METRIC_OPTIONS.find((m) => m.value === metric)?.label || metric,
      data: xAxis.map((d) => dataByDate.get(d) ?? 0),
      color: coolColors[0]
    }
  ];

  // Table columns adapt to the active tab.
  const tableColumns = useMemo(() => {
    const baseValueCols = [
      {
        title: 'GPU Hours',
        dataIndex: 'gpu_hours',
        key: 'gpu_hours',
        sorter: true,
        sortOrder: tableSort.field === 'gpu_hours' ? tableSort.order : null,
        render: (v: number) => (v ?? 0).toFixed(2)
      },
      {
        title: 'Instance Hours',
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
      title: 'Instance Type',
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) => instanceTypeLabel(row)
    };
    // Instances breakdown: render exactly like the GPU Instances list —
    // "<product> x <count>" plus the categorized spec popover behind the icon.
    const instanceTypeColInstance = {
      title: 'Instance Type',
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) => (
        <InstanceTypeCell
          title={instanceTypeTitle(row)}
          name={row.instance_name}
          sections={instanceTypeSections(row, {
            vram: intl.formatMessage({ id: 'gpuservice.instance.memory' }),
            disk: intl.formatMessage({ id: 'gpuservice.instance.disk' })
          })}
        />
      )
    };
    if (activeTableTab === 'gpu_type') {
      return [
        instanceTypeColType,
        ...baseValueCols,
        {
          title: 'Active Instances',
          dataIndex: 'active_instances',
          key: 'active_instances'
        },
        { title: 'Last Active', dataIndex: 'last_active', key: 'last_active' }
      ];
    }
    if (activeTableTab === 'instance') {
      return [
        { title: 'Instance', dataIndex: 'instance_name', key: 'instance_name' },
        instanceTypeColInstance,
        ...baseValueCols,
        { title: 'Last Active', dataIndex: 'last_active', key: 'last_active' }
      ];
    }
    // user tab
    return [
      { title: 'User', dataIndex: 'user_name', key: 'user_name' },
      ...baseValueCols,
      { title: 'Last Active', dataIndex: 'last_active', key: 'last_active' }
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
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'GPU Hours',
      dataIndex: 'gpu_hours',
      key: 'gpu_hours',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: 'Instance Hours',
      dataIndex: 'instance_hours',
      key: 'instance_hours',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: 'Active Instances',
      dataIndex: 'active_instances',
      key: 'active_instances'
    },
    { title: 'Active Users', dataIndex: 'active_users', key: 'active_users' }
  ];

  const tabLabel = TABLE_TABS.find((t) => t.key === activeTableTab)?.label;
  const exportConfig =
    exportMode === 'chart'
      ? {
          groupBy: 'date' as const,
          columns: chartExportColumns,
          fileName: `gpu-instances_chart_${dateSuffix}.xlsx`,
          sheetName: 'GPU Instances'
        }
      : {
          groupBy: activeTableTab,
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
          placeholder: 'Filter by instance'
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
            ? 'Export Chart Data'
            : `Export Table Data — ${tabLabel}`
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
          placeholder: 'Filter by instance',
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
