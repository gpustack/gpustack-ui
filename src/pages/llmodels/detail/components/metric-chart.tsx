import { UndoOutlined } from '@ant-design/icons';
import {
  Chart,
  echarts,
  useChartConfig,
  type ECOption
} from '@gpustack/core-ui/charts';
import { useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Empty,
  Flex,
  Row,
  Select,
  Space,
  Tooltip,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import { AriaComponent, MarkPointComponent } from 'echarts/components';
import { useRef, useState, type ReactNode } from 'react';
import type { MetricSeries, MetricView } from '../config/types';
import {
  assignEntityColors,
  changeSeriesSelection,
  chartSeries,
  selectedSeries,
  seriesAppearance,
  type SeriesSelection
} from '../utils/chart-series';
import { chartTooltip } from '../utils/chart-tooltip';
import {
  alignedPoints,
  displayUnit,
  displayValue,
  finite,
  metricDimensionsLabel,
  metricSeriesLabel,
  seriesIdentity,
  summaryStatistics
} from '../utils/metrics';
import HelpTooltip from './help-tooltip';
import styles from './metric-chart.module.less';
import { hasMetricNotice, MetricNotice, MetricState } from './metric-state';

echarts.use([AriaComponent, MarkPointComponent]);

export interface MetricChartProps {
  metricKey: string;
  title: string;
  metric?: MetricView;
  note?: string;
  measures?: string[];
  extra?: ReactNode;
  colorDomain?: string[];
  rateWindowSeconds?: number;
  neutralMeasures?: string[];
  suppressStaleNotice?: boolean;
}
const MetricChart = ({
  metricKey,
  title,
  metric,
  note,
  measures = [],
  extra,
  colorDomain = [],
  rateWindowSeconds,
  neutralMeasures = [],
  suppressStaleNotice = false
}: MetricChartProps) => {
  const intl = useIntl();
  const config = useChartConfig();
  const [table, setTable] = useState(false);
  const [summaryGroup, setSummaryGroup] = useState('');
  const [cursor, setCursor] = useState(0);
  const [selection, setSelection] = useState<SeriesSelection>(null);
  const chartRef = useRef<any>(null);
  const colorSlots = useRef(new Map<string, number>());
  const groupKey = (dimensions: object) =>
    JSON.stringify(Object.entries(dimensions).sort());
  const series = chartSeries(
    metric?.series || [],
    metric?.kind === 'histogram'
  );
  const selected = selectedSeries(selection, metricKey, series);
  assignEntityColors(series, colorDomain, colorSlots.current);
  const plotted = series.filter(
    (item) => !selected || selected.includes(seriesIdentity(item))
  );
  const label = (item: MetricSeries) => {
    const name = metricSeriesLabel(item, measures);
    return name === metricKey ? title : name;
  };
  const aligned = alignedPoints(series);
  const hasValues = series.some((item) =>
    item.points.some(([, value]) => finite(value) != null)
  );
  const plottedHasValues = plotted.some((item) =>
    item.points.some(([, value]) => finite(value) != null)
  );
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
  const appearance = (item: MetricSeries) => ({
    ...seriesAppearance(
      item,
      metric?.kind === 'histogram',
      measures,
      !!config.isDark,
      colorSlots.current
    ),
    ...(neutralMeasures.some(
      (name) => item.name === name || item.name.startsWith(name + ' · ')
    )
      ? { color: config.isDark ? '#9aa4b1' : '#8b939e' }
      : {})
  });
  const axisInk = config.isDark ? config.token.colorTextTertiary : '#8b939e';
  const axisBorder = config.isDark ? config.token.colorBorder : '#e5e8ec';
  const pointerColor = config.isDark
    ? config.token.colorTextQuaternary
    : '#c8cfd8';
  const options = {
    animation: false,
    aria: {
      enabled: true,
      label: { series: { maxCount: 8 }, data: { maxCount: 4 } }
    },
    grid: { ...config.grid, top: 22, bottom: 28, left: 8, right: 12 },
    legend: {
      ...config.legend,
      show: false,
      data: series.map(label)
    },
    tooltip: {
      ...config.tooltip,
      renderMode: 'html',
      trigger: 'axis',
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
        const index = items[0]?.dataIndex;
        const alignedIndex =
          Number.isInteger(index) &&
          index >= 0 &&
          index < aligned.timestamps.length;
        const rows = alignedIndex
          ? plotted.map((item) => ({
              name: label(item),
              color: appearance(item).color,
              value: `${displayValue(aligned.values[series.indexOf(item)][index], metric?.unit)} ${unit}`
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
                value: `${displayValue(item.data?.value ?? item.value, metric?.unit)} ${unit}`
              };
            });
        return chartTooltip(
          alignedIndex
            ? dayjs(aligned.timestamps[index] * 1000).format('MM-DD HH:mm:ss')
            : items[0]?.axisValueLabel || '',
          rows.slice(0, 12),
          rows.length > 12
            ? intl.formatMessage(
                { id: 'modelMonitoring.moreSeries' },
                { count: rows.length - 12 }
              )
            : undefined
        );
      }
    },
    xAxis: {
      ...config.xAxis,
      data: aligned.timestamps.map((timestamp) =>
        dayjs(timestamp * 1000).format('MM-DD HH:mm:ss')
      ),
      axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: axisBorder } },
      axisLabel: {
        ...config.xAxis.axisLabel,
        color: axisInk,
        fontSize: 12,
        formatter: (value: string) => value.slice(6)
      }
    },
    yAxis: {
      ...config.yAxis,
      min: 0,
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
    series: plotted.map((item) => {
      const identity = seriesIdentity(item),
        index = series.indexOf(item),
        style = appearance(item);
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
          opacity: 1,
          color: style.color,
          type: style.pattern
        },
        itemStyle: {
          color: config.token.colorBgContainer,
          borderColor: style.color,
          borderWidth: 2
        },
        emphasis: {
          scale: 1.3,
          lineStyle: { width: 3 },
          itemStyle: { opacity: 1 }
        },
        // Dense histories use ECharts' temporary hover symbols. Only isolated
        // observations need a permanent marker so a real lone zero stays visible.
        markPoint: {
          silent: true,
          symbol: style.symbol,
          symbolSize: 8,
          label: { show: false },
          itemStyle: {
            color: config.token.colorBgContainer,
            borderColor: style.color,
            borderWidth: 2
          },
          data: aligned.values[index].flatMap((value, point) =>
            value != null &&
            aligned.values[index][point - 1] == null &&
            aligned.values[index][point + 1] == null
              ? [{ xAxis: point, yAxis: value }]
              : []
          )
        },
        data: aligned.values[index].map((value) => ({ value }))
      };
    })
  } as ECOption;
  const hideTooltip = () => {
    const chart = chartRef.current?.chart;
    chart?.dispatchAction({ type: 'downplay' });
    chart?.dispatchAction({ type: 'updateAxisPointer', currTrigger: 'leave' });
    chart?.dispatchAction({ type: 'hideTip' });
  };
  const selectSeries = (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }
  ) => {
    hideTooltip();
    setSelection((current) =>
      changeSeriesSelection(
        current,
        metricKey,
        series,
        id,
        event.ctrlKey || event.metaKey || event.shiftKey
      )
    );
  };
  const onKeyboard = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hideTooltip();
      return;
    }
    if (
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
      !aligned.timestamps.length
    )
      return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? aligned.timestamps.length - 1
          : Math.max(
              0,
              Math.min(
                aligned.timestamps.length - 1,
                cursor + (event.key === 'ArrowRight' ? 1 : -1)
              )
            );
    setCursor(next);
    const seriesIndex = plotted.length ? 0 : -1;
    if (seriesIndex < 0) {
      hideTooltip();
      return;
    }
    chartRef.current?.chart?.dispatchAction({
      type: 'showTip',
      seriesIndex,
      dataIndex: next
    });
  };
  return (
    <Flex
      component="section"
      vertical
      className={`${styles.card} ${metric?.kind === 'histogram' ? styles.latencyCard : ''}`}
      aria-label={title}
    >
      <Flex
        justify="space-between"
        align="center"
        gap={8}
        className={styles.header}
      >
        <Space size={4} align="center">
          <Typography.Title level={5} className={styles.heading}>
            {title} {unit && `(${unit})`}
          </Typography.Title>
          {(metric?.kind === 'histogram' || note) && (
            <HelpTooltip
              label={`${title} · ${intl.formatMessage({ id: metric?.kind === 'histogram' ? 'modelMonitoring.statisticsHelp' : 'modelMonitoring.definition' })}`}
              content={
                <Flex vertical gap={8}>
                  {note && <span>{note}</span>}
                  {metric?.kind === 'histogram' && (
                    <>
                      <strong>
                        {intl.formatMessage({
                          id: 'modelMonitoring.statisticsHelp'
                        })}
                      </strong>
                      <span>
                        {intl.formatMessage({
                          id: 'modelMonitoring.statisticsExplanation'
                        })}
                      </span>
                      {!!rateWindowSeconds && (
                        <span>
                          {intl.formatMessage({
                            id: 'modelMonitoring.intervalVsTrend'
                          })}{' '}
                          {rateWindowSeconds}s
                        </span>
                      )}
                      {series.some(
                        (item) => item.dimensions.model_instance_id != null
                      ) && (
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
        </Space>
        <Space size={8} className={styles.actions}>
          {extra}
          {!table && selected && (
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
          <Button type="link" size="small" onClick={() => setTable(!table)}>
            {intl.formatMessage({
              id: table ? 'modelMonitoring.chart' : 'modelMonitoring.table'
            })}
          </Button>
        </Space>
      </Flex>
      {description && (
        <Typography.Paragraph
          ellipsis={{ tooltip: true }}
          className={styles.note}
        >
          {description}
        </Typography.Paragraph>
      )}
      {metric?.kind === 'histogram' && (
        <>
          {groups.length > 1 && (
            <Select
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
                  {displayValue(summary.value, metric.unit)}
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}
      {table ? (
        <div className={styles.table}>
          {!hasValues && <MetricState metric={metric} />}
          <table>
            <caption className={styles.visuallyHidden}>{title}</caption>
            <thead>
              <tr>
                <th>{intl.formatMessage({ id: 'modelMonitoring.time' })}</th>
                {series.map((item) => (
                  <th key={seriesIdentity(item)}>{label(item)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aligned.timestamps.map((timestamp, index) => (
                <tr key={timestamp}>
                  <td>{dayjs(timestamp * 1000).format('MM-DD HH:mm:ss')}</td>
                  {series.map((item, seriesIndex) => (
                    <td key={seriesIdentity(item)}>
                      {displayValue(
                        aligned.values[seriesIndex][index],
                        metric?.unit
                      )}
                    </td>
                  ))}
                </tr>
              ))}
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
          onBlur={hideTooltip}
        >
          <Chart ref={chartRef} options={options} width="100%" height={230} />
          <span className={styles.visuallyHidden} aria-live="polite">
            {aligned.timestamps[cursor] &&
              dayjs(aligned.timestamps[cursor] * 1000).format(
                'MM-DD HH:mm:ss'
              )}{' '}
            {plotted
              .slice(0, 8)
              .map(
                (item) =>
                  `${label(item)}: ${displayValue(aligned.values[series.indexOf(item)][cursor], metric?.unit)}`
              )
              .join('; ')}
            {plotted.length > 8 &&
              intl.formatMessage(
                { id: 'modelMonitoring.moreSeries' },
                { count: plotted.length - 8 }
              )}
          </span>
        </div>
      ) : (
        <Flex align="center" justify="center" className={styles.plot}>
          {selected ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={intl.formatMessage({
                id: 'modelMonitoring.selectedSeriesNoSamples'
              })}
            />
          ) : (
            <MetricState metric={metric} />
          )}
        </Flex>
      )}
      {!table && (
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
            {intl.formatMessage({ id: 'modelMonitoring.latestValidSample' })}
          </span>
          <Flex vertical gap={4} className={styles.legendRows}>
            {series.map((item) => {
              const identity = seriesIdentity(item);
              const style = appearance(item);
              const last = item.points.reduce<
                [number, number | null] | undefined
              >(
                (latest, point) =>
                  finite(point[1]) != null && (!latest || point[0] > latest[0])
                    ? point
                    : latest,
                undefined
              );
              const hidden = !!selected && !selected.includes(identity);
              return (
                <Button
                  type="text"
                  key={identity}
                  className={styles.legendItem}
                  aria-pressed={!hidden}
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
                      borderTopStyle: 'solid'
                    }}
                    aria-hidden="true"
                  >
                    {style.symbolLabel}
                  </span>
                  <span className={styles.legendName} title={label(item)}>
                    {label(item)}
                  </span>
                  <span className={styles.legendValue}>
                    {displayValue(last?.[1], metric?.unit)} {unit}
                  </span>
                </Button>
              );
            })}
          </Flex>
        </Flex>
      )}
      {hasMetricNotice(noticeMetric) && (
        <div className={styles.notice}>
          <MetricNotice metric={noticeMetric} />
        </div>
      )}
    </Flex>
  );
};
export default MetricChart;
