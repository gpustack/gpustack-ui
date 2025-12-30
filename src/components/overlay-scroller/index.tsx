import useOverlayScroller, {
  OverlayScrollerOptions
} from '@/hooks/use-overlay-scroller';
import { Tooltip, TooltipProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div<{ $maxHeight?: number }>`
  max-height: ${({ $maxHeight }) =>
    typeof $maxHeight === 'number' ? `${$maxHeight}px` : $maxHeight};
  overflow-y: auto;
  width: 100%;
`;

// export OverlayScrollerOptions
export type { OverlayScrollerOptions };

export const OverlayScroller: React.FC<
  OverlayScrollerOptions & {
    maxHeight?: number;
    style?: React.CSSProperties;
    children: React.ReactNode;
    onScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  }
> = ({ children, maxHeight, scrollbars, oppositeTheme, style, onScroll }) => {
  const scroller = React.useRef<any>(null);
  const { initialize } = useOverlayScroller({
    options: {
      scrollbars,
      oppositeTheme
    }
  });

  React.useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, []);

  return (
    <Wrapper
      ref={scroller}
      data-overlayscrollbars-initialize
      className="overlay-scroller-wrapper"
      $maxHeight={maxHeight || 200}
      hidden={false}
      onWheel={onScroll}
      style={{
        paddingInlineStart: 8,
        paddingInlineEnd: 8,
        ...style
      }}
    >
      {children}
    </Wrapper>
  );
};

/**
 *
 * @param maxHeight: use for scrollbars
 * @param theme: because this component is used for tooltip, so the default theme always is light
 * @returns
 */
export const TooltipOverlayScroller: React.FC<
  OverlayScrollerOptions & {
    maxHeight?: number;
    title?: React.ReactNode;
    children: React.ReactNode;
    toolTipProps?: TooltipProps;
  }
> = ({
  children,
  maxHeight,
  title,
  toolTipProps,
  scrollbars,
  oppositeTheme
}) => {
  const { styles, ...rest } = toolTipProps || {};
  return (
    <Tooltip
      styles={{
        ...styles,
        container: {
          paddingInline: 0,
          ...styles?.container
        }
      }}
      title={
        title && (
          <OverlayScroller
            scrollbars={{ ...scrollbars, theme: 'os-theme-light' }}
            maxHeight={maxHeight}
            oppositeTheme={oppositeTheme}
          >
            {title}
          </OverlayScroller>
        )
      }
      {...rest}
    >
      {children}
    </Tooltip>
  );
};

export default OverlayScroller;
