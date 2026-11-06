import { theme } from 'antd';
import React, { useEffect, useRef } from 'react';
import echarts, { ECharts, EChartsCoreOption } from '../echarts';
import {
  StagePoint,
  fmtMs,
  fmtTps,
  fmtTpsFull,
  isSloCapacityPoint,
  linearMax,
  logDomain,
  sloBreachOnset
} from './metrics';
import { C, tooltipRows } from './stage-chart';

interface Props {
  points: StagePoint[];
  latencyValue: (point: StagePoint) => number | null;
  latencyThreshold?: number;
  /** Tooltip header, e.g. "Request Rate 29" — no unit, the value carries it. */
  loadAxisName: string;
  /** x-axis title, e.g. "Request rate (req/s)" — bare ticks, so it needs one. */
  loadAxisTitle: string;
  labels: {
    concurrency: string;
    primary: string;
    peak: string;
    primaryHint?: string;
    peakHint?: string;
    /** Tooltip label for the throughput series. */
    throughput: string;
    /** Left axis title, unit included. */
    throughputAxis: string;
    ttftP99: string;
    overloaded: string;
    declining: string;
    sloBreached: string;
  };
  height?: number;
}

/**
 * The report's main chart: how much this deployment carries, and where it breaks.
 *
 * Throughput on the left (linear — a 4x span reads fine) and TTFT p99 on the
 * right (log — the same run spans three orders of magnitude, and a linear right
 * axis would flatten the whole pre-knee range onto zero). The two axes therefore
 * follow different rules while sharing one set of gridlines, which is exactly why
 * the panel carries a (?) explaining it: read the amber line as linear and you
 * underestimate the post-knee blow-up by an order of magnitude.
 *
 * SLO breaches, request overload and throughput decline have separate labels.
 * Health regions span consecutive affected measurements only; an isolated point
 * gets its own marker without implying that later measured loads share its state.
 */
