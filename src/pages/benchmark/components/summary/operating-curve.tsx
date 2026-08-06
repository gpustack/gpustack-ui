import { theme } from 'antd';
import React, { useEffect, useRef } from 'react';
import echarts, { ECharts, EChartsCoreOption } from '../echarts';
import {
  StagePoint,
  fmtMs,
  fmtTps,
  fmtTpsFull,
  linearMax,
  logDomain,
  slaBreachOnset
} from './metrics';
import { C, tooltipRows } from './stage-chart';

interface Props {
  points: StagePoint[];
  loadAxisName: string;
  loadDecimals: number;
  labels: {
    concurrency: string;
    /** Tooltip label for the throughput series. */
    throughput: string;
    /** Left axis title (a unit, so not translated). */
    throughputAxis: string;
    ttftP99: string;
    overloaded: string;
    slaBreached: string;
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
 * Two regions are shaded, both of them measured verdicts: where the SLA stops
 * being met, and where throughput itself collapses. Scaling and Saturated are
 * NOT shaded — they would need a "where does the knee begin" call the backend
 * does not compute, and a band drawn from a guess is worse than no band.
 */
const buildOption = (
  { points, loadAxisName, loadDecimals, labels }: Props,
  // See stage-chart: the gridline colour is the one part of the palette that has
  // to come from the theme token rather than a hex literal.
  splitLineColor: string
): EChartsCoreOption => {
  const cats = points.map((p) => String(Number(p.load.toFixed(loadDecimals))));
  const ttftDomain = logDomain(points.map((p) => p.ttftP99));
  const firstOver = points.findIndex((p) => p.isOverloaded);
  const firstBreach = slaBreachOnset(points);

  // Two red regions, both running to the right edge: where the SLA stops holding
  // and where throughput itself collapses. They answer different questions and
  // are NOT the same boundary — an SLA can break long before the server is
  // overloaded, which is the whole reason a latency target is worth setting.
  //
  // The SLA region is drawn first so the overload region layers on top of it:
  // the shared stretch reads darker, which is the right ordering of bad news.
  // Their labels anchor to opposite ends so they stay legible when the two
  // regions coincide.
  const shadeFrom = (
    from: number,
    color: string,
    text: string,
    position: 'insideBottomLeft' | 'insideBottomRight'
  ) => [
    {
      xAxis: cats[from],
      itemStyle: { color },
      label: {
        show: true,
        position,
        distance: 6,
        color: C.red,
        fontSize: 11,
        fontWeight: 600 as const,
        formatter: text
      }
    },
    { xAxis: cats[cats.length - 1] }
  ];

  const areas = [
    ...(firstBreach >= 0
      ? [
          shadeFrom(
            firstBreach,
            C.slaArea,
            labels.slaBreached,
            'insideBottomLeft'
          )
        ]
      : []),
    ...(firstOver >= 0
      ? [
          shadeFrom(
            firstOver,
            C.overloadArea,
            labels.overloaded,
            'insideBottomRight'
          )
        ]
      : [])
  ];
  const markAreas = areas.length ? { silent: true, data: areas } : undefined;

  return {
    animation: false,
    // Extra headroom so a Best/Peak label on the top-most point stays inside the
    // canvas instead of being clipped by the plot edge.
    grid: { left: 74, right: 74, top: 38, bottom: 52 },
    xAxis: {
      type: 'category',
      data: cats,
      name: loadAxisName,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: C.text, fontSize: 12 },
      axisTick: { show: false },
      axisLabel: { color: C.text },
      axisLine: { lineStyle: { color: C.axis } },
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        name: labels.throughputAxis,
        nameLocation: 'middle',
        nameGap: 56,
        nameTextStyle: { color: C.text, fontSize: 12 },
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
        nameLocation: 'middle',
        nameGap: 56,
        // The right axis gets its own amber so the reader ties the scale to the
        // dashed line it belongs to.
        nameTextStyle: { color: '#b58a17', fontSize: 12 },
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
        const tag = p.isBest
          ? '  ★ Best'
          : p.isPeak
            ? '  Peak'
            : p.isOverloaded
              ? `  ${labels.overloaded}`
              : // Only reached by a stage that is neither Best/Peak nor
                // overloaded: the server is still healthy here, it just is not
                // meeting the target, which is precisely the case the shaded
                // region exists to name.
                p.slaPass === false
                ? `  ${labels.slaBreached}`
                : '';
        return tooltipRows(
          [
            {
              color: C.blue,
              label: `${labels.throughput}  ${p.tps == null ? '-' : fmtTpsFull(p.tps)}`
            },
            {
              color: C.amber,
              label: `${labels.ttftP99}  ${p.ttftP99 == null ? '-' : fmtMs(p.ttftP99)}`
            },
            {
              color: C.gray,
              label: `${labels.concurrency}  ${p.conc == null ? '-' : Math.round(p.conc)}`
            }
          ],
          `${loadAxisName} ${Number(p.load.toFixed(loadDecimals))}${tag}`
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
        lineStyle: { color: C.blue, width: 3 },
        itemStyle: { color: C.blue },
        areaStyle: { color: C.blue, opacity: 0.06 },
        symbolSize: 8,
        markArea: markAreas,
        data: points.map((p, i) => {
          if (!p.isBest && !p.isPeak && !p.isOverloaded) return p.tps;
          const color = p.isBest ? '#f5a623' : p.isPeak ? C.green : C.red;
          // A centered label on the first or last stage runs into the y-axis (on
          // the right it lands on top of the axis ticks). Anchor it away from the
          // edge instead of letting it overhang.
          const atEnd = i === points.length - 1;
          const atStart = i === 0;
          return {
            value: p.tps,
            // The Best marker is the page's single answer, so it outsizes both
            // the curve's own symbols and the small charts' 8px echo of it.
            symbolSize: p.isBest ? 15 : 10,
            itemStyle: {
              color: p.isBest ? '#f5a623' : '#fff',
              borderColor: color,
              borderWidth: 2
            },
            label:
              p.isBest || p.isPeak
                ? {
                    show: true,
                    formatter: p.isBest ? '★ Best' : 'Peak',
                    // Best above, Peak below: on a saturated curve the two sit
                    // one category apart and would otherwise overlap.
                    position: (p.isBest ? 'top' : 'bottom') as 'top' | 'bottom',
                    distance: 10,
                    align: (atEnd ? 'right' : atStart ? 'left' : 'center') as
                      | 'right'
                      | 'left'
                      | 'center',
                    offset: [atEnd ? -4 : atStart ? 4 : 0, 0] as [
                      number,
                      number
                    ],
                    color: p.isBest ? '#b8860b' : C.green,
                    fontSize: 14,
                    fontWeight: 'bold' as const
                  }
                : undefined
          };
        })
      },
      {
        name: labels.ttftP99,
        type: 'line',
        yAxisIndex: 1,
        z: 4,
        lineStyle: { color: C.amber, width: 2, type: 'dashed' },
        itemStyle: { color: C.amber },
        symbolSize: 5,
        data: points.map((p) => p.ttftP99)
      }
    ]
  };
};

const OperatingCurve: React.FC<Props> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<ECharts | null>(null);
  const { token } = theme.useToken();

  useEffect(() => {
    if (!ref.current) return;
    if (!inst.current) inst.current = echarts.init(ref.current);
    inst.current.setOption(buildOption(props, token.colorBorder), true);
    inst.current.resize();
  }, [props, token.colorBorder]);

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

export default OperatingCurve;
