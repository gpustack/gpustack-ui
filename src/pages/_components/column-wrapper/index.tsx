import useOverlayScroller from '@/hooks/use-overlay-scroller';
import React from 'react';
import './style.less';
import { WrapperContext } from './use-wrapper-context';

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

  React.useLayoutEffect(() => {
    if (!scroller.current || !footerRef.current || !contentRef.current) return;

    const updatePadding = () => {
      const height = footerRef.current!.getBoundingClientRect().height;
      contentRef.current!.style.paddingBottom = `${height - 22}px`;
    };

    updatePadding();

    const observer = new ResizeObserver(updatePadding);
    observer.observe(footerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <WrapperContext.Provider
      value={{
        scroller: scroller,
        osInstance: instance,
        scrollEventElement,
        getScrollElementScrollableHeight,
        scrollToBottom,
        scrollToTarget
      }}
    >
      <div
        className="column-wrapper-footer"
        style={{ height: maxHeight || '100%', ...styles.wrapper }}
      >
        <div
          className="column-wrapper"
          ref={scroller}
          style={{ padding: '16px 24px', ...styles.container }}
        >
          <div ref={contentRef}>{children}</div>
        </div>
        {footer && (
          <div className="footer" ref={footerRef}>
            {footer}
          </div>
        )}
      </div>
    </WrapperContext.Provider>
  );
};

export default ColumnWrapper;
