export interface ChartProps {
  seriesData: any[];
  xAxisData: string[];
  legendData?: string[];
  labelFormatter?: (val?: any) => string;
  height: string | number;
  width?: string | number;
  title?: string;
  value?: number;
  smooth?: boolean;
  color?: string;
}

export interface AreaChartItemProps {
  name: string;
  color: string;
  areaStyle: any;
  data: { time: string; value: number }[];
}
