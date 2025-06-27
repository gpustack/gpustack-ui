import type { LegendComponentOption } from 'echarts/components';
export interface ChartProps {
  seriesData: any[];
  showEmpty?: boolean;
  xAxisData: string[];
  legendData?: LegendComponentOption['data'];
  labelFormatter?: (val?: any, index?: number) => string;
  tooltipValueFormatter?: (val: any) => string;
  height: string | number;
  width?: string | number;
  title?: string;
  value?: number;
  smooth?: boolean;
  color?: string;
  yAxisName?: string;
}

export interface AreaChartItemProps {
  name: string;
  color: string;
  areaStyle: any;
  data: { time: string; value: number }[];
}
