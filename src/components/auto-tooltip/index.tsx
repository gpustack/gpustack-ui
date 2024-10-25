import { Tag, Tooltip, type TagProps } from 'antd';
import { throttle } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import TitleTip from './title-tip';

// type TagProps = React.ComponentProps<typeof Tag>;

interface AutoTooltipProps extends Omit<TagProps, 'title'> {
  children: React.ReactNode;
  maxWidth?: number | string;
  minWidth?: number | string;
  color?: string;
  style?: React.CSSProperties;
  ghost?: boolean;
  title?: React.ReactNode;
  showTitle?: boolean;
  tooltipProps?: React.ComponentProps<typeof Tooltip>;
}

const AutoTooltip: React.FC<AutoTooltipProps> = ({
  children,
  maxWidth = '100%',
  minWidth,
  ghost = false,
  title,
  showTitle = false,
  tooltipProps,
  ...tagProps
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const resizeObserver = useRef<ResizeObserver>();

  const checkOverflow = useCallback(() => {
    if (contentRef.current) {
      const { scrollWidth, clientWidth } = contentRef.current;
      setIsOverflowing(scrollWidth > clientWidth);
    }
  }, [contentRef.current]);

  useEffect(() => {
    const debouncedCheckOverflow = throttle(checkOverflow, 200);
    window.addEventListener('resize', debouncedCheckOverflow);
    return () => {
      window.removeEventListener('resize', debouncedCheckOverflow);
      debouncedCheckOverflow.cancel();
    };
  }, [checkOverflow]);

  useEffect(() => {
    checkOverflow();
  }, [children, checkOverflow]);

  const tagStyle = useMemo(
    () => ({
      maxWidth,
      minWidth,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      ...tagProps.style
    }),
    [maxWidth, tagProps.style]
  );

  return (
    <Tooltip
      overlayInnerStyle={{ paddingInline: 0 }}
      destroyTooltipOnHide={false}
      title={
        <TitleTip
          isOverflowing={isOverflowing}
          title={title}
          showTitle={showTitle}
        >
          {children}
        </TitleTip>
      }
      {...tooltipProps}
    >
      {ghost ? (
        <div ref={contentRef} style={tagStyle}>
          {children}
        </div>
      ) : (
        <Tag {...tagProps} ref={contentRef} style={tagStyle}>
          {children}
        </Tag>
      )}
    </Tooltip>
  );
};

export default React.memo(AutoTooltip);
