import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { Tooltip, TooltipProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div<{ $maxHeight?: number }>`
  max-height: ${({ $maxHeight }) =>
    typeof $maxHeight === 'number' ? `${$maxHeight}px` : $maxHeight};
  overflow-y: auto;
  width: 100%;
`;

const OverlayScroller: React.FC<any> = ({
  children,
  maxHeight,
  theme,
  style
}) => {
  const scroller = React.useRef<any>(null);
  const { initialize } = useOverlayScroller({
    options: {
      theme: theme || 'os-theme-light'
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
      className="overlay-scroller-wrapper"
      $maxHeight={maxHeight || 200}
      hidden={false}
      as="div"
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

export const TooltipOverlayScroller: React.FC<
  TooltipProps & { maxHeight?: number }
> = ({ children, maxHeight, title, ...rest }) => {
  return (
    <Tooltip
      overlayInnerStyle={{
        width: 'max-content',
        maxWidth: 300,
        paddingInlineEnd: 0
      }}
      title={
        title && (
          <OverlayScroller
            style={{ paddingInlineStart: 0 }}
            maxHeight={maxHeight}
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
