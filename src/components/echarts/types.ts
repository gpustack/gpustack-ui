import type {
  LegendComponentOption,
  TitleComponentOption
} from 'echarts/components';
export interface ChartProps {
  seriesData: any[];
  showEmpty?: boolean;
  showArea?: boolean;
  xAxisData: string[];
  legendData?: LegendComponentOption['data'];
  legendOptions?: {
    [K in keyof LegendComponentOption]?: LegendComponentOption[K];
  };
  gridOptions?: {
    left?: string | number;
    right?: string | number;
    top?: string | number;
    bottom?: string | number;
  };
  labelFormatter?: (val?: any, index?: number) => string;
  tooltipValueFormatter?: (val: any) => string;
  height: string | number;
  width?: string | number;
  title?: string | TitleComponentOption;
  titleOptions?: {
    [K in keyof TitleComponentOption]?: TitleComponentOption[K];
  };
  value?: number;
  smooth?: boolean;
  color?: string;
  yAxisName?: string;
  gaugeConfig?: {
    radius?: string;
    center?: string[];
    startAngle?: number;
    endAngle?: number;
  };
}

export interface AreaChartItemProps {
  name: string;
  color: string;
  areaStyle: any;
  data: { time: string; value: number }[];
}
