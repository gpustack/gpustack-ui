import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip, theme } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef } from 'react';
import echarts, { ECharts, EChartsCoreOption } from '../echarts';
import { StagePoint, logDomain } from './metrics';

// Echarts can't read CSS variables, so the chart palette lives here as hex.
export const C = {
  blue: '#2563eb',
  amber: '#e0a800',
  red: '#e5484d',
  green: '#16a34a',
  violet: '#7c3aed',
  gray: '#c8cfd8',
  // Reference lines (a configured target the measured line is compared against).
  // C.gray is an axis-pointer / hairline value — at 1.5:1 on white a data line
  // drawn in it reads as absent, which is exactly how a configured-concurrency
  // line the client tracked to within a few percent used to disappear.
  slate: '#94a3b8',
  // Band fills, and the swatch shown for them in the legend.
  blueBand: 'rgba(37,99,235,0.13)',
  blueSwatch: '#c3d4f2',
  violetBand: 'rgba(124,58,237,0.12)',
  violetSwatch: '#d5c6f5',
  redBand: 'rgba(229,72,77,0.12)',
  redSwatch: '#f5c6c7',
  // Resting fill of an overloaded row's bar; C.red is its emphasized form.
  redSoft: '#f0a8aa',
  overloadArea: 'rgba(229,72,77,0.05)',
  // Same red, same weight: an SLA breach and an overload are both "past here the
  // numbers are not an answer". Where they overlap the two tints compound, and
  // the labels say which is which.
  slaArea: 'rgba(229,72,77,0.05)',
  // Text: the stroke greys are unreadable as type (1.6–2.2:1 on white), so
  // secondary text gets its own value and the right axis its own amber.
  text: '#8b939e',
  axis: '#e5e8ec'
  // No gridline value here: it is the one colour that has to recede into the
  // background behind it, so it comes from the theme token at render time.
};

type Getter = (p: StagePoint) => number | null;

export interface ChartSeries {
  name: string;
  value: Getter;
  color: string;
  dashed?: boolean;
}

/** An IQR-style band. Its bounds must be real quantiles. */
export interface ChartBand {
  name: string;
  lo: Getter;
  hi: Getter;
  fill: string;
  swatch: string;
  /**
   * Set false for a band whose bounds are already listed as their own series —
   * a gap band between Configured and Achieved would otherwise repeat both
   * numbers as "Shortfall 4 – 4". An IQR band is the only source of its
   * quantiles, so it keeps its row.
   */
  tooltip?: boolean;
}

export interface ChartSpec {
  key: string;
  title: string;
  note: string;
  yName: string;
  /** Shared by axis ticks and the tooltip — one formatter, one rendering. */
  fmt: (v: number) => string;
  log?: boolean;
  /** Linear axis upper bound; omit to let echarts fit the data. */
  max?: number;
  series: ChartSeries[];
  bands?: ChartBand[];
  /** Value x-axis (throughput / concurrency); omitted = categorical load axis. */
  x?: {
    name: string;
    value: Getter;
    fmt: (v: number) => string;
    log?: boolean;
  };
  /** Label the Best / Peak points on the first series. */
  marks?: boolean;
  /**
   * Right-hand axis for a RESIDUAL — the difference between two main series,
   * given its own scale because it is too small to see against them.
   *
   * Two lines 384 and 375 sit under a pixel apart on an axis wide enough for
   * both, so "is there a gap" cannot be answered by looking at the gap. Drawn as
   * a filled area rather than another line: it is a magnitude per stage, not a
   * third curve to be traced against the first two.
   */
  y2?: {
    name: string;
    fmt: (v: number) => string;
    series: Array<{ name: string; value: Getter; color: string; fill: string }>;
  };
  /**
   * Extra tooltip rows, appended after the series. For a readout that needs a
   * quantity the chart does not plot — the gap as a percentage next to the gap
   * in requests.
   */
  tooltipExtra?: (p: StagePoint) => Array<{ color: string; label: string }>;
}

