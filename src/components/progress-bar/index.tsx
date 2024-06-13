import { Progress } from 'antd';
import { memo, useMemo } from 'react';

const RenderProgress = memo(
  (props: { percent: number; steps?: number; download?: boolean }) => {
    const { percent, steps = 5, download } = props;

    const strokeColor = useMemo(() => {
      if (download) {
        return 'var(--ant-color-primary)';
      }
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
        steps={steps}
        format={() => {
          return (
            <span style={{ color: 'var(--ant-color-text)' }}>{percent}%</span>
          );
        }}
        percent={percent}
        strokeColor={strokeColor}
      />
    );
  }
);

export default RenderProgress;
