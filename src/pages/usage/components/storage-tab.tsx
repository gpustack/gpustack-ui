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
import { useAccess } from '@umijs/max';
import { Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  queryStorageBreakdown,
  ResourceBreakdownItem,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse
} from '../apis/resource';
import useResourceMeta from '../hooks/use-resource-meta';
import {
  bucketKey,
  generateBucketRange,
  Granularity
} from '../utils/time-buckets';
import MetricChartCard from './metric-chart-card';
import ResourceExportData from './resource-export-data';
import ResourceFilterBar from './resource-filter-bar';

type Scope = 'self' | 'all';
type Metric = 'storage_gb_days' | 'storage_gb_hours';
type GroupKey = 'volume' | 'user';

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'storage_gb_days', label: 'GB-Days' },
  { value: 'storage_gb_hours', label: 'GB-Hours' }
];

const TABLE_TABS: { key: GroupKey; label: string }[] = [
  { key: 'volume', label: 'Storage' },
  { key: 'user', label: 'Users' }
];

const StorageTab: React.FC = () => {
  const access = useAccess();
  const coolColors = useCoolColors()(4);

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
        group_by: 'date'
      });
      setChartData(data);
    } catch {
      // Surfacing handled by global interceptor; keep last data.
    }
  };

  const fetchTable = async () => {
    try {
      const data = await queryStorageBreakdown({
        ...baseRequest(),
        group_by: activeTableTab,
        page: tablePage
      });
      setTableData(data);
    } catch {
      // Same rationale.
    }
  };

  useEffect(() => {
    fetchChart();
  }, [dateRange, selectedUsers, selectedVolumes, granularity, refreshKey]);

  useEffect(() => {
    fetchTable();
  }, [
    dateRange,
    selectedUsers,
    selectedVolumes,
    activeTableTab,
    tablePage,
    refreshKey
  ]);

  const summary = chartData?.summary;
  const summaryCards = useMemo(
    () => [
      {
        label: formatLargeNumber(
          Math.round((summary?.storage_gb_days ?? 0) * 10) / 10
        ) as string,
        value: 'GB-Days',
        color: coolColors[0]
      },
      {
        label: formatLargeNumber(
          Math.round((summary?.storage_gb_hours ?? 0) * 10) / 10
        ) as string,
        value: 'GB-Hours',
        color: coolColors[1]
      },
      {
        label: (summary?.active_volumes ?? 0).toString(),
        value: 'Storage',
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

  const tableColumns = useMemo(() => {
    const valueCols = [
      {
        title: 'GB-Days',
        dataIndex: 'storage_gb_days',
        key: 'storage_gb_days',
        render: (v: number) => (v ?? 0).toFixed(2)
      },
      {
        title: 'GB-Hours',
        dataIndex: 'storage_gb_hours',
        key: 'storage_gb_hours',
        render: (v: number) => (v ?? 0).toFixed(2)
      }
    ];
    if (activeTableTab === 'volume') {
      return [
        {
          title: 'Storage',
          dataIndex: 'volume_name',
          key: 'volume_name'
        },
        ...valueCols,
        { title: 'Last Active', dataIndex: 'last_active', key: 'last_active' }
      ];
    }
    return [
      { title: 'User', dataIndex: 'user_name', key: 'user_name' },
      ...valueCols,
      {
        title: 'Active Storage',
        dataIndex: 'active_volumes',
        key: 'active_volumes'
      },
      { title: 'Last Active', dataIndex: 'last_active', key: 'last_active' }
    ];
  }, [activeTableTab]);

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
      title: 'GB-Days',
      dataIndex: 'storage_gb_days',
      key: 'storage_gb_days',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: 'GB-Hours',
      dataIndex: 'storage_gb_hours',
      key: 'storage_gb_hours',
      render: (v: number) => (v ?? 0).toFixed(2)
    },
    {
      title: 'Active Volumes',
      dataIndex: 'active_volumes',
      key: 'active_volumes'
    },
    { title: 'Active Users', dataIndex: 'active_users', key: 'active_users' }
  ];

  const tabLabel = TABLE_TABS.find((t) => t.key === activeTableTab)?.label;
  const exportConfig =
    exportMode === 'chart'
      ? {
          groupBy: 'date' as const,
          columns: chartExportColumns,
          fileName: `storage_chart_${dateSuffix}.xlsx`,
          sheetName: 'Storage'
        }
      : {
          groupBy: activeTableTab,
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
          placeholder: 'Filter by storage'
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
          placeholder: 'Filter by storage',
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
