import React, { useEffect, useRef } from 'react';
import echarts, { ECharts } from './echarts';

interface DistributionChartProps {
  mean?: number | null; // distribution center (Input/Output Token Length)
  stdev?: number | null; // spread (±)
  min?: number | null; // clamp lower bound
  max?: number | null; // clamp upper bound
}

const num = (v: any): number | null =>
  v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);

// Live preview of the token-length distribution, mirroring guidellm's
// IntegerRangeSampler:
//   - Spread (stdev) set      -> Gaussian(mean, stdev), clamped to [min,max]
//   - only Min & Max set      -> uniform over [min,max]
//   - nothing set             -> fixed length (a spike at the mean)
const DistributionChart: React.FC<DistributionChartProps> = ({
  mean,
  stdev,
  min,
  max
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<ECharts | null>(null);

  useEffect(() => {
    const m = num(mean);
    if (m == null || !ref.current) {
      return;
    }
    if (!inst.current) {
      inst.current = echarts.init(ref.current);
    }
    const s = (num(stdev) ?? 0) > 0 ? (num(stdev) as number) : 0;
    const mn = num(min);
    const mx = num(max);

    let lo: number;
    let hi: number;
    if (s) {
      lo = mn ?? Math.max(0, m - 4 * s);
      hi = mx ?? m + 4 * s;
    } else if (mn != null && mx != null) {
      const pad = Math.max(1, (mx - mn) * 0.15);
      lo = Math.max(0, mn - pad);
      hi = mx + pad;
    } else {
      const pad = Math.max(1, Math.round(m * 0.3));
      lo = Math.max(0, m - pad);
      hi = m + pad;
    }
    if (hi <= lo) {
      hi = lo + 1;
    }

    const N = 96;
    const step = (hi - lo) / N;
    const data: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const x = lo + step * i;
      let y: number;
      if (s) {
        const inClamp = (mn == null || x >= mn) && (mx == null || x <= mx);
        y = inClamp ? Math.exp(-((x - m) ** 2) / (2 * s * s)) : 0;
      } else if (mn != null && mx != null) {
        y = x >= mn && x <= mx ? 1 : 0; // uniform
      } else {
        y = Math.abs(x - m) <= step ? 1 : 0; // fixed length spike
      }
      data.push([Math.round(x), y]);
    }

    const markData: any[] = [
      { xAxis: m, label: { formatter: 'μ', position: 'insideEndTop' } }
    ];
    if (mn != null) {
      markData.push({ xAxis: mn, label: { formatter: 'min' } });
    }
    if (mx != null) {
      markData.push({ xAxis: mx, label: { formatter: 'max' } });
    }

    inst.current.setOption(
      {
        grid: { left: 8, right: 8, top: 18, bottom: 22 },
        tooltip: {
          trigger: 'axis',
          formatter: (p: any) => `~${p[0].data[0]} tokens`
        },
        xAxis: { type: 'value', min: lo, max: hi, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', show: false, min: 0, max: 1.1 },
        series: [
          {
            type: 'line',
            smooth: s > 0,
            step: !s && mn != null && mx != null ? 'middle' : false,
            symbol: 'none',
            areaStyle: { opacity: 0.25 },
            lineStyle: { width: 2 },
            data,
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: { type: 'dashed' },
              data: markData
            }
          }
        ]
      },
      true
    );
    inst.current.resize();
  }, [mean, stdev, min, max]);

  // Keep the chart sized to its (flex) container.
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const ro = new ResizeObserver(() => inst.current?.resize());
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      inst.current?.dispose();
      inst.current = null;
    };
  }, []);

  if (num(mean) == null) {
    return null;
  }
  return <div ref={ref} style={{ width: '100%', height: 120 }} />;
};

export default DistributionChart;
