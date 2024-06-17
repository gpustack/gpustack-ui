import { Gauge } from '@ant-design/plots';
import React from 'react';

interface GaugeChartProps {
  target: number;
  total: number;
  width?: number;
  height?: number;
  title?: string;
  thresholds: number[];
  rangColor: string[];
}

const GaugeChart: React.FC<GaugeChartProps> = (props) => {
  const { target, total, width, height, thresholds, rangColor, title } = props;
  const config = {
    width,
    height,
    autoFit: true,
    data: {
      target,
      total,
      name: 'score',
      thresholds
    },
    legend: false,
    scale: {
      color: {
        range: rangColor
      }
    },
    title: {
      titleFontSize: 14,
      style: {
        align: 'center'
      }
    },
    style: {
      textContent: (target: number, total: number) => {
        return `${(target / total) * 100}%`;
      }
    }
  };
  return <Gauge {...config} />;
};

export default GaugeChart;
