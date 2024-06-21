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
    box: {
      padding: [0, 0, 0, 0],
      style: {
        padding: [0, 0, 0, 0]
      }
    },
    guide: {
      arc: {
        style: {
          lineWidth: 30
        }
      }
    },
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
    startAngle: Math.PI,
    endAngle: 0,
    title: {
      title,
      size: 0,
      titleFontSize: 14,
      style: {
        align: 'center'
      }
    },
    style: {
      arcShape: 'round',
      textContent: (target: number, total: number) => {
        return `${(target / total) * 100}%`;
      }
    }
  };
  return <Gauge {...config} />;
};

export default GaugeChart;
