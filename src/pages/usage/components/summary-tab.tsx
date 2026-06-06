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
import useCoolColors from '@/hooks/use-cool-colors';
import BarChart from '@/pages/_components/bar-chart';
import PieChart from '@/pages/_components/pie-chart';
import { formatLargeNumber } from '@/utils';
import { CardWrapper } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Col, Empty, Row } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { queryUsageTimeSeriesData } from '../apis';
import {
  queryResourceBreakdown,
  queryStorageBreakdown,
  queryUsageSummary,
  ResourceBreakdownResponse,
  UsageSummaryResponse
} from '../apis/resource';
import useResourceMeta from '../hooks/use-resource-meta';
import {
  bucketKey,
  generateBucketRange,
  Granularity
} from '../utils/time-buckets';
import ResourceFilterBar from './resource-filter-bar';

type Scope = 'self' | 'all';

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
  const keys = new Set(generateBucketRange(start, end, gran));
  map.forEach((_v, k) => keys.add(k));
  const xAxis = Array.from(keys).sort();
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
  const intl = useIntl();
  const donutTotal = round2(donutData.reduce((s, d) => s + (d.value || 0), 0));
  const trendEmpty = trendData.every((v) => !v);
  const empty = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={intl.formatMessage({ id: 'usage.common.noData' })}
      style={{ margin: '32px 0' }}
    />
  );
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
          {donutTotal <= 0 ? (
            empty
          ) : (
            <PieChart
              data={donutData}
              height={180}
              total={donutTotal}
              totalLabel={donutTotalLabel}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          {trendEmpty ? (
            empty
          ) : (
            <BarChart
              seriesData={[
                { name: trendTitle, data: trendData, color: trendColor }
              ]}
              xAxisData={trendXAxis}
              height={180}
              title={trendTitle}
              labelFormatter={trendLabel(trendGran)}
              tooltipValueFormatter={(v) =>
                formatLargeNumber(round2(Number(v))) as string
              }
            />
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

const SummaryTab: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const coolColors = useCoolColors()(8);

  // No All/My dropdown (matches the Tokens tab): managers see the org-wide
  // view and narrow it with the user filter, others only their own rows.
  const canManageUsers = !!access.canSeeOrgAdmin;
  const scope: Scope = canManageUsers ? 'all' : 'self';
  // Summary trends are fixed to a daily granularity (no granularity control).
  const granularity: Granularity = 'day';

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs()
  ]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { creators: userOptions } = useResourceMeta(scope);

  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [tokenSeries, setTokenSeries] = useState<any[]>([]);
  const [computeByDate, setComputeByDate] =
    useState<ResourceBreakdownResponse | null>(null);
  const [storageByDate, setStorageByDate] =
    useState<ResourceBreakdownResponse | null>(null);
  const [storageByType, setStorageByType] =
    useState<ResourceBreakdownResponse | null>(null);

  const start = dateRange[0].format('YYYY-MM-DD');
  const end = dateRange[1].format('YYYY-MM-DD');
  // Token usage (model_usages) is a daily rollup; the Summary trends are fixed
  // to ``day`` anyway, so the token trend shares the same granularity.
  const tokenGran: Granularity = granularity;

  // "filter by user" — restricts every resource fetch to these creator ids.
  const creatorFilter = selectedUsers.length
    ? { creator_ids: selectedUsers }
    : undefined;

  // Date+scope scoped fetches (granularity-independent).
  useEffect(() => {
    queryUsageSummary({
      start_date: start,
      end_date: end,
      scope,
      creator_ids: selectedUsers.length ? selectedUsers : undefined
    })
      .then(setSummary)
      .catch(() => {});
    queryStorageBreakdown({
      start_date: start,
      end_date: end,
      scope,
      group_by: 'type',
      filters: creatorFilter,
      page: 1,
      perPage: 100
    })
      .then(setStorageByType)
      .catch(() => {});
  }, [start, end, scope, selectedUsers, refreshKey]);

  // Trend fetches (depend on granularity too).
  useEffect(() => {
    queryUsageTimeSeriesData({
      start_date: start,
      end_date: end,
      scope,
      metric: 'total_tokens',
      group_by: ['date'],
      granularity: tokenGran,
      filters: {}
    })
      .then((res) => setTokenSeries(res.items || []))
      .catch(() => {});
    queryResourceBreakdown({
      start_date: start,
      end_date: end,
      scope,
      group_by: 'date',
      granularity,
      filters: creatorFilter,
      page: 1,
      perPage: 100
    })
      .then(setComputeByDate)
      .catch(() => {});
    queryStorageBreakdown({
      start_date: start,
      end_date: end,
      scope,
      group_by: 'date',
      granularity,
      filters: creatorFilter,
      page: 1,
      perPage: 100
    })
      .then(setStorageByDate)
      .catch(() => {});
  }, [start, end, scope, granularity, tokenGran, selectedUsers, refreshKey]);

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
        tokenSeries.map((it) => ({
          date: it?.date?.value,
          value: Number(it?.total_tokens ?? 0)
        })),
        tokenGran,
        start,
        end
      ),
    [tokenSeries, tokenGran, start, end]
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

  return (
    <div>
      <ResourceFilterBar
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        selectedUsers={selectedUsers}
        onUsersChange={setSelectedUsers}
        onRefresh={() => setRefreshKey((k) => k + 1)}
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
            trendColor={coolColors[0]}
            trendGran={tokenGran}
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
            accent={coolColors[3]}
            donutData={storageDonut}
            donutTotalLabel={t('usage.metric.gbDays')}
            trendTitle={t('usage.summary.gbDaysOverTime')}
            trendXAxis={storageTrend.xAxis}
            trendData={storageTrend.data}
            trendColor={coolColors[3]}
            trendGran={granularity}
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
