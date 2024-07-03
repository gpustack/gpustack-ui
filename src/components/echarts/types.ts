export interface ChartProps {
  seriesData: any[];
  xAxisData: string[];
  legendData?: string[];
  labelFormatter?: (val?: any) => string;
  height: string | number;
  width?: string | number;
  title?: string;
  smooth?: boolean;
}

export interface AreaChartItemProps {
  name: string;
  color: string;
  areaStyle: any;
  data: { time: string; value: number }[];
}
