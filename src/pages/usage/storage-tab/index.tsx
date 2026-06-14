/**
 * Storage Tab — per-PV capacity usage view.
 *
 * Mirrors the GPU Instances Tab structure:
 *   1. Top filter bar (date range + scope)
 *   2. KPI row (GB-Days / GB-Hours / Active Volumes / Dangling Volumes)
 *   3. Daily bar chart with metric switch
 *   4. Bottom tab table grouped by Volume / User
 *
 * Talks to ``/usage/storage/{meta,breakdown}``. PV is lifecycle-gated
 * (capacity is metered from CREATED to DELETED regardless of attach state),
 * so there's no phase filter — just date / scope / volume / user.
 */
import useCoolColors from '@/hooks/use-cool-colors';
import { formatLargeNumber } from '@/utils';
import { SimpleCard } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  queryStorageBreakdown,
  ResourceBreakdownItem,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse
} from '../apis/resource';
import MetricChartCard from '../components/metric-chart-card';
import MetricLabel from '../components/metric-label';
import ResourceExportData from '../components/resource-export-data';
import ResourceFilterBar from '../components/resource-filter-bar';
import useResourceMeta from '../hooks/use-resource-meta';
import {
  bucketKey,
  generateBucketRange,
  Granularity,
  parseRollup
} from '../utils/time-buckets';
import { buildTrendSeries } from '../utils/trend-series';

type Scope = 'self' | 'all';
type Metric = 'storage_gb_days' | 'storage_gb_hours';
type GroupKey = 'volume' | 'user';

