/**
 * Summary Tab — cross-resource overview, organized by domain.
 *
 * Token and time-based resources carry different detail, so the page is three
 * symmetric full-width domain sections instead of a flat KPI stack. Each
 * section is identical in shape: a headline stat line, then a breakdown donut
 * (left) and a fixed-metric trend (right). A single granularity control at the
 * top is shared by all three trends.
 *
 *   ● Tokens   headline · Input/Output donut · Tokens-over-time
 *   ● Compute  headline · GPU-type donut    · GPU-Hours-over-time
 *   ● Storage  headline · storage-type donut · GB-Days-over-time
 *
 * Data sources (all share date + scope):
 *   - /usage/summary             → token totals (Input/Output) + GPU-type donut
 *   - /usage/breakdown (tokens)  → Tokens trend (token series is daily-only)
 *   - /usage/resource/breakdown  → Compute trend + active instances
 *   - /usage/storage/breakdown   → Storage trend, volumes, type donut
 *
 * Shows quantity metrics only (no cost). Donuts use
 * each domain's natural unit (tokens / GPU-Hours / GB-Days); a true
 * cross-resource split needs a common unit.
 */
import { useCoolAccents } from '@/hooks/use-cool-colors';
import BarChart from '@/pages/_components/bar-chart';
import PieChart from '@/pages/_components/pie-chart';
import { formatLargeNumber } from '@/utils';
import { useModel } from '@@/plugin-model';
import { CardWrapper } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import ResourceFilterBar from '../components/resource-filter-bar';
import { FilterOptionType } from '../config/types';
import useResourceMeta, { SelectOption } from '../hooks/use-resource-meta';
import useQueryUsageMetaData from '../services/use-query-meta-data';
import {
  bucketKey,
  generateBucketRange,
  Granularity
} from '../utils/time-buckets';
import useQueryResourceBreakdown from './services/use-query-resource-breakdown';
import useQueryStorageBreakdown from './services/use-query-storage-breakdown';
import useQueryTimeSeriesData from './services/use-query-timeseries-data';
import useQueryUsageSummary from './services/use-query-usage-summary';

type Scope = 'self' | 'all';

type QueryParams = {
  start: string;
  end: string;
  selectedUsers: number[];
};

// Round to at most 2 decimals everywhere (avoid 1.60999999… in the donut center).
const round2 = (n?: number) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (n?: number) => formatLargeNumber(round2(n));

// Tick/tooltip label for a trend's x-axis, per granularity.
const trendLabel = (gran: Granularity) => (v: any) =>
  gran === 'hour'
    ? dayjs(v).format('MM-DD HH:00')
    : gran === 'month'
      ? dayjs(v).format('YYYY-MM')
      : dayjs(v).format('MM-DD');

// Collapse {date,value} rows onto a contiguous bucketed x-axis.
const buildTrend = (
  rows: { date?: string; value: number }[],
  gran: Granularity,
  start: string,
  end: string
): { xAxis: string[]; data: number[] } => {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    if (!r.date) return;
    const k = bucketKey(r.date, gran);
    map.set(k, (map.get(k) ?? 0) + r.value);
  });
  // The x-axis is strictly the selected [start, end] range. We deliberately do
  // NOT union in the data's own bucket keys: on a date-range change the new
  // start/end render a frame before the in-flight request resolves, so `map`
  // still holds the previous range's dates — merging them would briefly show a
  // union of both ranges (a gap + doubled axis). Dropping out-of-range points is
  // safe for the `day` granularity used here, since generateBucketRange already
  // emits every in-range day; revisit this if week/month granularity is added
  // (their bucket keys can fall outside the stepped range).
  const xAxis = generateBucketRange(start, end, gran);
  return { xAxis, data: xAxis.map((k) => map.get(k) ?? 0) };
};

// A secondary "label · value" fragment for the headline line.
const Stat: React.FC<{ value: React.ReactNode; label: string }> = ({
  value,
  label
}) => (
  <span style={{ whiteSpace: 'nowrap' }}>
    <span className="font-600">{value}</span>{' '}
    <span className="text-secondary" style={{ fontSize: 13 }}>
      {label}
    </span>
  </span>
);

