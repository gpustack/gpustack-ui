import useOverlayScroller from '@/hooks/use-overlay-scroller';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import '../style/column-wrapper.less';

const ColumnWrapper: React.FC<any> = ({
  children,
  footer,
  maxHeight,
  paddingBottom = 50
}) => {
  const scroller = React.useRef<any>(null);
  const { initialize } = useOverlayScroller();

  React.useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, []);

  return (
    <>
      {footer ? (
        <div className="column-wrapper-footer">
          <div className="column-wrapper" ref={scroller} style={{ maxHeight }}>
            <div
              style={{
                paddingBottom: paddingBottom
              }}
            >
              {children}
            </div>
          </div>
          {<div className="footer">{footer}</div>}
        </div>
      ) : (
        <div className="column-wrapper" ref={scroller} style={{ maxHeight }}>
          <div>{children}</div>
        </div>
      )}
    </>
  );
};

export default ColumnWrapper;
