import classNames from 'classnames';
import React from 'react';
import './styles/option.less';

interface DropdownOptionProps {
  children?: React.ReactNode;
  selected?: boolean;
  label?: React.ReactNode;
  onClick?: () => void;
}

const DropdownOption: React.FC<DropdownOptionProps> = (props) => {
  const { children, selected, label, onClick } = props;
  return (
    <div
      className={classNames(
        'dropdown-option ant-select-item ant-select-item-option',
        { 'dropdown-option-selected': selected }
      )}
      onClick={onClick}
    >
      {children ?? label}
    </div>
  );
};

export default DropdownOption;
