import useOverlayScroller from '@/hooks/use-overlay-scroller';
import React from 'react';
import './style.less';

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
  paddingBottom = 50,
  styles = {}
}) => {
  const scroller = React.useRef<any>(null);
  const { initialize } = useOverlayScroller({
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

  return (
    <>
      <div
        className="column-wrapper-footer"
        style={{ height: maxHeight || '100%', ...styles.wrapper }}
      >
        <div
          className="column-wrapper"
          ref={scroller}
          style={{ padding: '16px 24px', ...styles.container }}
        >
          <div
            style={{
              paddingBottom: footer ? paddingBottom : 0
            }}
          >
            {children}
          </div>
        </div>
        {footer && <div className="footer">{footer}</div>}
      </div>
    </>
  );
};

export default ColumnWrapper;