const useStyles = createStyles(({ css }) => ({
  card: css`
    background: var(--ant-color-bg-container);
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: var(--ant-border-radius);
    padding: 12px 14px 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    .head {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .head .meta {
      flex: 1;
      min-width: 0;
    }
    .head .t {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--ant-color-text);
    }
    .head .n {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      line-height: 1.45;
    }
    .head .hint {
      color: var(--ant-color-text-quaternary);
      font-size: 12px;
      cursor: help;
    }
    .legend {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: none;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .legend .li {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      white-space: nowrap;
    }
    .legend .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex: none;
    }
    .legend .swatch {
      width: 14px;
      height: 9px;
      border-radius: 2px;
      flex: none;
    }
  `
}));

export const tooltipRows = (
  rows: Array<{ color: string; label: string }>,
  header: string
): string => {
  const items = rows
    .map(
      (r) =>
        `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">` +
        `<span style="width:7px;height:7px;border-radius:50%;background:${r.color};flex:none"></span>` +
        `<span>${r.label}</span></div>`
    )
    .join('');
  return `<div style="font-size:12px"><div style="opacity:.7">${header}</div>${items}</div>`;
};

interface Props {
  spec: ChartSpec;
  points: StagePoint[];
  /** Load-axis label for the categorical x-axis and the tooltip header. */
  loadAxisName: string;
  loadDecimals: number;
  logHint?: string;
  height?: number;
}

