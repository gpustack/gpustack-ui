import { Progress, Tooltip } from 'antd';
import React, { memo, useEffect, useMemo } from 'react';

const RenderProgress = memo(
  (props: {
    defaultOpen?: boolean;
    percent: number;
    steps?: number;
    download?: boolean;
    label?: React.ReactNode;
    successPercent?: number;
    successColor?: string;
  }) => {
    const { defaultOpen, percent, download, label, successPercent } = props;
    const [open, setOpen] = React.useState(false);

    const strokeColor = useMemo(() => {
      if (download) {
        return 'var(--ant-color-primary)';
      }

      if (percent <= 50) {
        return 'var(--ant-color-success)';
      }
      if (percent <= 80) {
        return 'var(--ant-color-warning)';
      }
      return 'var(--ant-color-error)';
    }, [percent]);

    useEffect(() => {
      setOpen(defaultOpen || false);
    }, [defaultOpen]);

    const renderProgress = useMemo(() => {
      return (
        <Progress
          percentPosition={{ align: 'center', type: 'inner' }}
          size={['', 16]}
          format={() => {
            return (
              <span
                style={{
                  color: 'var(--color-progress-text)'
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
          <Tooltip
            title={label}
            open={open}
            onOpenChange={setOpen}
            overlayInnerStyle={{ paddingInline: 12 }}
          >
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
