import React from 'react';
import '../style/column-wrapper.less';

const ColumnWrapper: React.FC<any> = ({ children, footer }) => {
  if (footer) {
    return (
      <div className="column-wrapper-footer">
        <div className="column-wrapper">{children}</div>
        {<div className="footer">{footer}</div>}
      </div>
    );
  }
  return <div className="column-wrapper">{children}</div>;
};

export default ColumnWrapper;
