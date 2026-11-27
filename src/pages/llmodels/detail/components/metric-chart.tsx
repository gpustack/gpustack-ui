import ChartViewToggle from '@/pages/_components/monitoring/chart-view-toggle';
import { UndoOutlined } from '@ant-design/icons';
import { BaseSelect, TextAttribute } from '@gpustack/core-ui';
import {
  Chart,
  echarts,
  useChartConfig,
  type ECOption
} from '@gpustack/core-ui/charts';
import { useIntl } from '@umijs/max';
import { Button, Col, Flex, Row, Space, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  AriaComponent,
  MarkAreaComponent,
  MarkPointComponent
} from 'echarts/components';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLatencyStatistics } from '../config/latency-statistics-context';
import type { MetricSeries, MetricView } from '../config/types';
import {
  containsTimestamp,
  isFocusedSeries,
  nearestTimestampIndex,
  visibleTimeBands,
  type ChartFocus,
  type ChartInteraction,
  type ChartTimeBand,
  type ChartTimeRange
} from '../utils/chart-context';
import { segmentLayout, type ChartTimeSegment } from '../utils/chart-segments';
import {
  assignEntityColors,
  changeSeriesSelection,
  chartSeries,
  selectedSeries,
  seriesAppearance,
  type SeriesSelection
} from '../utils/chart-series';
import { chartTooltip } from '../utils/chart-tooltip';
import { selectLatencyStatistics } from '../utils/latency-statistics';
import { metricStateMessageId } from '../utils/metric-state';
import {
  alignedPoints,
  displayMetricValue,
  displayObservationValue,
  displayUnit,
  displayValue,
  finite,
  hasMetricSamples,
  metricDimensionsLabel,
  metricSeriesLabel,
  seriesIdentity,
  summaryStatistics
} from '../utils/metrics';
import HelpTooltip from './help-tooltip';
import styles from './metric-chart.module.less';
import { hasMetricNotice, MetricNotice, MetricState } from './metric-state';

echarts.use([AriaComponent, MarkAreaComponent, MarkPointComponent]);

export type {
  ChartFocus,
  ChartInteraction,
  ChartTimeBand,
  ChartTimeRange
} from '../utils/chart-context';

