import { Col, Row } from 'antd';
import React from 'react';
import '../style/deploy-dropdown.less';

interface DeployDropdownProps {
  items: { label: string; value: string; key: string; icon: React.ReactNode }[];
  onSelect: (item: {
    label: string;
    value: string;
    key: string;
    icon: React.ReactNode;
  }) => void;
}

const DeployDropdown: React.FC<DeployDropdownProps> = ({ items, onSelect }) => {
  return (
    <div className="deploy-dropdown">
      <Row gutter={[0, 16]}>
        {items.map((item) => (
          <Col span={8} key={item.key}>
            <div key={item.key} onClick={() => onSelect(item)} className="item">
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DeployDropdown;
