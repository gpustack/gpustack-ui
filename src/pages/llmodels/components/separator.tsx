import { Divider } from 'antd';
import React from 'react';
import '../style/separator.less';

const Separator: React.FC<{
  showArrow?: boolean;
  styles?: {
    arrow?: React.CSSProperties;
  };
}> = ({ showArrow = true, styles }) => {
  return (
    <div className="separator">
      <Divider
        orientation="vertical"
        style={{ height: 'calc(100vh - 89px)', marginInline: '0px' }}
      ></Divider>
      {showArrow && (
        <span className="shape" style={{ ...styles?.arrow }}></span>
      )}
    </div>
  );
};

export default Separator;
