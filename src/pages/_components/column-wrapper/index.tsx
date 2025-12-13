import useOverlayScroller from '@/hooks/use-overlay-scroller';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { WrapperContext } from './use-wrapper-context';

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  width: 100%;
`;

const ContentWrapper = styled.div`
  flex: 1;
  position: relative;
  overflow-y: auto;
`;

const Footer = styled.div`
  padding-block: 0;
  background-color: var(--ant-color-bg-elevated);
`;

interface ColumnWrapperProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string | number;
  paddingBottom?: number;
  styles?: {
    wrapper?: React.CSSProperties;
    container?: React.CSSProperties;
  };
}

const ColumnWrapper: React.FC<ColumnWrapperProps> = ({
  children,
  footer,
  maxHeight,
  styles = {}
}) => {
  const scroller = React.useRef<any>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const {
    initialize,
    instance,
    scrollEventElement,
    scrollToBottom,
    scrollToTarget,
    getScrollElementScrollableHeight
  } = useOverlayScroller({
    options: {
      scrollbars: {
        autoHide: 'move'
      }
    }
  });

  React.useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, []);

  const setContentPaddingBottom = useCallback((padding: number) => {
    contentRef.current!.style.paddingBottom = `${padding}px`;
  }, []);

  return (
    <WrapperContext.Provider
      value={{
        scroller: scroller,
        osInstance: instance,
        scrollEventElement,
        getScrollElementScrollableHeight,
        scrollToBottom,
        scrollToTarget,
        setSScrollContentPaddingBottom: setContentPaddingBottom
      }}
    >
      <Wrapper style={{ height: maxHeight || '100%', ...styles.wrapper }}>
        <ContentWrapper
          ref={scroller}
          style={{
            padding: '16px 24px',
            ...styles.container
          }}
        >
          <div ref={contentRef}>{children}</div>
        </ContentWrapper>
        {footer && <Footer ref={footerRef}>{footer}</Footer>}
      </Wrapper>
    </WrapperContext.Provider>
  );
};

export default ColumnWrapper;
