import React from 'react';
import '../style/title-wrapper.less';

const TitleWrapper: React.FC<any> = ({ children }) => {
  return (
    <h3 className="h3" style={{ height: 50 }}>
      {children}
    </h3>
  );
};

export default TitleWrapper;