export interface MetricChartProps {
  metricKey: string;
  title: string;
  metric?: MetricView;
  note?: string;
  source?: string;
  measures?: string[];
  extra?: ReactNode;
  colorDomain?: string[];
  rateWindowSeconds?: number;
  neutralMeasures?: string[];
  suppressStaleNotice?: boolean;
  showSummary?: boolean;
  compactEmpty?: boolean;
  timeRange?: ChartTimeRange;
  timeBands?: ChartTimeBand[];
  focus?: ChartFocus;
  interaction?: ChartInteraction;
  exactCursor?: boolean;
  timeSegments?: ChartTimeSegment[];
}
const MetricChart = ({
  metricKey,
  title,
  metric: sourceMetric,
  note,
  source,
  measures = [],
  extra,
  colorDomain = [],
  rateWindowSeconds,
  neutralMeasures = [],
  suppressStaleNotice = false,
  showSummary = true,
  compactEmpty = false,
  timeRange,
  timeBands = [],
  focus,
  interaction,
  exactCursor = false,
  timeSegments
}: MetricChartProps) => {
  const intl = useIntl();
  const config = useChartConfig();
  const latencySelection = useLatencyStatistics();
  const selectedStatistics = latencySelection
    ? selectLatencyStatistics(sourceMetric, latencySelection.statistics)
    : { metric: sourceMetric, statistics: [], fixedAverage: false };
  const metric = selectedStatistics.metric;
  const statisticLabel = selectedStatistics.statistics
    .map((statistic) => (statistic === 'avg' ? 'Avg' : statistic.toUpperCase()))
    .join(' / ');
  const observationSource =
    source ||
    (metric?.measurement_scope === 'engine' ||
    metric?.measurement_scope?.startsWith('engine_')
      ? intl.formatMessage({ id: 'modelMonitoring.pd.engineObservation' })
      : metric?.measurement_scope === 'service_ingress'
        ? intl.formatMessage({ id: 'modelMonitoring.pd.serviceObservation' })
        : undefined);
  const [table, setTable] = useState(false);
  const [summaryGroup, setSummaryGroup] = useState('');
  const [cursor, setCursor] = useState(0);
  const [selection, setSelection] = useState<SeriesSelection>(null);
  const chartRef = useRef<any>(null);
  const colorSlots = useRef(new Map<string, number>());
  const groupKey = (dimensions: object) =>
    JSON.stringify(Object.entries(dimensions).sort());
  const series = chartSeries(
    (metric?.series || []).map((item) =>
      timeRange || timeSegments
        ? {
            ...item,
            points: item.points.filter(
              ([time]) =>
                (!timeRange || containsTimestamp(timeRange, time)) &&
                (!timeSegments ||
                  timeSegments.some((segment) =>
                    containsTimestamp(segment, time)
                  ))
            ),
            lower_bounds: item.lower_bounds?.filter(
              ([time]) =>
                (!timeRange || containsTimestamp(timeRange, time)) &&
                (!timeSegments ||
                  timeSegments.some((segment) =>
                    containsTimestamp(segment, time)
                  ))
            )
          }
        : item
    ),
    metric?.kind === 'histogram',
    measures
  );
  const seriesSelectionKey = statisticLabel
    ? `${metricKey}:${statisticLabel}:${latencySelection?.revision ?? 0}`
    : metricKey;
  const selected = selectedSeries(selection, seriesSelectionKey, series);
  assignEntityColors(series, colorDomain, colorSlots.current);
  const plotted = series.filter(
    (item) => !selected || selected.includes(seriesIdentity(item))
  );
  const label = (item: MetricSeries) => {
    const name = metricSeriesLabel(item, measures);
    return name === metricKey ? title : name;
  };
  const aligned = alignedPoints(series);
  const lowerBounds = series.map((item) => new Map(item.lower_bounds || []));
  const boundAt = (item: MetricSeries, time?: number | null) =>
    time == null ? undefined : lowerBounds[series.indexOf(item)]?.get(time);
  const sharedReadoutIndex =
    interaction?.timestamp == null
      ? cursor
      : nearestTimestampIndex(aligned.timestamps, interaction.timestamp);
  const readoutIndex =
    exactCursor &&
    interaction?.timestamp != null &&
    aligned.timestamps[sharedReadoutIndex] !== interaction.timestamp
      ? -1
      : sharedReadoutIndex;
  const readoutTimestamp =
    readoutIndex < 0
      ? interaction?.timestamp
      : aligned.timestamps[readoutIndex];
  const segmented = timeSegments !== undefined;
  const layout = segmented
    ? segmentLayout(timeSegments, aligned.timestamps)
    : undefined;
  const orderedIndexes = layout
    ? layout.samples.map((sample) => sample.sourceIndex)
    : aligned.timestamps.map((_, index) => index);
  const dataIndexForSource = (index: number) =>
    layout ? layout.dataIndexForTimestamp(aligned.timestamps[index]) : index;
  const sourceIndexForData = (index: number) =>
    layout ? (layout.entries[index]?.sourceIndex ?? -1) : index;
  const segmentForSource = (index: number) =>
    layout?.sampleForSource(index)?.segment;
  const inspectionTitle = (index: number) => {
    const time = dayjs(aligned.timestamps[index] * 1000).format(
      'MM-DD HH:mm:ss'
    );
    const segment = segmentForSource(index);
    return segment
      ? `${segment.description} · ${intl.formatMessage({ id: 'modelMonitoring.originalTime' })} ${time}`
      : time;
  };
  const inspectionNote = (index: number) => {
    const segment = segmentForSource(index);
    return segment
      ? intl.formatMessage(
          { id: 'modelMonitoring.segmentProgress' },
          {
            seconds: Number((segment.end - segment.start).toFixed(1)),
            progress: Math.round(
              (100 * (aligned.timestamps[index] - segment.start)) /
                (segment.end - segment.start)
            )
          }
        )
      : undefined;
  };
  const hasValues = hasMetricSamples(
    metric ? { ...metric, series } : undefined
  );
  const compact =
    !hasValues &&
    metric &&
    (compactEmpty || ['unsupported', 'not_applicable'].includes(metric.status));
  const plottedHasValues = plotted.some((item) =>
    item.points.some(([, value]) => finite(value) != null)
  );
  const plottedHasBounds = plotted.some((item) =>
    item.lower_bounds?.some(([, bound]) => finite(bound) != null)
  );
  const hasBounds = series.some((item) => item.lower_bounds?.length);
  const stateMetric =
    metric?.reason === 'histogram_quantile_out_of_range' && !hasBounds
      ? { ...metric, reason: 'no_samples' }
      : metric;
  const unit = displayUnit(metric?.unit, metricKey);
  const description = [
    metric?.status === 'stale' && !suppressStaleNotice
      ? intl.formatMessage({ id: 'modelMonitoring.state.stale' })
      : undefined,
    metric?.coverage?.partial
      ? intl.formatMessage({ id: 'modelMonitoring.partial' })
      : undefined
  ]
    .filter(Boolean)
    .join(' · ');
  const noticeMetric =
    suppressStaleNotice && metric?.status === 'stale'
      ? {
          ...metric,
          status: 'available' as const,
          reason: metric.reason === 'no_recent_samples' ? null : metric.reason
        }
      : metric;
  const duplicateEmptyNotice =
    !hasValues &&
    !noticeMetric?.componentWarnings?.length &&
    metricStateMessageId(stateMetric) ===
      metricStateMessageId(noticeMetric, 'partial_metric_data');
  const groups = [
    ...new Map(
      (metric?.summaries || []).map((summary) => [
        groupKey(summary.dimensions),
        summary.dimensions
      ])
    ).entries()
  ];
  const selectedGroup = groups.some(([key]) => key === summaryGroup)
    ? summaryGroup
    : groups[0]?.[0];
  const scopedSummary = metric
    ? {
        ...metric,
        summaries: metric.summaries.filter(
          (summary) => groupKey(summary.dimensions) === selectedGroup
        )
      }
    : undefined;
  const summaries = summaryStatistics(scopedSummary);
  const nameById = new Map(
    series.map((item) => [seriesIdentity(item), label(item)])
  );
  const appearance = (item: MetricSeries) =>
    seriesAppearance(
      item,
      metric?.kind === 'histogram',
      measures,
      !!config.isDark,
      colorSlots.current,
      neutralMeasures
    );
  const axisInk = config.isDark
    ? config.token.colorTextSecondary || config.token.colorTextTertiary
    : config.token.colorTextSecondary || '#595959';
  const axisBorder = config.isDark
    ? config.token.colorBorder
    : config.token.colorBorderSecondary || '#e5e8ec';
  const pointerColor = config.isDark
    ? config.token.colorTextQuaternary
    : config.token.colorBorder || '#c8cfd8';
  const bands = visibleTimeBands(timeBands, timeRange);
  const timeAxis = !!timeRange;
  const options = {
    animation: false,
    aria: {
      enabled: true,
      label: { series: { maxCount: 8 }, data: { maxCount: 4 } }
    },
    grid: {
      ...config.grid,
      top: 22,
      bottom: segmented ? 42 : 28,
      left: 8,
      right: 12
    },
    legend: {
      ...config.legend,
      show: false,
      data: series.map(label)
    },
    tooltip: {
      ...config.tooltip,
      renderMode: 'html',
      trigger: 'axis',
      ...(interaction ? { triggerOn: 'none' } : {}),
      confine: true,
      backgroundColor:
        config.token.colorBgElevated || config.token.colorBgContainer,
      borderColor: config.token.colorBorderSecondary,
      borderWidth: 1,
      borderRadius: 4,
      padding: 10,
      textStyle: {
        fontSize: 12,
        color: config.token.colorTextSecondary,
        fontFamily: config.token.fontFamily
      },
      axisPointer: {
        type: 'line',
        snap: true,
        label: { show: false },
        lineStyle: { color: pointerColor, type: 'dashed', width: 1 }
      },
      formatter: (params: any) => {
        const items = (Array.isArray(params) ? params : [params]).filter(
          Boolean
        );
        if (!items.length) return '';
        const index = sourceIndexForData(items[0]?.dataIndex);
        const alignedIndex =
          Number.isInteger(index) &&
          index >= 0 &&
          index < aligned.timestamps.length;
        const rows = alignedIndex
          ? plotted.map((item) => ({
              name: label(item),
              color: appearance(item).color,
              value: displayMetricValue(
                aligned.values[series.indexOf(item)][index],
                metric?.unit,
                metricKey,
                boundAt(item, aligned.timestamps[index])
              )
            }))
          : items.map((item: any) => {
              const source = plotted.find(
                (entry) =>
                  seriesIdentity(entry) === item.seriesId ||
                  label(entry) === item.seriesName
              );
              return {
                name: item.seriesName || '',
                color: source ? appearance(source).color : '#8b939e',
                value: displayMetricValue(
                  item.data?.value ?? item.value,
                  metric?.unit,
                  metricKey
                )
              };
            });
        return chartTooltip(
          alignedIndex
            ? inspectionTitle(index)
            : items[0]?.axisValueLabel || '',
          rows.slice(0, 12),
          [
            alignedIndex ? inspectionNote(index) : undefined,
            rows.length > 12
              ? intl.formatMessage(
                  { id: 'modelMonitoring.moreSeries' },
                  { count: rows.length - 12 }
                )
              : undefined
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        );
      }
    },
    xAxis: {
      ...config.xAxis,
      ...(segmented
        ? {
            type: 'value',
            min: -0.5,
            max: Math.max(0.5, (layout?.chunks.length || 1) - 0.5),
            interval: 1,
            boundaryGap: false
          }
        : timeAxis
          ? {
              type: 'time',
              min: timeRange!.start * 1000,
              max: timeRange!.end * 1000,
              boundaryGap: false
            }
          : {
              data: aligned.timestamps.map((timestamp) =>
                dayjs(timestamp * 1000).format('MM-DD HH:mm:ss')
              )
            }),
      axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: axisBorder } },
      axisLabel: {
        ...config.xAxis.axisLabel,
        color: axisInk,
        fontSize: segmented ? 10 : 12,
        hideOverlap: segmented,
        ...(layout
          ? { customValues: layout.chunks.map((chunk) => chunk.position) }
          : {}),
        formatter: (value: string | number) => {
          if (layout) {
            const chunk = layout.chunks[Number(value)];
            return chunk
              ? `${chunk.segment.label}\n${chunk.segment.caption}`
              : '';
          }
          return timeAxis
            ? dayjs(Number(value)).format('HH:mm:ss')
            : String(value).slice(6);
        }
      }
    },
    yAxis: {
      ...config.yAxis,
      min: 0,
      minInterval: metric?.unit === 'requests' ? 1 : undefined,
      max: metric?.unit === 'percent' ? 100 : undefined,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: config.token.colorBorder || '#d9d9d9',
          width: 1
        }
      },
      axisLabel: {
        ...config.yAxis.axisLabel,
        color: axisInk,
        fontSize: 12,
        formatter: (value: number) => displayValue(value, metric?.unit)
      }
    },
    series: plotted.map((item, plottedIndex) => {
      const identity = seriesIdentity(item),
        index = series.indexOf(item),
        style = appearance(item);
      const values = layout
        ? layout.entries.map((entry) =>
            entry.sourceIndex == null
              ? null
              : aligned.values[index][entry.sourceIndex]
          )
        : aligned.values[index];
      const pointCoordinate = (point: number) =>
        layout
          ? layout.entries[point].coordinate
          : timeAxis
            ? aligned.timestamps[point] * 1000
            : point;
      return {
        ...config.lineItemConfig,
        id: identity,
        name: nameById.get(identity),
        type: 'line',
        smooth: false,
        connectNulls: false,
        showSymbol: false,
        symbol: style.symbol,
        symbolSize: 6,
        lineStyle: {
          width: 2,
          opacity: isFocusedSeries(item, focus) ? 1 : 0.18,
          color: style.color,
          type: style.pattern
        },
        itemStyle: {
          opacity: isFocusedSeries(item, focus) ? 1 : 0.18,
          color: config.token.colorBgContainer,
          borderColor: style.color,
          borderWidth: 2
        },
        emphasis: {
          scale: 1.3,
          lineStyle: { width: 3 },
          itemStyle: { opacity: 1 }
        },
        ...((timeAxis || segmented) && plottedIndex === 0 && bands.length
          ? {
              markArea: {
                silent: true,
                label: {
                  show: true,
                  position: 'insideTop',
                  color: config.token.colorTextSecondary,
                  fontSize: 11
                },
                data: bands.flatMap((band) =>
                  (layout
                    ? layout.bands(band)
                    : [{ start: band.start * 1000, end: band.end * 1000 }]
                  ).map((bounds) => [
                    {
                      name: layout
                        ? layout.chunks.find((chunk) =>
                            containsTimestamp(chunk.segment, band.start)
                          )?.segment.caption || band.label
                        : band.label,
                      xAxis: bounds.start,
                      itemStyle: {
                        color:
                          band.kind === 'baseline'
                            ? config.isDark
                              ? 'rgba(154,164,177,0.12)'
                              : 'rgba(139,147,158,0.09)'
                            : config.isDark
                              ? 'rgba(79,148,255,0.15)'
                              : 'rgba(47,113,255,0.07)',
                        borderColor:
                          band.kind === 'baseline'
                            ? pointerColor
                            : config.token.colorPrimary,
                        borderWidth: 1,
                        borderType: 'dashed'
                      }
                    },
                    { xAxis: bounds.end }
                  ])
                )
              }
            }
          : {}),
        // Dense histories use ECharts' temporary hover symbols. Only isolated
        // observations need a permanent marker so a real lone zero stays visible.
        markPoint: {
          silent: true,
          symbol: style.symbol,
          symbolSize: 8,
          label: { show: false },
          itemStyle: {
            opacity: isFocusedSeries(item, focus) ? 1 : 0.18,
            color: config.token.colorBgContainer,
            borderColor: style.color,
            borderWidth: 2
          },
          data: values.flatMap((value, point) =>
            value != null &&
            values[point - 1] == null &&
            values[point + 1] == null
              ? [
                  {
                    xAxis: pointCoordinate(point),
                    yAxis: value
                  }
                ]
              : []
          )
        },
        data: values.map((value, point) => ({
          value: timeAxis || segmented ? [pointCoordinate(point), value] : value
        }))
      };
    })
  } as ECOption;
  const hideTooltip = () => {
    const chart = chartRef.current?.chart;
    chart?.dispatchAction({ type: 'downplay' });
    chart?.dispatchAction({ type: 'updateAxisPointer', currTrigger: 'leave' });
    chart?.dispatchAction({ type: 'hideTip' });
  };
  // This effect only synchronizes an imperative chart cursor; it makes no requests.
  useEffect(() => {
    if (!interaction || table) return;
    const chart = chartRef.current?.chart;
    const time = interaction.timestamp;
    const index =
      time == null ? -1 : nearestTimestampIndex(aligned.timestamps, time);
    if (
      index < 0 ||
      (exactCursor && aligned.timestamps[index] !== time) ||
      !plotted.length ||
      dataIndexForSource(index) < 0 ||
      (timeRange && time != null && !containsTimestamp(timeRange, time))
    ) {
      hideTooltip();
      return;
    }
    chart?.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: dataIndexForSource(index)
    });
  }, [
    interaction?.timestamp,
    interaction?.pinned,
    table,
    options,
    exactCursor
  ]);
  const inspectPointer = (event: React.MouseEvent, pin = false) => {
    if (!interaction || (interaction.pinned && !pin)) return;
    const chart = chartRef.current?.chart;
    const rect = chart?.getDom?.().getBoundingClientRect();
    if (!rect) return;
    const raw = chart.convertFromPixel(
      { xAxisIndex: 0 },
      event.clientX - rect.left
    );
    const segmentSample = layout?.sampleAtCoordinate(Number(raw));
    const timestamp = layout
      ? segmentSample == null
        ? NaN
        : aligned.timestamps[segmentSample.sourceIndex]
      : timeAxis
        ? Number(raw) / 1000
        : aligned.timestamps[Math.round(Number(raw))];
    if (
      !Number.isFinite(timestamp) ||
      (timeRange && (timestamp < timeRange.start || timestamp > timeRange.end))
    ) {
      if (layout && !interaction.pinned)
        interaction.onChange({ timestamp: null, pinned: false });
      return;
    }
    const index = nearestTimestampIndex(aligned.timestamps, timestamp);
    if (index < 0) return;
    const next = aligned.timestamps[index];
    const pinned = pin
      ? !(interaction.pinned && interaction.timestamp === next)
      : false;
    if (next !== interaction.timestamp || pinned !== interaction.pinned)
      interaction.onChange({ timestamp: next, pinned });
  };
  const selectSeries = (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }
  ) => {
    hideTooltip();
    setSelection((current) =>
      changeSeriesSelection(
        current,
        seriesSelectionKey,
        series,
        id,
        event.ctrlKey || event.metaKey || event.shiftKey
      )
    );
  };
  const onKeyboard = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      interaction?.onChange({ timestamp: null, pinned: false });
      hideTooltip();
      return;
    }
    if (
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
      !orderedIndexes.length
    )
      return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? orderedIndexes.length - 1
          : Math.max(
              0,
              Math.min(
                orderedIndexes.length - 1,
                (interaction?.timestamp != null
                  ? Math.max(
                      0,
                      orderedIndexes.indexOf(
                        nearestTimestampIndex(
                          aligned.timestamps,
                          interaction.timestamp
                        )
                      )
                    )
                  : Math.max(0, orderedIndexes.indexOf(cursor))) +
                  (event.key === 'ArrowRight' ? 1 : -1)
              )
            );
    const sourceIndex = orderedIndexes[next];
    setCursor(sourceIndex);
    interaction?.onChange({
      timestamp: aligned.timestamps[sourceIndex],
      pinned: true
    });
    const seriesIndex = plotted.length ? 0 : -1;
    if (seriesIndex < 0) {
      hideTooltip();
      return;
    }
    chartRef.current?.chart?.dispatchAction({
      type: 'showTip',
      seriesIndex,
      dataIndex: dataIndexForSource(sourceIndex)
    });
  };
  return (
    <Flex
      component="section"
      vertical
      className={`${styles.card} ${metric?.kind === 'histogram' ? styles.latencyCard : ''} ${compact || (!table && !plottedHasValues && plottedHasBounds) ? styles.compact : ''}`}
      aria-label={title}
      data-latency-statistics={statisticLabel || undefined}
      data-axis={segmented ? 'load-segments' : 'time'}
    >
      <Flex
        justify="space-between"
        align="flex-start"
        gap={8}
        className={styles.header}
      >
        <Flex gap={6} align="center" wrap>
          <Flex gap={4} align="center">
            <Typography.Title level={5} className={styles.heading}>
              {title} {unit && `(${unit})`}
            </Typography.Title>
            {(metric?.kind === 'histogram' || note) && (
              <HelpTooltip
                label={`${title} · ${intl.formatMessage({ id: metric?.kind === 'histogram' ? 'modelMonitoring.statisticsHelp' : 'modelMonitoring.definition' })}`}
                content={
                  <Flex vertical gap={8}>
                    {note && <span>{note}</span>}
                    {selectedStatistics.fixedAverage && (
                      <span>
                        {intl.formatMessage({
                          id: 'modelMonitoring.fixedAverageStatistics'
                        })}
                      </span>
                    )}
                    {metric?.kind === 'histogram' && (
                      <>
                        <strong>
                          {intl.formatMessage({
                            id: 'modelMonitoring.statisticsHelp'
                          })}
                        </strong>
                        <span>
                          {intl.formatMessage({
                            id:
                              showSummary && !compact
                                ? 'modelMonitoring.statisticsExplanation'
                                : 'modelMonitoring.trendStatisticsExplanation'
                          })}
                        </span>
                        {!!rateWindowSeconds && (
                          <span>
                            {intl.formatMessage({
                              id:
                                showSummary && !compact
                                  ? 'modelMonitoring.intervalVsTrend'
                                  : 'modelMonitoring.trendWindow'
                            })}{' '}
                            {rateWindowSeconds}s
                          </span>
                        )}
                        {(hasBounds ||
                          summaries.some(
                            (summary) => summary.lowerBound != null
                          )) && (
                          <span>
                            {intl.formatMessage({
                              id: 'modelMonitoring.histogramBoundsHelp'
                            })}
                          </span>
                        )}
                        {series.some(
                          (item) => item.dimensions.model_instance_id != null
                        ) &&
                          new Set(series.map((item) => item.statistic)).size >
                            1 && (
                            <span>
                              {intl.formatMessage({
                                id: 'modelMonitoring.instanceLatencyStatistics'
                              })}
                            </span>
                          )}
                      </>
                    )}
                  </Flex>
                }
              />
            )}
          </Flex>
          {statisticLabel && (
            <TextAttribute variant="filled" className={styles.statBadge}>
              {statisticLabel}
            </TextAttribute>
          )}
        </Flex>
        <Space size={8} className={styles.actions}>
          {extra}
          {hasValues && selected && (
            <Tooltip
              title={intl.formatMessage({
                id: 'modelMonitoring.showAllSeries'
              })}
            >
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                aria-label={intl.formatMessage({
                  id: 'modelMonitoring.showAllSeries'
                })}
                onClick={() => {
                  hideTooltip();
                  setSelection(null);
                }}
              />
            </Tooltip>
          )}
          {hasValues && (
            <ChartViewToggle
              table={table}
              labels={{
                chart: intl.formatMessage({ id: 'modelMonitoring.chart' }),
                data: intl.formatMessage({ id: 'modelMonitoring.table' })
              }}
              onToggle={() => setTable(!table)}
            />
          )}
        </Space>
      </Flex>
      {observationSource && (
        <Typography.Text
          type="secondary"
          className={styles.source}
          data-observation-source
        >
          {intl.formatMessage({ id: 'modelMonitoring.source' })}:{' '}
          {observationSource}
        </Typography.Text>
      )}
      {description && (
        <Typography.Paragraph
          ellipsis={{ tooltip: true }}
          className={styles.note}
        >
          {description}
        </Typography.Paragraph>
      )}
      {!compact && showSummary && metric?.kind === 'histogram' && (
        <>
          {groups.length > 1 && (
            <BaseSelect
              size="small"
              aria-label={intl.formatMessage({
                id: 'modelMonitoring.summaryScope'
              })}
              value={selectedGroup}
              onChange={setSummaryGroup}
              options={groups.map(([value, dimensions]) => ({
                value,
                label:
                  metricDimensionsLabel(dimensions) ||
                  intl.formatMessage({ id: 'modelMonitoring.deployment' })
              }))}
              style={{ width: '100%' }}
            />
          )}
          <Row
            className={styles.stats}
            gutter={8}
            aria-label={intl.formatMessage({
              id: 'modelMonitoring.intervalStats'
            })}
          >
            {summaries.map((summary) => (
              <Col
                span={6}
                key={summary.statistic}
                title={
                  summary.sampleCount != null
                    ? `${intl.formatMessage({ id: 'modelMonitoring.sampleCount' })}: ${displayValue(summary.sampleCount)}`
                    : undefined
                }
              >
                <div className={styles.statLabel}>
                  {summary.statistic === 'avg'
                    ? 'Avg'
                    : summary.statistic.toUpperCase()}
                </div>
                <div className={styles.statValue}>
                  {displayObservationValue(
                    summary.value,
                    summary.lowerBound,
                    metric.unit
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}
      {compact ? (
        <Typography.Text type="secondary" className={styles.emptyReason}>
          {intl.formatMessage({ id: metricStateMessageId(stateMetric) })}
        </Typography.Text>
      ) : table && hasValues ? (
        <div className={styles.table}>
          <table>
            <caption className={styles.visuallyHidden}>{title}</caption>
            <thead>
              <tr>
                {segmented && (
                  <>
                    <th>
                      {intl.formatMessage({
                        id: 'modelMonitoring.segmentLoad'
                      })}
                    </th>
                    <th>
                      {intl.formatMessage({
                        id: 'modelMonitoring.segmentMeasurement'
                      })}
                    </th>
                  </>
                )}
                <th>
                  {intl.formatMessage({
                    id: segmented
                      ? 'modelMonitoring.originalTime'
                      : 'modelMonitoring.time'
                  })}
                </th>
                {plotted.map((item) => (
                  <th key={seriesIdentity(item)}>{label(item)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedIndexes.map((index) => {
                const timestamp = aligned.timestamps[index],
                  segment = segmentForSource(index);
                return (
                  <tr
                    key={timestamp}
                    className={
                      bands.some((band) => containsTimestamp(band, timestamp))
                        ? styles.highlightRow
                        : undefined
                    }
                  >
                    {segment && (
                      <>
                        <td>{segment.label}</td>
                        <td>{segment.caption}</td>
                      </>
                    )}
                    <td>{dayjs(timestamp * 1000).format('MM-DD HH:mm:ss')}</td>
                    {plotted.map((item) => (
                      <td key={seriesIdentity(item)}>
                        {displayObservationValue(
                          aligned.values[series.indexOf(item)][index],
                          boundAt(item, timestamp),
                          metric?.unit
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : plottedHasValues ? (
        <div
          className={styles.plot}
          tabIndex={0}
          role="group"
          aria-label={intl.formatMessage({
            id: 'modelMonitoring.keyboardChart'
          })}
          onKeyDown={onKeyboard}
          onMouseMove={(event) => inspectPointer(event)}
          onClick={(event) => inspectPointer(event, true)}
          onMouseLeave={() => {
            if (interaction && !interaction.pinned)
              interaction.onChange({ timestamp: null, pinned: false });
          }}
          onBlur={() => {
            if (!interaction?.pinned) hideTooltip();
          }}
        >
          <Chart ref={chartRef} options={options} width="100%" height={230} />
          <span className={styles.visuallyHidden} aria-live="polite">
            {readoutTimestamp != null &&
              dayjs(readoutTimestamp * 1000).format('MM-DD HH:mm:ss')}{' '}
            {plotted
              .slice(0, 8)
              .map(
                (item) =>
                  `${label(item)}: ${displayMetricValue(aligned.values[series.indexOf(item)][readoutIndex], metric?.unit, metricKey, boundAt(item, readoutTimestamp))}`
              )
              .join('; ')}
            {plotted.length > 8 &&
              intl.formatMessage(
                { id: 'modelMonitoring.moreSeries' },
                { count: plotted.length - 8 }
              )}
          </span>
        </div>
      ) : plottedHasBounds ? (
        <Typography.Text type="secondary" className={styles.emptyReason}>
          {intl.formatMessage({
            id: 'modelMonitoring.state.histogram_quantile_out_of_range'
          })}
        </Typography.Text>
      ) : (
        <Flex align="center" justify="center" className={styles.plot}>
          <MetricState
            metric={stateMetric}
            selected={hasValues && !!selected}
          />
        </Flex>
      )}
      {!table && hasValues && (
        <Flex
          vertical
          gap={4}
          className={styles.legend}
          role="group"
          aria-label={intl.formatMessage({
            id: 'modelMonitoring.seriesLegend'
          })}
        >
          <span className={styles.visuallyHidden}>
            {interaction?.timestamp != null
              ? readoutIndex >= 0
                ? inspectionTitle(readoutIndex)
                : dayjs(interaction.timestamp * 1000).format('MM-DD HH:mm:ss')
              : intl.formatMessage({ id: 'modelMonitoring.latestValidSample' })}
          </span>
          <Flex vertical gap={4} className={styles.legendRows}>
            {series.map((item) => {
              const identity = seriesIdentity(item);
              const style = appearance(item);
              const selectedBand = segmented
                ? timeBands.find((band) => band.kind === 'selected')
                : undefined;
              const legendPoints = selectedBand
                ? item.points.filter((point) =>
                    containsTimestamp(selectedBand, point[0])
                  )
                : item.points;
              const last = legendPoints.reduce<
                [number, number | null] | undefined
              >(
                (latest, point) =>
                  (finite(point[1]) != null ||
                    finite(boundAt(item, point[0])) != null) &&
                  (!latest || point[0] > latest[0])
                    ? point
                    : latest,
                undefined
              );
              const inspecting = interaction?.timestamp != null;
              const legendTimestamp = inspecting ? readoutTimestamp : last?.[0];
              const hidden = !!selected && !selected.includes(identity);
              return (
                <Button
                  type="text"
                  key={identity}
                  className={styles.legendItem}
                  aria-pressed={!hidden}
                  data-focused={isFocusedSeries(item, focus)}
                  onClick={(event) => selectSeries(identity, event)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (!event.repeat) selectSeries(identity, event);
                    }
                  }}
                >
                  <span
                    className={styles.legendMark}
                    style={{
                      color: style.color,
                      borderTopStyle: style.pattern
                    }}
                    aria-hidden="true"
                  >
                    {style.symbolLabel}
                  </span>
                  <span className={styles.legendName} title={label(item)}>
                    {label(item)}
                  </span>
                  <span
                    className={styles.legendValue}
                    title={
                      (timeAxis || segmented) && legendTimestamp != null
                        ? dayjs(legendTimestamp * 1000).format(
                            'YYYY-MM-DD HH:mm:ss.SSS'
                          )
                        : undefined
                    }
                  >
                    {displayMetricValue(
                      inspecting
                        ? aligned.values[series.indexOf(item)][readoutIndex]
                        : last?.[1],
                      metric?.unit,
                      metricKey,
                      boundAt(item, legendTimestamp)
                    )}
                  </span>
                </Button>
              );
            })}
          </Flex>
        </Flex>
      )}
      {hasMetricNotice(noticeMetric) &&
        !duplicateEmptyNotice &&
        noticeMetric?.reason !== 'histogram_quantile_out_of_range' && (
          <div className={styles.notice}>
            <MetricNotice metric={noticeMetric} />
          </div>
        )}
    </Flex>
  );
};
export default MetricChart;