// One compact card per domain: accent + title + headline stats on a single
// row, then a donut (left, legend hugging it) beside a trend (right) that
// carries its own chart title — no wasteful caption rows.
const DomainSection: React.FC<{
  pieLoading?: boolean;
  barLoading?: boolean;
  title: string;
  accent: string;
  headline: React.ReactNode;
  donutData: { name: string; value: number }[];
  donutTotalLabel: string;
  trendTitle: string;
  trendXAxis: string[];
  trendData: number[];
  trendColor: string;
  trendGran: Granularity;
}> = ({
  pieLoading,
  barLoading,
  title,
  accent,
  headline,
  donutData,
  donutTotalLabel,
  trendTitle,
  trendXAxis,
  trendData,
  trendColor,
  trendGran
}) => {
  const donutTotal = round2(donutData.reduce((s, d) => s + (d.value || 0), 0));

  const seriesData = useMemo(() => {
    return [{ name: trendTitle, data: trendData, color: trendColor }].filter(
      (s) => s.data.some((v) => !!v)
    );
  }, [trendData, trendColor]);

  return (
    <CardWrapper style={{ paddingBlock: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          rowGap: 4,
          flexWrap: 'wrap',
          marginBottom: 12
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 4,
              height: 14,
              borderRadius: 2,
              background: accent
            }}
          />
          <span className="font-600" style={{ fontSize: 15 }}>
            {title}
          </span>
        </span>
        <span style={{ display: 'inline-flex', gap: 16, flexWrap: 'wrap' }}>
          {headline}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ width: 340, maxWidth: '100%', flexShrink: 0 }}>
          <PieChart
            loading={pieLoading}
            data={donutData}
            height={180}
            total={donutTotal}
            totalLabel={donutTotalLabel}
          />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <BarChart
            loading={barLoading}
            seriesData={seriesData}
            xAxisData={trendXAxis}
            height={180}
            grid={{
              bottom: 0
            }}
            title={trendTitle}
            labelFormatter={trendLabel(trendGran)}
            tooltipValueFormatter={(v) =>
              formatLargeNumber(round2(Number(v))) as string
            }
          />
        </div>
      </div>
    </CardWrapper>
  );
};

