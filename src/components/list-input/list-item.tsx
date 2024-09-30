// import AutoComplete from '@/components/seal-form/auto-complete';
import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import HintInput from './hint-input';
import './styles/list-item.less';

interface LabelItemProps {
  onRemove: () => void;
  onChange: (value: string) => void;
  value: string;
  label?: string;
  placeholder?: string;
  options?: Global.HintOptions[];
}

const ListItem: React.FC<LabelItemProps> = (props) => {
  const { onRemove, onChange, label, value, options } = props;

  const handleOnChange = (value: any) => {
    onChange(value);
  };

  return (
    <div className="list-item">
      <HintInput
        value={value}
        onChange={handleOnChange}
        label={label}
        sourceOptions={options}
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

export default React.memo(ListItem);
