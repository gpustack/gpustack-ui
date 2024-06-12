import { Progress } from 'antd';
import { memo, useMemo } from 'react';

const RenderProgress = memo((props: { percent: number }) => {
  const { percent } = props;
  console.log('percent====', percent);
  const strokeColor = useMemo(() => {
    if (percent <= 50) {
      return 'var(--ant-color-primary)';
    }
    if (percent <= 80) {
      return 'var(--ant-color-warning)';
    }
    return 'var(--ant-color-error)';
  }, [percent]);
  return (
    <Progress
      steps={10}
      format={() => {
        return (
          <span style={{ color: 'var(--ant-color-text)' }}>{percent}%</span>
        );
      }}
      percent={percent}
      strokeColor={strokeColor}
    />
  );
});

export default RenderProgress;
