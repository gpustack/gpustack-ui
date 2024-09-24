import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import '../style/column-wrapper.less';

const ColumnWrapper: React.FC<any> = ({ children, footer, height }) => {
  if (footer) {
    return (
      <div className="column-wrapper-footer">
        <div className="column-wrapper">
          <SimpleBar
            style={{
              maxHeight: height || 'calc(100vh - 89px)',
              paddingBottom: '50px'
            }}
          >
            {children}
          </SimpleBar>
        </div>
        {<div className="footer">{footer}</div>}
      </div>
    );
  }
  return (
    <div className="column-wrapper">
      <SimpleBar style={{ maxHeight: height || 'calc(100vh - 89px)' }}>
        {children}
      </SimpleBar>
    </div>
  );
};

export default ColumnWrapper;
