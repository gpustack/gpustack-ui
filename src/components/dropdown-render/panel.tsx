import React from 'react';
import './styles/panel.less';

interface DropdownPanelProps {
  children: React.ReactNode;
}

const DropdownPanel: React.FC<DropdownPanelProps> = (props) => {
  const { children } = props;

  return <div className="dropdown-panel">{children}</div>;
};

export default DropdownPanel;
