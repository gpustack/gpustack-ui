import { CloseOutlined } from '@ant-design/icons';
import { Tag, Tooltip, type TagProps } from 'antd';
import { throttle } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { TooltipOverlayScroller } from '../overlay-scroller';

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
  closable?: boolean;
  radius?: number | string;
  filled?: boolean;
  tooltipProps?: React.ComponentProps<typeof Tooltip>;
}

const StyledTag = styled(Tag)`
  margin: 0;
  &.tag-filled {
    border: none;
    background-color: var(--ant-color-fill-secondary);
  }
`;

const AutoTooltip: React.FC<AutoTooltipProps> = ({
  children,
  maxWidth = '100%',
  minWidth,
  ghost = false,
  title,
  showTitle = false,
  tooltipProps,
  radius = 12,
  filled = false,
  ...tagProps
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const checkOverflow = useCallback(() => {
    if (contentRef.current) {
      const { scrollWidth, clientWidth } = contentRef.current;
      setIsOverflowing(scrollWidth > clientWidth);
    }
  }, [contentRef.current]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    resizeObserver.current?.disconnect();
    resizeObserver.current = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.current?.observe(element);

    // Initial check
    checkOverflow();

    return () => {
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
    };
  }, [checkOverflow]);

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
    <TooltipOverlayScroller
      toolTipProps={{
        ...tooltipProps,
        destroyOnHidden: false
      }}
      title={isOverflowing || showTitle ? title || children : false}
    >
      {ghost ? (
        <div ref={contentRef} style={tagStyle} data-overflow={isOverflowing}>
          {children}
        </div>
      ) : (
        <StyledTag
          {...tagProps}
          variant="outlined"
          className={`${tagProps.className || ''} ${filled ? 'tag-filled' : ''}`}
          ref={contentRef}
          style={{
            paddingInline: tagProps.closable ? '8px 22px' : 8,
            borderRadius: radius,
            ...tagStyle
          }}
          closeIcon={
            tagProps.closable ? (
              <CloseOutlined
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
            ) : (
              false
            )
          }
        >
          {children}
        </StyledTag>
      )}
    </TooltipOverlayScroller>
  );
};

export default AutoTooltip;
