import useOverlayScroller from '@/hooks/use-overlay-scroller';
import React from 'react';
import './style.less';

const ColumnWrapper: React.FC<any> = ({
  children,
  footer,
  maxHeight,
  paddingBottom = 50
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
        style={{ height: maxHeight || '100%' }}
      >
        <div
          className="column-wrapper"
          ref={scroller}
          style={{ padding: '16px 24px' }}
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
