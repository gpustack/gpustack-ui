import useCoolColors from '@/hooks/use-cool-colors';
import useQueryTimeSeriesData from '@/pages/usage/services/use-query-timeseries-data';
import { Chart } from '@gpustack/core-ui/charts';
import { formatLargeNumber } from '@gpustack/core-ui/utils';
import { useIntl } from '@umijs/max';
import type { GlobalToken } from 'antd';
import { Empty, Spin, theme } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DashboardUsageCommonParams,
  getUsageSummary,
  toUsagePieData,
  UsageChartDatum,
  usageChartHeight
} from '../../config';
import UsageChartCard from './shared';
import { getUsageByModelChartLayout } from './usage-chart-layout';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

// Tooltip strings come from route names (user-controlled via the API) and
// translated metric labels, so they must be escaped before being interpolated
// into raw HTML for ECharts' tooltip formatter.
const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

// Cap individual entries in the shared legend. Anything beyond this rolls up
// into a single "Others" bucket. The cap is filled by alternating top picks
// from the API-request and token rankings (request-priority first), so both
// metrics get fair representation even when leaders heavily overlap.
const MAX_LEGEND_NAMED_ITEMS = 10;

interface UsageByModelProps {
  commonParams: DashboardUsageCommonParams;
  height?: number;
}

