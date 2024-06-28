import { Progress, Tooltip } from 'antd';
import { memo, useMemo } from 'react';

const RenderProgress = memo(
  (props: {
    percent: number;
    steps?: number;
    download?: boolean;
    label?: React.ReactNode;
  }) => {
    const { percent, steps = 5, download, label } = props;

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
      <>
        {label ? (
          <Tooltip title={label}>
            <Progress
              percentPosition={{ align: 'center', type: 'inner' }}
              size={[undefined, 12]}
              format={() => {
                return (
                  <span
                    style={{
                      color: 'var(--ant-color-text)'
                    }}
                  >
                    {percent}%
                  </span>
                );
              }}
              percent={percent}
              strokeColor={strokeColor}
            ></Progress>
          </Tooltip>
        ) : (
          <Progress
            type="line"
            percentPosition={{ align: 'center', type: 'inner' }}
            size={[undefined, 12]}
            format={() => {
              return (
                <span
                  style={{
                    color: 'var(--ant-color-text)'
                  }}
                >
                  {percent}%
                </span>
              );
            }}
            percent={percent}
            strokeColor={strokeColor}
          ></Progress>
        )}
      </>
    );
  }
);

export default RenderProgress;
