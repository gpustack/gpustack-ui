import { Tag, Tooltip } from 'antd';
import debounce from 'lodash/debounce';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

interface AutoTooltipProps extends React.ComponentProps<typeof Tag> {
  children: React.ReactNode;
  maxWidth?: number | string;
  color?: string;
  style?: React.CSSProperties;
  ghost?: boolean;
  showTitle?: boolean;
}

const AutoTooltip: React.FC<AutoTooltipProps> = ({
  children,
  maxWidth = '100%',
  ghost = false,
  showTitle = false,
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
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      ...tagProps.style
    }),
    [maxWidth, tagProps.style]
  );

  return (
    <Tooltip title={isOverflowing || showTitle ? children : ''}>
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