const UsageByModel: React.FC<UsageByModelProps> = ({
  commonParams,
  height = usageChartHeight
}) => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    if (!node) return;
    setContainerWidth(node.clientWidth);
    resizeObserverRef.current = new ResizeObserver(() => {
      setContainerWidth(node.clientWidth);
    });
    resizeObserverRef.current.observe(node);
  }, []);
  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  const chartLayout = useMemo(
    () => getUsageByModelChartLayout(containerWidth, height),
    [containerWidth, height]
  );
  const chartHeight = height + chartLayout.chartHeightExtra;
  const generateCoolColors = useCoolColors();
  const chartRef = useRef<{ chart: any } | null>(null);

  const tokenQuery = useQueryTimeSeriesData({ key: 'tokenUsageByModelData' });
  const apiQuery = useQueryTimeSeriesData({ key: 'apiRequestsByModelData' });

  useEffect(() => {
    tokenQuery
      .fetchData({
        ...commonParams,
        metric: 'total_tokens',
        group_by: ['route'],
        page: 1,
        perPage: 10,
        sort_by: '-total_tokens'
      })
      .catch(() => {});
    apiQuery
      .fetchData({
        ...commonParams,
        metric: 'api_requests',
        group_by: ['route'],
        page: 1,
        perPage: 10,
        sort_by: '-api_requests'
      })
      .catch(() => {});
  }, [commonParams]);

  const tokenData = useMemo<UsageChartDatum[]>(
    () => toUsagePieData(tokenQuery.detailData, 'route', 'total_tokens'),
    [tokenQuery.detailData]
  );
  const apiData = useMemo<UsageChartDatum[]>(
    () => toUsagePieData(apiQuery.detailData, 'route', 'api_requests'),
    [apiQuery.detailData]
  );

  const tokenTotal = useMemo(() => {
    const summary = getUsageSummary(tokenQuery.detailData);
    return Number(summary?.total_tokens ?? 0);
  }, [tokenQuery.detailData]);

  const apiTotal = useMemo(() => {
    const summary = getUsageSummary(apiQuery.detailData);
    return Number(summary?.api_requests ?? 0);
  }, [apiQuery.detailData]);

  const tokenLabel = intl.formatMessage({ id: 'usage.filter.totalTokens' });
  const apiLabel = intl.formatMessage({ id: 'usage.filter.apiRequests' });
  const othersLabel = intl.formatMessage({ id: 'dashboard.usage.others' });

  // Pick legend entries by alternating between the two metrics' ranked
  // lists — API request first (request-priority), then tokens, repeat.
  // Each turn advances its own cursor past entries already picked from the
  // other side, so overlapping leaders don't burn the alternation slot
  // (and both metrics get fair representation when sets diverge).
  // Everything beyond the cap collapses into a single Others bucket.
  const pickedNames = useMemo(() => {
    const apiSorted = [...apiData]
      .sort((a, b) => b.value - a.value)
      .map((d) => d.name);
    const tokenSorted = [...tokenData]
      .sort((a, b) => b.value - a.value)
      .map((d) => d.name);
    const picked = new Set<string>();
    let apiIdx = 0;
    let tokenIdx = 0;

    const takeFromApi = (): boolean => {
      while (apiIdx < apiSorted.length && picked.has(apiSorted[apiIdx]))
        apiIdx++;
      if (apiIdx >= apiSorted.length) return false;
      picked.add(apiSorted[apiIdx++]);
      return true;
    };

    const takeFromToken = (): boolean => {
      while (tokenIdx < tokenSorted.length && picked.has(tokenSorted[tokenIdx]))
        tokenIdx++;
      if (tokenIdx >= tokenSorted.length) return false;
      picked.add(tokenSorted[tokenIdx++]);
      return true;
    };

    while (picked.size < MAX_LEGEND_NAMED_ITEMS) {
      const apiOk = takeFromApi();
      if (picked.size >= MAX_LEGEND_NAMED_ITEMS) break;
      const tokenOk = takeFromToken();
      if (!apiOk && !tokenOk) break;
    }

    return picked;
  }, [tokenData, apiData]);

  // Project raw data into (pickedRoutes..., Others). Others is only appended
  // when at least one route was rolled up.
  const project = (rows: UsageChartDatum[]): UsageChartDatum[] => {
    const kept: UsageChartDatum[] = [];
    let othersValue = 0;
    for (const row of rows) {
      if (pickedNames.has(row.name)) kept.push(row);
      else othersValue += row.value;
    }
    if (othersValue > 0) kept.push({ name: othersLabel, value: othersValue });
    return kept;
  };

  const projectedTokenData = useMemo(
    () => project(tokenData),
    [tokenData, pickedNames, othersLabel]
  );
  const projectedApiData = useMemo(
    () => project(apiData),
    [apiData, pickedNames, othersLabel]
  );

  const { legendNames, colorMap } = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    [...projectedTokenData, ...projectedApiData].forEach((d) => {
      if (!seen.has(d.name) && d.name !== othersLabel) {
        seen.add(d.name);
        names.push(d.name);
      }
    });
    const colors = generateCoolColors(names.length);
    const map: Record<string, string> = {};
    names.forEach((name, i) => {
      map[name] = colors[i];
    });
    const hasOthers = [...projectedTokenData, ...projectedApiData].some(
      (d) => d.name === othersLabel
    );
    if (hasOthers) {
      names.push(othersLabel);
      map[othersLabel] = token.colorTextQuaternary;
    }
    return { legendNames: names, colorMap: map };
  }, [
    projectedTokenData,
    projectedApiData,
    generateCoolColors,
    othersLabel,
    token
  ]);

  const isEmpty =
    projectedTokenData.length === 0 && projectedApiData.length === 0;
  const isLoading = tokenQuery.loading || apiQuery.loading;

  const options = useMemo(() => {
    const paintData = (rows: UsageChartDatum[]) =>
      rows.map((row) => ({
        name: row.name,
        value: row.value,
        itemStyle: { color: colorMap[row.name] }
      }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: token.colorBgElevated,
        borderColor: 'transparent',
        formatter: (params: any) => {
          const seriesName = escapeHtml(params.seriesName);
          const name = escapeHtml(params.name);
          const value = escapeHtml(formatLargeNumber(params.value));
          return `<div class="tooltip-wrapper">
            <span class="tooltip-item">
              <span class="tooltip-item-name">
                ${params.marker}
                <span class="tooltip-item-title">${seriesName} · ${name}</span>:
              </span>
              <span class="tooltip-value">${value}</span>
            </span>
          </div>`;
        }
      },
      legend: {
        ...chartLayout.legend,
        textStyle: {
          color: token.colorTextTertiary,
          ...(chartLayout.legend.textStyle as object)
        },
        data: legendNames,
        show: legendNames.length > 0,
        tooltip: {
          show: true,
          backgroundColor: token.colorBgElevated,
          borderColor: 'transparent',
          textStyle: { color: token.colorText, fontSize: 12 }
        }
      },
      series: [
        {
          name: tokenLabel,
          type: 'pie',
          radius: chartLayout.radius,
          center: chartLayout.tokenCenter,
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            label: { show: false }
          },
          data: paintData(projectedTokenData)
        },
        {
          name: apiLabel,
          type: 'pie',
          radius: chartLayout.radius,
          center: chartLayout.apiCenter,
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            label: { show: false }
          },
          data: paintData(projectedApiData)
        }
      ]
    };
  }, [
    projectedTokenData,
    projectedApiData,
    colorMap,
    legendNames,
    token,
    tokenLabel,
    apiLabel,
    chartLayout
  ]);

  useEffect(() => {
    let raf: number | undefined;
    let detach: (() => void) | undefined;

    const tryBind = () => {
      const inst = chartRef.current?.chart;
      if (!inst) {
        raf = requestAnimationFrame(tryBind);
        return;
      }

      const dispatchFor = (params: any, type: 'highlight' | 'downplay') => {
        if (
          params.componentType !== 'series' ||
          typeof params.seriesIndex !== 'number'
        )
          return;
        const otherIndex = params.seriesIndex === 0 ? 1 : 0;
        inst.dispatchAction({
          type,
          seriesIndex: otherIndex,
          name: params.name
        });
      };

      const handleOver = (params: any) => dispatchFor(params, 'highlight');
      const handleOut = (params: any) => dispatchFor(params, 'downplay');

      inst.on('mouseover', handleOver);
      inst.on('mouseout', handleOut);

      detach = () => {
        inst.off('mouseover', handleOver);
        inst.off('mouseout', handleOut);
      };
    };

    tryBind();

    return () => {
      if (raf !== undefined) cancelAnimationFrame(raf);
      detach?.();
    };
  }, []);

  return (
    <UsageChartCard
      title={intl.formatMessage({ id: 'dashboard.usageByModel' })}
      height={chartHeight + 52}
    >
      <div
        ref={measureRef}
        style={{ position: 'relative', width: '100%', height: chartHeight }}
      >
        {isEmpty && !isLoading ? (
          <div
            style={{
              height: chartHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <>
            <Chart
              ref={chartRef as any}
              options={options as any}
              height={chartHeight}
              width={containerWidth || '100%'}
            />
            <DonutCenter
              left={chartLayout.tokenCenter[0]}
              top={chartLayout.tokenCenter[1]}
              total={tokenTotal}
              label={tokenLabel}
              token={token}
              valueFontSize={chartLayout.centerLabelFontSize}
            />
            <DonutCenter
              left={chartLayout.apiCenter[0]}
              top={chartLayout.apiCenter[1]}
              total={apiTotal}
              label={apiLabel}
              token={token}
              valueFontSize={chartLayout.centerLabelFontSize}
            />
            {isLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: token.colorBgContainer,
                  opacity: 0.6,
                  pointerEvents: 'none'
                }}
              >
                <Spin size="middle" />
              </div>
            )}
          </>
        )}
      </div>
    </UsageChartCard>
  );
};

const DonutCenter: React.FC<{
  left: string;
  top: string;
  total: number;
  label: string;
  token: GlobalToken;
  valueFontSize?: number;
}> = ({ left, top, total, label, token, valueFontSize = 18 }) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      textAlign: 'center'
    }}
  >
    <span
      style={{
        fontSize: valueFontSize,
        fontWeight: 600,
        color: token.colorText,
        lineHeight: 1.2
      }}
    >
      {formatLargeNumber(total)}
    </span>
    <span
      style={{
        fontSize: 12,
        color: token.colorTextTertiary,
        marginTop: 4
      }}
    >
      {label}
    </span>
  </div>
);

export default UsageByModel;