export const buildLoadSweepOption = (
  {
    points,
    latencyValue,
    latencyThreshold,
    loadAxisName,
    loadAxisTitle,
    labels
  }: Props,
  splitLineColor: string,
  axisLineColor = C.axis
): EChartsCoreOption => {
  const cats = points.map((p) => String(p.load));
  const ttftDomain = logDomain([
    ...points.map((p) => latencyValue(p)),
    latencyThreshold
  ]);
  const firstBreach = sloBreachOnset(points);

  const shadeRange = (
    from: number,
    to: number,
    text: string,
    appearance: {
      color: string;
      opacity?: number;
      labelColor: string;
      position: 'insideBottomLeft' | 'insideBottomRight';
    }
  ) => [
    {
      xAxis: from,
      itemStyle: { color: appearance.color, opacity: appearance.opacity ?? 1 },
      label: {
        show: true,
        position: appearance.position,
        distance: 6,
        color: appearance.labelColor,
        fontSize: 11,
        fontWeight: 600 as const,
        formatter: text
      }
    },
    { xAxis: to }
  ];

  const consecutiveStatusRanges = (kind: 'overloaded' | 'declining') => {
    const ranges: [number, number][] = [];
    let start = -1;
    for (let i = 0; i <= points.length; i++) {
      if (i < points.length && points[i].status === kind) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        if (i - start > 1) {
          ranges.push([start, i - 1]);
        }
        start = -1;
      }
    }
    return ranges;
  };
  const statusRanges = {
    declining: consecutiveStatusRanges('declining'),
    overloaded: consecutiveStatusRanges('overloaded')
  };
  const shadeStatus = (kind: 'overloaded' | 'declining') =>
    statusRanges[kind].map(([start, end]) =>
      shadeRange(start, end, labels[kind], {
        color: kind === 'declining' ? C.amber : C.overloadArea,
        opacity: kind === 'declining' ? 0.06 : 1,
        labelColor: kind === 'declining' ? C.text : C.red,
        position: 'insideBottomRight'
      })
    );

  const areas = [
    ...(firstBreach >= 0
      ? [
          shadeRange(firstBreach, cats.length - 1, labels.sloBreached, {
            color: C.sloArea,
            labelColor: C.red,
            position: 'insideBottomLeft'
          })
        ]
      : []),
    ...shadeStatus('declining'),
    ...shadeStatus('overloaded')
  ];
  const markAreas = areas.length ? { silent: true, data: areas } : undefined;
  return {
    animation: false,
    // Let the tick labels determine the side gutters.
    grid: { left: 4, right: 8, top: 48, bottom: 20, containLabel: true },
    // Anchor the name to the canvas edge so wide ticks cannot shift it.
    graphic: {
      type: 'text',
      left: 4,
      top: 4,
      silent: true,
      style: { text: labels.throughputAxis, fill: C.text, fontSize: 12 }
    },
    xAxis: {
      type: 'category',
      data: cats,
      name: loadAxisTitle,
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: C.text, fontSize: 12 },
      axisTick: { show: false },
      axisLabel: { color: C.text },
      axisLine: { lineStyle: { color: axisLineColor } },
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: linearMax(points.map((p) => p.tps)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: C.text, formatter: (v: number) => fmtTps(v) },
        splitLine: {
          show: true,
          lineStyle: { type: 'dashed', color: splitLineColor }
        }
      },
      {
        type: 'log',
        name: labels.ttftP99,
        nameLocation: 'end',
        nameRotate: 0,
        nameGap: 32,
        // The right axis gets its own amber so the reader ties the scale to the
        // dashed line it belongs to.
        nameTextStyle: {
          align: 'right',
          verticalAlign: 'bottom',
          padding: [0, -8, 0, 0],
          color: '#b58a17',
          fontSize: 12
        },
        ...(ttftDomain || {}),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#b58a17', formatter: (v: number) => fmtMs(v) },
        splitLine: { show: false }
      }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: C.gray, type: 'dashed' }
      },
      formatter: (params: any) => {
        const idx = Array.isArray(params)
          ? params[0]?.dataIndex
          : params?.dataIndex;
        const p = points[idx];
        if (!p) return '';
        const latency = latencyValue(p);
        const tag = [
          isSloCapacityPoint(p) ? `★ ${labels.primary}` : '',
          p.isPeak ? labels.peak : '',
          p.isOverloaded ? labels.overloaded : '',
          p.isDeclining ? labels.declining : '',
          p.sloPass === false ? labels.sloBreached : ''
        ]
          .filter(Boolean)
          .join(' · ');
        return tooltipRows(
          [
            {
              color: C.blue,
              label: `${labels.throughput}  ${p.tps == null ? '-' : fmtTpsFull(p.tps)}`
            },
            {
              color: C.amber,
              label: `${labels.ttftP99}  ${latency == null ? '-' : fmtMs(latency)}`
            },
            {
              color: C.gray,
              label: `${labels.concurrency}  ${p.conc == null ? '-' : Math.round(p.conc)}`
            },
            ...(isSloCapacityPoint(p) && labels.primaryHint
              ? [{ color: C.amber, label: labels.primaryHint }]
              : []),
            ...(p.isPeak && labels.peakHint
              ? [{ color: C.green, label: labels.peakHint }]
              : [])
          ],
          `${loadAxisName} ${p.load}${tag ? ` · ${tag}` : ''}`
        );
      }
    },
    series: [
      {
        name: labels.throughput,
        type: 'line',
        yAxisIndex: 0,
        z: 5,
        // Heavier than a detail chart's 2px: this canvas is 330px tall against
        // their 200, so an identical stroke reads THINNER here, and this is the
        // one curve the page is built around.
        lineStyle: { color: C.blue, width: 2 },
        itemStyle: { color: C.blue },
        areaStyle: { color: C.blue, opacity: 0.06 },
        symbolSize: 6,
        markArea: markAreas,
        data: points.map((p, i) => {
          if (
            !isSloCapacityPoint(p) &&
            !p.isPeak &&
            !p.isOverloaded &&
            !p.isDeclining
          )
            return p.tps;
          const color = isSloCapacityPoint(p)
            ? '#f5a623'
            : p.isPeak
              ? C.green
              : p.isDeclining
                ? C.amber
                : C.red;
          // Shape and text distinguish peak, decline and request overload even
          // when their status colors cannot be told apart.
          const symbol = isSloCapacityPoint(p)
            ? 'circle'
            : p.isPeak
              ? 'triangle'
              : p.isDeclining
                ? 'triangle'
                : 'diamond';
          // A centered label on the first or last stage runs into the y-axis (on
          // the right it lands on top of the axis ticks). Anchor it away from the
          // edge instead of letting it overhang.
          const atEnd = i === points.length - 1;
          const atStart = i === 0;
          // A continuous decline is labeled once by its shaded region. Keep
          // isolated decline labels and every point's marker and tooltip.
          const declineInArea = statusRanges.declining.some(
            ([start, end]) => i >= start && i <= end
          );
          return {
            value: p.tps,
            symbol,
            symbolRotate:
              p.isDeclining && !isSloCapacityPoint(p) && !p.isPeak ? 180 : 0,
            // The Best marker is the page's single answer, so it outsizes both
            // the curve's own symbols and the small charts' 8px echo of it.
            symbolSize: isSloCapacityPoint(p) ? 10 : 8,
            itemStyle: {
              color: isSloCapacityPoint(p) ? '#f5a623' : '#fff',
              borderColor: color,
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: [
                isSloCapacityPoint(p) ? `★ ${labels.primary}` : '',
                p.isPeak ? labels.peak : '',
                p.isOverloaded ? labels.overloaded : '',
                p.isDeclining && !declineInArea ? labels.declining : ''
              ]
                .filter(Boolean)
                .join(' · '),
              // Best above, the other two below: on a saturated curve they sit
              // one category apart and would otherwise overlap.
              position: (isSloCapacityPoint(p) ? 'top' : 'bottom') as
                | 'top'
                | 'bottom',
              distance: 10,
              align: (atEnd ? 'right' : atStart ? 'left' : 'center') as
                | 'right'
                | 'left'
                | 'center',
              offset: [atEnd ? -4 : atStart ? 4 : 0, 0] as [number, number],
              color: isSloCapacityPoint(p) ? '#b8860b' : color,
              fontSize: 14,
              fontWeight: 'bold' as const
            }
          };
        })
      },
      {
        name: labels.ttftP99,
        markLine:
          latencyThreshold == null
            ? undefined
            : {
                silent: true,
                symbol: 'none',
                data: [{ yAxis: latencyThreshold, name: labels.ttftP99 }]
              },
        type: 'line',
        yAxisIndex: 1,
        z: 4,
        lineStyle: { color: C.amber, width: 2, type: 'dashed' },
        itemStyle: { color: C.amber },
        symbolSize: 5,
        data: points.map((p) => latencyValue(p))
      }
    ]
  };
};

const LoadSweep: React.FC<Props> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<ECharts | null>(null);
  const { token } = theme.useToken();
  const axisLineColor =
    'darkMode' in token && token.darkMode ? token.colorBorder : C.axis;

  useEffect(() => {
    if (!ref.current) return;
    if (!inst.current) inst.current = echarts.init(ref.current);
    inst.current.setOption(
      buildLoadSweepOption(props, token.colorBorder, axisLineColor),
      true
    );
    inst.current.resize();
  }, [props, token.colorBorder, axisLineColor]);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => inst.current?.resize());
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(
    () => () => {
      inst.current?.dispose();
      inst.current = null;
    },
    []
  );

  return (
    <div ref={ref} style={{ width: '100%', height: props.height ?? 330 }} />
  );
};

export default LoadSweep;
