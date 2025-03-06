import { Progress, Tooltip } from 'antd';
import { memo, useMemo } from 'react';

const RenderProgress = memo(
  (props: {
    open?: boolean;
    percent: number;
    steps?: number;
    download?: boolean;
    label?: React.ReactNode;
    successPercent?: number;
    successColor?: string;
  }) => {
    const {
      open,
      percent,
      steps = 5,
      download,
      label,
      successPercent,
      successColor
    } = props;

    const strokeColor = useMemo(() => {
      if (download) {
        return 'var(--ant-color-primary)';
      }

      if (percent <= 50) {
        return 'var(--color-progress-green)';
      }
      if (percent <= 80) {
        return 'var(--ant-color-warning)';
      }
      return 'var(--ant-color-error)';
    }, [percent]);

    const renderProgress = useMemo(() => {
      return (
        <Progress
          percentPosition={{ align: 'center', type: 'inner' }}
          size={[undefined, 16]}
          format={() => {
            return (
              <span
                style={{
                  color: '#fff'
                }}
              >
                {percent}%
              </span>
            );
          }}
          percent={percent}
          success={{
            percent: successPercent,
            strokeColor: 'var(--ant-geekblue-3)'
          }}
          strokeColor={strokeColor}
        ></Progress>
      );
    }, [percent, successPercent, strokeColor]);

    return (
      <>
        {label ? (
          <Tooltip title={label} open={open}>
            {renderProgress}
          </Tooltip>
        ) : (
          renderProgress
        )}
      </>
    );
  }
);

export default RenderProgress;
