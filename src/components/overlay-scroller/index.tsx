import useOverlayScroller from '@/hooks/use-overlay-scroller';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div<{ $maxHeight?: number }>`
  max-height: ${({ $maxHeight }) =>
    typeof $maxHeight === 'number' ? `${$maxHeight}px` : $maxHeight};
  overflow-y: auto;
  width: 100%;
  padding-inline: 10px;
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
      $maxHeight={maxHeight || '100%'}
      hidden={false}
      as="div"
      style={{
        ...style
      }}
    >
      {children}
    </Wrapper>
  );
};

export default OverlayScroller;