const StorageTab: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  // Factory kept for the grouped trend (sized to group count); 4-slot palette
  // for the KPI cards.
  const colorFactory = useCoolColors();
  const coolColors = colorFactory(4);

  const METRIC_OPTIONS: { value: Metric; label: string }[] = useMemo(
    () => [
      {
        value: 'storage_gb_days',
        label: intl.formatMessage({ id: 'usage.metric.gbDays' })
      },
      {
        value: 'storage_gb_hours',
        label: intl.formatMessage({ id: 'usage.metric.gbHours' })
      }
    ],
    [intl]
  );

  const TABLE_TABS: { key: GroupKey; label: string }[] = useMemo(
    () => [
      {
        key: 'volume',
        label: intl.formatMessage({ id: 'usage.tabs.storage' })
      },
      { key: 'user', label: intl.formatMessage({ id: 'usage.table.users' }) }
    ],
    [intl]
  );

  // No All/My dropdown (matches the Tokens tab): managers see the org-wide
  // view and narrow it with the user filter, others only their own rows.
  const canManageUsers = !!access.canSeeOrgAdmin;
  const scope: Scope = canManageUsers ? 'all' : 'self';

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs()
  ]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedVolumes, setSelectedVolumes] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [metric, setMetric] = useState<Metric>('storage_gb_days');
  const [granularity, setGranularity] = useState<Granularity>('day');
  // Optional trend group-by (split the chart into one series per group).
  const [chartGroupBy, setChartGroupBy] = useState<GroupKey | null>(null);
  const [activeTableTab, setActiveTableTab] = useState<GroupKey>('volume');

  const { creators: userOptions, volumes: volumeOptions } =
    useResourceMeta(scope);

  const [chartData, setChartData] = useState<ResourceBreakdownResponse | null>(
    null
  );
  const [tableData, setTableData] = useState<ResourceBreakdownResponse | null>(
    null
  );
  const [tablePage, setTablePage] = useState(1);
  // Server-side sort for the bottom tables; default GB-Days, descending.
  const [tableSort, setTableSort] = useState<{
    field: Metric;
    order: 'ascend' | 'descend';
  }>({ field: 'storage_gb_days', order: 'descend' });

  const baseRequest = (): Omit<ResourceBreakdownRequest, 'group_by'> => ({
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
    scope,
    granularity,
    filters:
      selectedUsers.length || selectedVolumes.length
        ? {
            ...(selectedUsers.length ? { creator_ids: selectedUsers } : {}),
            ...(selectedVolumes.length ? { volume_ids: selectedVolumes } : {})
          }
        : undefined,
    page: 1,
    perPage: 50
  });

  const fetchChart = async () => {
    try {
      const data = await queryStorageBreakdown({
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
      // Surfacing handled by global interceptor; keep last data.
    }
  };

  // The frontend metric keys (storage_gb_days/hours) map to the server's
  // breakdown metric keys (gb_days/gb_hours) for order_by.
  const ORDER_BY_KEY: Record<Metric, string> = {
    storage_gb_days: 'gb_days',
    storage_gb_hours: 'gb_hours'
  };

  const fetchTable = async () => {
    try {
      const data = await queryStorageBreakdown({
        ...baseRequest(),
        group_by: [activeTableTab],
        page: tablePage,
        order_by: ORDER_BY_KEY[tableSort.field],
        descending: tableSort.order === 'descend'
      });
      setTableData(data);
    } catch {
      // Same rationale.
    }
  };

  useEffect(() => {
    fetchChart();
  }, [
    dateRange,
    selectedUsers,
    selectedVolumes,
    granularity,
    chartGroupBy,
    refreshKey
  ]);

  useEffect(() => {
    fetchTable();
  }, [
    dateRange,
    selectedUsers,
    selectedVolumes,
    activeTableTab,
    tablePage,
    tableSort,
    refreshKey
  ]);

  const summary = chartData?.summary;
  const summaryCards = useMemo(
    () => [
      {
        label: formatLargeNumber(
          Math.round((summary?.storage_gb_days ?? 0) * 10) / 10
        ) as string,
        value: (
          <MetricLabel
            text={intl.formatMessage({ id: 'usage.metric.gbDays' })}
            tooltip={intl.formatMessage({ id: 'usage.metric.gbDays.tip' })}
          />
        ),
        color: coolColors[0]
      },
      {
        label: formatLargeNumber(
          Math.round((summary?.storage_gb_hours ?? 0) * 10) / 10
        ) as string,
        value: (
          <MetricLabel
            text={intl.formatMessage({ id: 'usage.metric.gbHours' })}
            tooltip={intl.formatMessage({ id: 'usage.metric.gbHours.tip' })}
          />
        ),
        color: coolColors[1]
      },
      {
        label: (summary?.active_volumes ?? 0).toString(),
        value: intl.formatMessage({ id: 'usage.tabs.storage' }),
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
    [
      chartData,
      metric,
      granularity,
      xAxis,
      chartGroupBy,
      colorFactory,
      METRIC_OPTIONS
    ]
  );

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

  const tableColumns = useMemo(() => {
    const valueCols = [
      {
        title: intl.formatMessage({ id: 'usage.metric.gbDays' }),
        dataIndex: 'storage_gb_days',
        key: 'storage_gb_days',
        sorter: true,
        sortOrder:
          tableSort.field === 'storage_gb_days' ? tableSort.order : null,
        render: (v: number) => (v ?? 0).toFixed(2)
      },
      {
        title: intl.formatMessage({ id: 'usage.metric.gbHours' }),
        dataIndex: 'storage_gb_hours',
        key: 'storage_gb_hours',
        sorter: true,
        sortOrder:
          tableSort.field === 'storage_gb_hours' ? tableSort.order : null,
        render: (v: number) => (v ?? 0).toFixed(2)
      }
    ];
    // Last Active = the last active day. The backend sends a rollup-tz instant
    // with its offset; parseRollup keeps that wall clock (no browser-tz convert),
    // consistent with the trend chart buckets. Shown date-only.
    const lastActiveCol = {
      title: intl.formatMessage({ id: 'usage.table.lastActive' }),
      dataIndex: 'last_active',
      key: 'last_active',
      render: (v?: string) => (v ? parseRollup(v).format('YYYY-MM-DD') : '-')
    };
    if (activeTableTab === 'volume') {
      return [
        {
          title: intl.formatMessage({ id: 'usage.tabs.storage' }),
          dataIndex: 'volume_name',
          key: 'volume_name'
        },
        {
          title: intl.formatMessage({ id: 'usage.table.type' }),
          dataIndex: 'storage_type',
          key: 'storage_type',
          render: (_v: string, row: ResourceBreakdownItem) =>
            row.storage_type || row.gpu_type || '-'
        },
        {
          title: intl.formatMessage({ id: 'usage.table.capacity' }),
          dataIndex: 'capacity_mib',
          key: 'capacity_mib',
          render: (v?: number) => (v ? `${Math.round(v / 1024)}GB` : '-')
        },
        ...valueCols,
        lastActiveCol
      ];
    }
    return [
      {
        title: intl.formatMessage({ id: 'usage.table.user' }),
        dataIndex: 'user_name',
        key: 'user_name'
      },
      ...valueCols,
      {
        title: intl.formatMessage({ id: 'usage.metric.activeStorage' }),
        dataIndex: 'active_volumes',
        key: 'active_volumes'
      },
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
      title: intl.formatMessage({ id: 'usage.metric.gbDays' }),
      dataIndex: 'storage_gb_days',
      key: 'storage_gb_days',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: intl.formatMessage({ id: 'usage.metric.gbHours' }),
      dataIndex: 'storage_gb_hours',
      key: 'storage_gb_hours',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: intl.formatMessage({ id: 'usage.metric.activeVolumes' }),
      dataIndex: 'active_volumes',
      key: 'active_volumes'
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
          fileName: `storage_chart_${dateSuffix}.xlsx`,
          sheetName: intl.formatMessage({ id: 'usage.tabs.storage' })
        }
      : {
          groupBy: [activeTableTab],
          columns: tableColumns,
          fileName: `storage_${activeTableTab}_${dateSuffix}.xlsx`,
          sheetName: tabLabel || 'storage'
        };

  return (
    <div>
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
          options: volumeOptions,
          value: selectedVolumes,
          onChange: (ids) => {
            setSelectedVolumes(ids);
            setTablePage(1);
          },
          placeholder: intl.formatMessage({ id: 'usage.filter.storage' })
        }}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        onExportChart={() => setExportMode('chart')}
        onExportTable={() => setExportMode('table')}
      />
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
                `${row.volume_id ?? ''}|${row.user_id ?? ''}|${row.volume_name ?? ''}`
              }
              dataSource={tableRows}
              columns={tableColumns as any}
              onChange={(_pagination, _filters, sorter: any) => {
                const s = Array.isArray(sorter) ? sorter[0] : sorter;
                // Sort changed → page 1; cleared (3rd click) → default GB-Days
                // descending.
                const next = s?.order
                  ? {
                      field: (s.columnKey as Metric) ?? 'storage_gb_days',
                      order: s.order as 'ascend' | 'descend'
                    }
                  : {
                      field: 'storage_gb_days' as Metric,
                      order: 'descend' as const
                    };
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
        queryFn={queryStorageBreakdown}
        groupBy={exportConfig.groupBy}
        columns={exportConfig.columns}
        fileName={exportConfig.fileName}
        sheetName={exportConfig.sheetName}
        scope={scope}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        resourceFilter={{
          options: volumeOptions,
          placeholder: intl.formatMessage({ id: 'usage.filter.storage' }),
          key: 'volume_ids'
        }}
        initialDateRange={dateRange}
        initialSelectedUsers={selectedUsers}
        initialSelectedResources={selectedVolumes}
      />
    </div>
  );
};

export default StorageTab;
