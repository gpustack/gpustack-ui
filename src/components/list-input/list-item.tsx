import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import HintInput from './hint-input';
import './styles/list-item.less';

interface LabelItemProps {
  onRemove: () => void;
  onChange: (value: string) => void;
  onBlur?: (e: any) => void;
  value: string;
  label?: string;
  placeholder?: string;
  options?: Global.HintOptions[];
  trim?: boolean;
}

const ListItem: React.FC<LabelItemProps> = (props) => {
  const {
    onRemove,
    onChange,
    onBlur,
    label,
    value,
    options,
    trim = true
  } = props;

  const handleOnChange = (value: any) => {
    onChange(value);
  };

  return (
    <div className="list-item">
      <HintInput
        value={value}
        onChange={handleOnChange}
        onBlur={onBlur}
        label={label}
        sourceOptions={options}
        trim={trim}
        placeholder={props.placeholder}
      />
      <Button
        size="small"
        className="btn"
        type="default"
        shape="circle"
        icon={<MinusOutlined />}
        onClick={onRemove}
      />
    </div>
  );
};

export default ListItem;