const buildOption = (
  { spec, points, loadAxisName, loadDecimals }: Props,
  // Gridlines are the one part of the palette that cannot be a hex literal like
  // the rest of `C`: they have to recede into whichever background is behind
  // them, and a light-theme value reads as a set of bright solid rules in dark
  // mode. Taken from the antd token so it tracks the theme, and dashed to match
  // core-ui's charts.
  splitLineColor: string
): EChartsCoreOption => {
  const isValueX = !!spec.x;
  const num = (v: number | null) => (v == null ? null : v);

  // Bands render as two stacked areas: an invisible base at the lower bound and
  // the visible band on top of it. Stacking is arithmetic, so the top edge lands
  // exactly on the upper quantile even on a log axis.
  //
  // Only on the categorical load axis: echarts stacks by category, so on a value
  // x-axis the two series would not line up and the band would be drawn in the
  // wrong place. No current spec pairs a band with a value x-axis; this guard is
  // here so adding one fails visibly (no band) instead of quietly lying.
  const bands = isValueX ? [] : spec.bands || [];
  const bandSeries = bands.flatMap((b, bi) => {
    const lo = points.map((p) => b.lo(p));
    const hi = points.map((p) => b.hi(p));
    // A band whose quantiles were never recorded is dropped, not faked.
    if (lo.every((v) => v == null) || hi.every((v) => v == null)) return [];
    const xy = (vals: Array<number | null>) => vals.map((v) => num(v));
    const base = {
      name: `__band${bi}_base`,
      type: 'line' as const,
      stack: `band${bi}`,
      symbol: 'none' as const,
      lineStyle: { opacity: 0 },
      areaStyle: { opacity: 0 },
      silent: true,
      data: xy(lo)
    };
    const span = {
      name: `__band${bi}`,
      type: 'line' as const,
      stack: `band${bi}`,
      symbol: 'none' as const,
      lineStyle: { opacity: 0 },
      areaStyle: { color: b.fill },
      silent: true,
      data: xy(
        hi.map((v, i) => (v == null || lo[i] == null ? null : v - lo[i]!))
      )
    };
    return [base, span];
  });

  const bestIdx = points.findIndex((p) => p.isBest);
  const peakIdx = points.findIndex((p) => p.isPeak);

  // A label centred on a mark that sits against an edge hangs half of itself off
  // the canvas, so anchor it inward instead. Shared by the guide line and the
  // point markers — they clip for the same reason and used to answer it twice.
  const edgeAlign = (frac: number): 'right' | 'left' | 'center' =>
    frac > 0.85 ? 'right' : frac < 0.15 ? 'left' : 'center';

  // Where the recommended operating point sits — on EVERY chart. Each one is read
  // as "what does this look like at the load we recommend", and that question has
  // no answer if the reader has to hold the number in their head and find it.
  //
  // Two forms, picked by what the x-axis already tells you:
  //   * categorical (the load axis) — a vertical guide. The position is already ON
  //     the axis, so a label on the point would only add clutter; a plain line
  //     also lets the eye run across a row of charts at the same x.
  //   * value axis (throughput / concurrency) — the marker on the point (below).
  //     The load is not on the axis at all, so nothing else can locate it.
  const bestGuide =
    !isValueX && bestIdx >= 0
      ? {
          silent: true,
          symbol: 'none' as const,
          lineStyle: {
            color: '#f5a623',
            type: 'dashed' as const,
            width: 1.5
          },
          label: {
            show: true,
            position: 'end' as const,
            formatter: '★ Best',
            color: '#b8860b',
            fontSize: 11,
            fontWeight: 'bold' as const,
            // Anchor away from the edge the guide sits against, exactly as the
            // point markers below do. The label is centred on the line by
            // default, and the guide is at its most useful precisely where that
            // clips: an auto-tune run that never breaks its SLA recommends the
            // highest load it measured, so the line lands on the LAST category
            // and half the text falls off the canvas ("★ Bes").
            align: edgeAlign(bestIdx / Math.max(points.length - 1, 1))
          },
          data: [
            {
              xAxis: String(Number(points[bestIdx].load.toFixed(loadDecimals)))
            }
          ]
        }
      : undefined;

  // Horizontal extent of a value x-axis, for keeping an edge marker's label
  // inside the canvas. On the frontier the Best point is by definition at the
  // maximum throughput — i.e. always against the right edge — so a centered label
  // there is always half clipped ("★ Bes").
  const xValues = isValueX ? points.map((p) => spec.x!.value(p) ?? 0) : [];
  const xMin = xValues.length ? Math.min(...xValues) : 0;
  const xSpan = (xValues.length ? Math.max(...xValues) : 0) - xMin || 1;

  const lineSeries = spec.series.map((s, si) => ({
    name: s.name,
    type: 'line' as const,
    // One guide per chart, not one per line.
    markLine: si === 0 ? bestGuide : undefined,
    symbolSize: 5,
    // Dashed = a reference line (configured target, p99 tail). Drawn ABOVE the
    // solid measured lines: on a closed-loop run the actual value tracks its
    // target to within a few percent, so at chart scale the two coincide and
    // whichever is painted last is the only one the reader sees. A dashed line
    // on top still lets the solid one show through its gaps; the reverse hides
    // the reference entirely and reads as "never drawn".
    z: s.dashed ? 7 : 5,
    lineStyle: {
      color: s.color,
      width: 2,
      type: s.dashed ? ('dashed' as const) : ('solid' as const)
    },
    itemStyle: { color: s.color },
    data: points.map((p, i) => {
      const v = s.value(p);
      const value = isValueX ? [spec.x!.value(p), v] : v;
      // Best / Peak are called out on the leading series only — two labels on
      // the same point in a small canvas is unreadable.
      const marked = spec.marks && si === 0 && (i === bestIdx || i === peakIdx);
      if (!marked) return value;
      const isBest = i === bestIdx;
      // On a categorical x-axis the Best guide line already carries the "★ Best"
      // text at its end, on the same x as this point — printing it here too put
      // two overlapping labels on the throughput-split chart. Keep the marker
      // (the highlighted symbol is what ties the guide line to the curve) and let
      // the line do the talking. Peak has no guide line, so it keeps its label,
      // and on a value x-axis there is no guide line at all.
      const labelled = isValueX || !isBest;
      // Anchor away from whichever edge the point is against, instead of letting
      // the label overhang the canvas.
      const frac = isValueX
        ? ((spec.x!.value(p) ?? 0) - xMin) / xSpan
        : i / Math.max(points.length - 1, 1);
      const align = edgeAlign(frac);
      const atRight = align === 'right';
      const atLeft = align === 'left';
      return {
        value,
        symbolSize: 8,
        itemStyle: { color: isBest ? '#f5a623' : C.green },
        label: {
          show: labelled,
          formatter: isBest ? '★ Best' : 'Peak',
          color: isBest ? '#b8860b' : C.green,
          fontSize: 11,
          fontWeight: 'bold' as const,
          // Stagger vertically and align away from each other: on a value x-axis
          // Best and Peak can sit a dozen pixels apart.
          position: (isBest ? 'top' : 'bottom') as 'top' | 'bottom',
          distance: 8,
          align,
          offset: [atRight ? -6 : atLeft ? 6 : 0, 0] as [number, number]
        }
      };
    })
  }));

  const yAxis: Record<string, unknown> = {
    type: spec.log ? 'log' : 'value',
    name: spec.yName,
    nameLocation: 'middle',
    nameGap: 46,
    nameTextStyle: { color: C.text, fontSize: 12 },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: C.text, formatter: (v: number) => spec.fmt(v) },
    splitLine: {
      show: true,
      lineStyle: { type: 'dashed', color: splitLineColor }
    }
  };
  if (spec.log) {
    const d = logDomain(
      points.flatMap((p) => [
        ...spec.series.map((s) => s.value(p)),
        ...bands.flatMap((b) => [b.lo(p), b.hi(p)])
      ])
    );
    if (d) {
      yAxis.min = d.min;
      yAxis.max = d.max;
    }
  } else if (spec.max != null) {
    yAxis.max = spec.max;
  }

  // The residual axis always starts at zero: its whole job is "how big is the
  // gap", and a fitted floor would turn a 9-request shortfall that never changes
  // into a dramatic-looking curve.
  const residualSeries = spec.y2?.series ?? [];
  const yAxis2 = spec.y2 && {
    type: 'value',
    name: spec.y2.name,
    nameLocation: 'middle',
    nameGap: 42,
    nameTextStyle: { color: C.red, fontSize: 12 },
    min: 0,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: C.red, formatter: (v: number) => spec.y2!.fmt(v) },
    splitLine: { show: false }
  };
  const residualDrawn = residualSeries.map((s) => ({
    name: s.name,
    type: 'line' as const,
    yAxisIndex: 1,
    // Under the main lines: it is context for them, not a curve competing with
    // them for the reader's eye.
    z: 2,
    symbol: 'none' as const,
    lineStyle: { color: s.color, width: 1 },
    areaStyle: { color: s.fill },
    data: points.map((p) => s.value(p))
  }));

  const xAxis: Record<string, unknown> = isValueX
    ? {
        type: spec.x!.log ? 'log' : 'value',
        name: spec.x!.name,
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: C.text, fontSize: 12 },
        axisTick: { show: false },
        axisLabel: { color: C.text, formatter: (v: number) => spec.x!.fmt(v) },
        axisLine: { lineStyle: { color: C.axis } },
        splitLine: { show: false },
        ...(spec.x!.log
          ? logDomain(points.map((p) => spec.x!.value(p))) || {}
          : {})
      }
    : {
        type: 'category',
        data: points.map((p) => String(Number(p.load.toFixed(loadDecimals)))),
        name: loadAxisName,
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: C.text, fontSize: 12 },
        axisTick: { show: false },
        axisLabel: { color: C.text },
        axisLine: { lineStyle: { color: C.axis } },
        boundaryGap: false
      };

  return {
    animation: false,
    // Top headroom is for the Best / Peak label: those points sit near the top of
    // their own chart by definition, and a 'top'-positioned label on the highest
    // point gets clipped by the plot edge without it.
    grid: { left: 62, right: spec.y2 ? 56 : 14, top: 26, bottom: 44 },
    xAxis,
    yAxis: yAxis2 ? [yAxis, yAxis2] : yAxis,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: C.gray, type: 'dashed' }
      },
      // Log scaling is a drawing choice; the readout must be the real value —
      // built from the point itself so band bounds are listed too.
      formatter: (params: any) => {
        const idx = Array.isArray(params)
          ? params[0]?.dataIndex
          : params?.dataIndex;
        const p = points[idx];
        if (!p) return '';
        // The load stage IS the point's identity, so it heads every tooltip —
        // including the value-x charts, where the axis is throughput or
        // concurrency and the reader otherwise has no way back to "which stage is
        // this?". Naming only the x metric there left the frontier unreadable: a
        // dot at 34.95k tok/s could be any rate in the sweep.
        const tag =
          spec.marks && p.isBest
            ? '  ★ Best'
            : spec.marks && p.isPeak
              ? '  Peak'
              : '';
        const header = `${loadAxisName} ${Number(p.load.toFixed(loadDecimals))}${tag}`;
        const rows: Array<{ color: string; label: string }> = [];
        if (isValueX) {
          // Moved out of the header rather than dropped: it is still the position
          // on screen, just no longer the label that identifies the point.
          rows.push({
            color: C.gray,
            label: `${spec.x!.name}  ${spec.x!.fmt(spec.x!.value(p) ?? 0)}`
          });
        }
        bands.forEach((b) => {
          if (b.tooltip === false) return;
          const lo = b.lo(p);
          const hi = b.hi(p);
          if (lo == null || hi == null) return;
          rows.push({
            color: b.swatch,
            label: `${b.name}  ${spec.fmt(lo)} – ${spec.fmt(hi)}`
          });
        });
        spec.series.forEach((s) => {
          const v = s.value(p);
          rows.push({
            color: s.color,
            label: `${s.name}  ${v == null ? '-' : spec.fmt(v)}`
          });
        });
        residualSeries.forEach((s) => {
          const v = s.value(p);
          rows.push({
            color: s.color,
            label: `${s.name}  ${v == null ? '-' : spec.y2!.fmt(v)}`
          });
        });
        rows.push(...(spec.tooltipExtra?.(p) ?? []));
        return tooltipRows(rows, header);
      }
    },
    series: [...bandSeries, ...residualDrawn, ...lineSeries]
  };
};

