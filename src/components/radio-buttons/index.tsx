import { Space } from 'antd';
import classNames from 'classnames';
import React from 'react';
import './index.less';

interface RadioButtonsProps {
  options: { value: any; label: React.ReactNode }[];
  value: string;
  gap?: number;
  onChange: (value: string) => void;
}
const RadioButtons: React.FC<RadioButtonsProps> = (props) => {
  const { options, value, onChange, gap = 12 } = props;
  return (
    <Space className="radio-button-wrap" size={gap}>
      {options.map((option) => (
        <span
          key={option.value}
          onClick={() => onChange({ target: { value: option.value } } as any)}
          className={classNames('item', { active: value === option.value })}
        >
          {option.label}
        </span>
      ))}
    </Space>
  );
};

export default RadioButtons;
