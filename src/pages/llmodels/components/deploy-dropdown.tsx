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
      {items.map((item) => (
        <div key={item.key} onClick={() => onSelect(item)} className="item">
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default DeployDropdown;
