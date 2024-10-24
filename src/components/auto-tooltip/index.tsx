import { Tag, Tooltip, type TagProps } from 'antd';
import debounce from 'lodash/debounce';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

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

  const checkOverflow = useCallback(() => {
    if (contentRef.current) {
      const { scrollWidth, clientWidth } = contentRef.current;
      setIsOverflowing(scrollWidth > clientWidth);
    }
  }, [contentRef.current]);

  const debouncedCheckOverflow = useMemo(
    () => debounce(checkOverflow, 200),
    [checkOverflow]
  );

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', debouncedCheckOverflow);
    return () => {
      window.removeEventListener('resize', debouncedCheckOverflow);
      debouncedCheckOverflow.cancel();
    };
  }, [checkOverflow, debouncedCheckOverflow]);

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
      title={isOverflowing || showTitle ? title || children : ''}
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
