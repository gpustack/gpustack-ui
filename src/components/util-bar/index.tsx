import { Progress } from 'antd';
import './index.less';

interface UitilBarProps {
  title?: string;
  percent: number;
  steps?: number;
  gapDegree?: number;
  strokeWidth?: number;
  size?: number;
  trailColor?: string;
  strokeColor?: string;
}
const UitilBar: React.FC<UitilBarProps> = (props) => {
  const {
    percent,
    steps = 10,
    gapDegree = 170,
    strokeWidth = 10,
    title,
    size = 160,
    strokeColor,
    trailColor = 'rgba(221,221,221,.5)'
  } = props;

  const strokeColorFunc = (percent: number) => {
    if (percent <= 50) {
      return 'var(--color-chart-green)';
    }
    if (percent <= 80) {
      return 'var(--color-chart-glod)';
    }
    return 'var(--color-chart-red)';
  };
  return (
    <div className="util-bar-box">
      {title && <span className="title">{title}</span>}
      <Progress
        type="dashboard"
        steps={steps}
        gapDegree={gapDegree}
        strokeWidth={strokeWidth}
        size={size}
        percent={percent}
        trailColor={trailColor}
        strokeColor={strokeColor || strokeColorFunc(percent)}
      ></Progress>
    </div>
  );
};

export default UitilBar;
