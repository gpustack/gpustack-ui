import useCoolColors from '@/hooks/use-cool-colors';
import { Chart } from '@gpustack/core-ui/charts';
import { formatLargeNumber } from '@gpustack/core-ui/utils';
import { Empty, Spin, theme } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

export interface PieChartItem {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartItem[];
  height?: number | string;
  width?: number | string;
  loading?: boolean;
  colorOffset?: number;
  total?: number;
  totalLabel?: string;
}

// Donut sits on the left; a vertical legend hugs it just to the right and
// scrolls when there are many entries.
const CENTER_X = '32%';
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  width = '100%',
  loading = false,
  colorOffset = 0,
  total,
  totalLabel
}) => {
  const { token } = theme.useToken();
  const chartRef = useRef<{ chart: any } | null>(null);
  const generateCoolColors = useCoolColors();

  // ECharts reads the DOM width at init time; with a "100%" width it can pick
  // up a stale/tiny value while layout is still resolving, briefly rendering
  // the donut undersized before its internal (throttled) ResizeObserver
  // corrects it — a visible flash. We measure the container via a callback ref
  // (fires during commit, before paint) and feed ECharts an explicit pixel
  // width so the first render is already correct. The ResizeObserver keeps it
  // in sync afterwards.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    if (!node) return;
    setMeasuredWidth(node.clientWidth);
    resizeObserverRef.current = new ResizeObserver(() => {
      setMeasuredWidth(node.clientWidth);
    });
    resizeObserverRef.current.observe(node);
  }, []);
  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  const colors = useMemo(() => {
    const generatedColors = generateCoolColors(data.length + colorOffset);
    return generatedColors.slice(colorOffset);
  }, [colorOffset, data.length, generateCoolColors]);

  const options = useMemo(
    () => ({
      color: colors,
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: true
      },
      tooltip: {
        trigger: 'item',
        position: 'top',
        // Keep the tooltip inside the chart box — the donut sits on the left, so
        // a left-slice tooltip could otherwise spill out and get hidden behind
        // the side menu.
        confine: false,
        backgroundColor: token.colorBgElevated,
        borderColor: 'transparent',
        formatter: (params: any) => {
          return `<div class="tooltip-wrapper">
            <span class="tooltip-item">
              <span class="tooltip-item-name">
                <span class="tooltip-item-dot" style="border-radius:50%;background-color:${params.color};"></span>
                <span class="tooltip-item-title">${params.name}</span>:
              </span>
              <span class="tooltip-value">${formatLargeNumber(round2(params.value))} (${params.percent}%)</span>
            </span>
          </div>`;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        left: '56%',
        top: 'middle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 10,
        // Long names are truncated in the legend; hovering shows the full name
        // in a tooltip.
        tooltip: { show: true },
        textStyle: {
          color: token.colorTextTertiary,
          overflow: 'truncate',
          width: 120
        },
        pageTextStyle: { color: token.colorTextTertiary },
        pageIconSize: 10,
        pageIconColor: token.colorTextTertiary,
        pageIconInactiveColor: token.colorTextDisabled,
        data: data.map((item) => item.name),
        show: data.length > 0
      },
      series: [
        {
          type: 'pie',
          radius: ['54%', '78%'],
          center: [CENTER_X, '50%'],
          avoidLabelOverlap: true,
          // No on-arc label — the percentage lives in the tooltip instead, so
          // hovering shows value + percent in one place.
          label: { show: false },
          emphasis: {
            label: {
              show: false
            },
            scale: true
          },
          labelLine: { show: false },
          data
        }
      ]
    }),
    [colors, data, token]
  );

  if (!data.length) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {loading ? (
          <Spin size="middle" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
  }

  const displayTotal = total ?? data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div ref={measureRef} style={{ width, height, position: 'relative' }}>
      <Chart
        ref={chartRef as any}
        options={options as any}
        height={height}
        width={measuredWidth || width}
      />
      <div
        style={{
          position: 'absolute',
          left: CENTER_X,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center'
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: token.colorText,
            lineHeight: 1.2
          }}
        >
          {formatLargeNumber(displayTotal)}
        </span>
        {totalLabel && (
          <span
            style={{
              fontSize: 12,
              color: token.colorTextTertiary,
              marginTop: 4
            }}
          >
            {totalLabel}
          </span>
        )}
      </div>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--ant-color-bg-container)',
            opacity: 0.6,
            pointerEvents: 'none'
          }}
        >
          <Spin size="middle" />
        </div>
      )}
    </div>
  );
};

export default PieChart;