/**
 * One detail chart: DOM header (title, log hint, note, legend) plus an echarts
 * canvas. The legend is built here so a band gets its own entry and the colors
 * stay one-to-one with the series — sharing one palette array between bands and
 * lines by index offset silently drops the last line.
 */
const StageChart: React.FC<Props> = (props) => {
  const { styles } = useStyles();
  const { spec, points, logHint, height = 200 } = props;
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

  const legend = [
    // Same rule as the renderer: no band drawn on a value x-axis, so no entry.
    ...(spec.x ? [] : spec.bands || []).map((b) => ({
      name: b.name,
      node: <span className="swatch" style={{ background: b.swatch }} />
    })),
    ...spec.series.map((s) => ({
      name: s.name,
      node: <span className="dot" style={{ background: s.color }} />
    })),
    // The residual is an area, so it gets a band's swatch rather than a line's
    // dot — the legend has to say "this one is read off the other axis".
    ...(spec.y2?.series || []).map((s) => ({
      name: s.name,
      node: <span className="swatch" style={{ background: s.fill }} />
    }))
  ];

  return (
    <div className={styles.card}>
      <div className="head">
        <div className="meta">
          <div className="t">
            <span>{spec.title}</span>
            {spec.log && logHint && (
              <Tooltip title={logHint}>
                <QuestionCircleOutlined className="hint" />
              </Tooltip>
            )}
          </div>
          <div className="n">{spec.note}</div>
        </div>
        <div className="legend">
          {legend.map((l) => (
            <span className="li" key={l.name}>
              {l.node}
              {l.name}
            </span>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ width: '100%', height }} />
    </div>
  );
};

export default StageChart;