const SummaryTab: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const currentUserId = initialState?.currentUser?.id;
  const t = (id: string) => intl.formatMessage({ id });
  // One vivid primary per summary card (Tokens / Compute / Storage).
  const coolColors = useCoolAccents()(3);

  // No All/My dropdown (matches the Tokens tab): managers see the org-wide
  // view and narrow it with the user filter, others only their own rows.
  const canManageUsers = !!access.canSeeOrgAdmin;
  const scope: Scope = canManageUsers ? 'all' : 'self';
  // Summary trends are fixed to a daily granularity (no granularity control).
  const granularity: Granularity = 'day';

  // Date range + user filter live together: every fetch keys off all three, so
  // a single object keeps them in sync and trims the dependency arrays.
  const [queryParams, setQueryParams] = useState<{
    start: string;
    end: string;
    selectedUsers: number[];
  }>({
    start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
    selectedUsers: []
  });
  const { start, end, selectedUsers } = queryParams;
  const { creators: resourceUsers } = useResourceMeta(scope);
  const { detailData: tokenMeta, fetchData: fetchTokenMeta } =
    useQueryUsageMetaData();

  // The user filter unions two sources: resource creators (GPU / storage
  // usage) and the token-usage users (/usage/meta) — a user may appear in only
  // one. Deduped by user id. The token meta also carries the per-user identity
  // the token-series endpoint filters on (see ``tokenUserById``).
  const userOptions = useMemo<SelectOption[]>(() => {
    const map = new Map<number, SelectOption>();
    resourceUsers.forEach((u) =>
      map.set(u.value, {
        value: u.value,
        label: u.label,
        deleted: u.deleted,
        isCurrent: u.isCurrent
      })
    );
    (tokenMeta?.users || []).forEach((u) => {
      const id = u.identity.current?.user_id;
      if (id == null) return;
      const existing = map.get(id);
      if (existing) {
        // A user in both sources is deleted if either marks it so, so the
        // dropdown still shows the DeletedTag.
        if (u.deleted) existing.deleted = true;
        return;
      }
      map.set(id, {
        value: id,
        label: u.label,
        deleted: u.deleted,
        isCurrent: currentUserId != null && id === currentUserId
      });
    });
    // Sort the signed-in user first, tagged "[Current Account]" (matches the
    // Tokens tab), regardless of which source it came from.
    return Array.from(map.values()).sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0;
    });
  }, [resourceUsers, tokenMeta, currentUserId]);

  // user id → the identity object the token series filters by. Built from the
  // token meta so the trend's ``users`` filter carries the real identity.
  const tokenUserById = useMemo(() => {
    const map = new Map<number, FilterOptionType>();
    (tokenMeta?.users || []).forEach((u) => {
      const id = u.identity.current?.user_id;
      if (id != null) map.set(id, { identity: u.identity });
    });
    return map;
  }, [tokenMeta]);

  const {
    detailData: summary,
    loading: summaryLoading,
    fetchData: fetchSummary
  } = useQueryUsageSummary();
  const {
    detailData: tokenSeriesData,
    loading: tokenSeriesLoading,
    fetchData: fetchTokenSeries
  } = useQueryTimeSeriesData();
  const {
    detailData: computeByDate,
    loading: computeLoading,
    fetchData: fetchComputeBreakdown
  } = useQueryResourceBreakdown();
  const {
    detailData: storageByDate,
    loading: storageByDateLoading,
    fetchData: fetchStorageByDate
  } = useQueryStorageBreakdown({ key: 'storageByDate' });
  const {
    detailData: storageByType,
    loading: storageByTypeLoading,
    fetchData: fetchStorageByType
  } = useQueryStorageBreakdown({ key: 'storageByType' });

  const fetchAll = async (params?: Partial<QueryParams>) => {
    const currentParams = {
      ...queryParams,
      ...params
    };

    const commonParams = {
      start_date: currentParams.start,
      end_date: currentParams.end,
      scope
    };
    const paginationParams = {
      ...commonParams,
      page: 1,
      perPage: 100
    };

    if (params) {
      setQueryParams(currentParams);
    }

    // "filter by user" — restricts every resource fetch to these creator ids.
    const creatorFilter = currentParams.selectedUsers.length
      ? { creator_ids: currentParams.selectedUsers }
      : undefined;

    // The token series hits /usage/breakdown, which filters users by identity
    // rather than the creator_ids the resource endpoints take — so the token
    // trend honors the user filter like the totals do. Resolve each id to its
    // token-meta identity, falling back to a minimal current.user_id object for
    // users present only in the resource meta.
    const tokenUserFilter: { users?: FilterOptionType[] } = currentParams
      .selectedUsers.length
      ? {
          users: currentParams.selectedUsers.map(
            (id) =>
              tokenUserById.get(id) ??
              ({
                identity: { current: { user_id: id } }
              } as unknown as FilterOptionType)
          )
        }
      : {};

    await Promise.all([
      fetchSummary({
        ...commonParams,
        creator_ids: currentParams.selectedUsers.length
          ? currentParams.selectedUsers
          : undefined
      }),

      fetchStorageByType({
        ...paginationParams,
        group_by: ['type'],
        filters: creatorFilter
      }),

      // Date-bucketed trends: fetch the whole series via the no-pagination
      // sentinel (page: -1). A metric-desc page would drop low-traffic (often
      // most recent) buckets and leave gaps in the chart.
      fetchTokenSeries({
        ...commonParams,
        metric: 'total_tokens',
        group_by: ['date'],
        granularity,
        page: -1,
        filters: tokenUserFilter
      }),

      fetchComputeBreakdown({
        ...paginationParams,
        page: -1,
        group_by: ['date'],
        granularity,
        filters: creatorFilter
      }),

      fetchStorageByDate({
        ...paginationParams,
        page: -1,
        group_by: ['date'],
        granularity,
        filters: creatorFilter
      })
    ]);
  };

  // --- derived: donuts ---
  const tokenDonut = useMemo(
    () => [
      { name: t('usage.metric.input'), value: summary?.input_tokens ?? 0 },
      { name: t('usage.metric.output'), value: summary?.output_tokens ?? 0 }
    ],
    [summary]
  );
  const computeDonut = useMemo(
    () =>
      (summary?.distribution ?? []).map((d) => ({
        name: d.label,
        value: d.value
      })),
    [summary]
  );
  const storageDonut = useMemo(
    () =>
      (storageByType?.items ?? [])
        .filter((i) => (i.storage_gb_days || 0) > 0)
        .map((i) => ({
          name: i.gpu_type || t('usage.common.unknown'),
          value: i.storage_gb_days
        })),
    [storageByType]
  );

  // --- derived: trends ---
  const tokenTrend = useMemo(
    () =>
      buildTrend(
        (tokenSeriesData?.items || []).map((it: any) => ({
          date: it?.date?.value,
          value: Number(it?.total_tokens ?? 0)
        })),
        granularity,
        start,
        end
      ),
    [tokenSeriesData, granularity, start, end]
  );

  const computeTrend = useMemo(
    () =>
      buildTrend(
        (computeByDate?.items ?? []).map((it) => ({
          date: it.date,
          value: Number(it.gpu_hours ?? 0)
        })),
        granularity,
        start,
        end
      ),
    [computeByDate, granularity, start, end]
  );

  const storageTrend = useMemo(
    () =>
      buildTrend(
        (storageByDate?.items ?? []).map((it) => ({
          date: it.date,
          value: Number(it.storage_gb_days ?? 0)
        })),
        granularity,
        start,
        end
      ),
    [storageByDate, granularity, start, end]
  );

  const computeSum = computeByDate?.summary;
  const storageSum = storageByDate?.summary;

  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs]) => {
    fetchAll({
      start: dates[0].format('YYYY-MM-DD'),
      end: dates[1].format('YYYY-MM-DD')
    });
  };

  const handleUserFilterChange = (users: number[]) => {
    fetchAll({ selectedUsers: users });
  };

  const onRefresh = () => {
    fetchAll();
  };

  useEffect(() => {
    fetchTokenMeta();
    fetchAll();
  }, []);

  return (
    <div>
      <ResourceFilterBar
        value={[dayjs(start), dayjs(end)]}
        onChange={handleDateRangeChange}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        selectedUsers={selectedUsers}
        onUsersChange={handleUserFilterChange}
        onRefresh={onRefresh}
      />
      <div style={{ height: 24 }} />

      <Row gutter={[0, 24]}>
        <Col span={24}>
          <DomainSection
            title={t('usage.metric.tokens')}
            accent={coolColors[0]}
            donutData={tokenDonut}
            donutTotalLabel={t('usage.metric.tokens')}
            trendTitle={t('usage.summary.tokensOverTime')}
            trendXAxis={tokenTrend.xAxis}
            trendData={tokenTrend.data}
            pieLoading={summaryLoading}
            barLoading={tokenSeriesLoading}
            trendColor={coolColors[0]}
            trendGran={granularity}
            headline={
              <>
                <Stat
                  value={fmt(summary?.total_tokens)}
                  label={t('usage.metric.tokens')}
                />
                <Stat
                  value={fmt(summary?.input_tokens)}
                  label={t('usage.metric.input')}
                />
                <Stat
                  value={fmt(summary?.output_tokens)}
                  label={t('usage.metric.output')}
                />
                <Stat
                  value={summary?.token_active_users ?? 0}
                  label={t('usage.metric.activeUsers')}
                />
              </>
            }
          />
        </Col>

        <Col span={24}>
          <DomainSection
            title={t('usage.summary.compute')}
            accent={coolColors[1]}
            donutData={computeDonut}
            donutTotalLabel={t('usage.metric.gpuHours')}
            trendTitle={t('usage.summary.gpuHoursOverTime')}
            trendXAxis={computeTrend.xAxis}
            trendData={computeTrend.data}
            trendColor={coolColors[1]}
            trendGran={granularity}
            pieLoading={summaryLoading}
            barLoading={computeLoading}
            headline={
              <>
                <Stat
                  value={fmt(summary?.gpu_hours)}
                  label={t('usage.metric.gpuHours')}
                />
                <Stat
                  value={fmt(summary?.instance_hours)}
                  label={t('usage.metric.instanceHours')}
                />
                <Stat
                  value={computeSum?.active_instances ?? 0}
                  label={t('usage.metric.activeInstances')}
                />
              </>
            }
          />
        </Col>

        <Col span={24}>
          <DomainSection
            title={t('usage.tabs.storage')}
            accent={coolColors[2]}
            donutData={storageDonut}
            donutTotalLabel={t('usage.metric.gbDays')}
            trendTitle={t('usage.summary.gbDaysOverTime')}
            trendXAxis={storageTrend.xAxis}
            trendData={storageTrend.data}
            trendColor={coolColors[2]}
            trendGran={granularity}
            pieLoading={storageByTypeLoading}
            barLoading={storageByDateLoading}
            headline={
              <>
                <Stat
                  value={fmt(summary?.storage_gb_days)}
                  label={t('usage.metric.gbDays')}
                />
                <Stat
                  value={storageSum?.active_volumes ?? 0}
                  label={t('usage.metric.activeStorage')}
                />
                <Stat
                  value={storageDonut.length}
                  label={t('usage.metric.storageTypes')}
                />
              </>
            }
          />
        </Col>
      </Row>
    </div>
  );
};

export default SummaryTab;
