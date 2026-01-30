import { Divider } from 'antd';
import React from 'react';
import '../style/separator.less';

const Separator: React.FC<{ showArrow?: boolean }> = ({ showArrow = true }) => {
  return (
    <div className="separator">
      <Divider
        orientation="vertical"
        style={{ height: 'calc(100vh - 89px)', marginInline: '0px' }}
      ></Divider>
      {showArrow && <span className="shape"></span>}
    </div>
  );
};

export default Separator;
