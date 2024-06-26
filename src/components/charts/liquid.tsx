import { Liquid } from '@ant-design/plots';
import { useEffect, useState } from 'react';

interface LiquidChartProps {
  percent: number;
  color?: string;
  title?: string;
  height?: number;
  width?: number;
  thresholds?: number[];
  rangColor?: string[];
}
const LiquidChart: React.FC<LiquidChartProps> = (props) => {
  const {
    percent = 0,
    color,
    title,
    width,
    height,
    thresholds = [],
    rangColor = []
  } = props;

  const primaryColor = 'rgba(84, 204, 152,0.8)';
  const [fillColor, setFillColor] = useState<string>(primaryColor);

  const calcColorByPercent = () => {
    if (color) {
      return color;
    }
    if (!rangColor.length) {
      return primaryColor;
    }

    if (rangColor.length && thresholds.length) {
      let index = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (percent <= thresholds[i]) {
          index = i;
          break;
        }
      }
      return rangColor[index];
    }
    return primaryColor;
  };

  useEffect(() => {
    const fc = calcColorByPercent();
    setFillColor(fc);
  }, [percent]);

  const config = {
    percent,
    textAlign: 'center',
    autoFit: true,
    title: {
      title,
      size: 0,
      style: {
        align: 'center',
        titleFontSize: 12,
        titleFill: 'rgba(0,0,0,0.88)',
        titleFontWeight: 500
      }
    },

    style: {
      textAlign: 'center',
      outlineBorder: 2,
      waveLength: 128,
      stroke: fillColor,
      fill: fillColor
    }
  };
  return <Liquid {...config} />;
};

export default LiquidChart;
