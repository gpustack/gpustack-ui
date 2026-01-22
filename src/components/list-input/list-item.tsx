import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import HintInput from './hint-input';
import './styles/list-item.less';

interface LabelItemProps {
  onRemove: () => void;
  onChange: (value: string) => void;
  onBlur?: (e: any) => void;
  renderItem?: (
    data: any,
    props: {
      onChange: (value: string) => void;
      onBlur?: (e: any) => void;
    }
  ) => React.ReactNode;
  value: string;
  label?: string;
  placeholder?: string;
  options?: Global.HintOptions[];
  trim?: boolean;
  data?: any;
  required?: boolean;
}

const ListItem: React.FC<LabelItemProps> = (props) => {
  const {
    onRemove,
    onChange,
    onBlur,
    label,
    value,
    options,
    trim = true,
    data,
    required,
    renderItem
  } = props;

  const handleOnChange = (value: any) => {
    onChange(value);
  };

  return (
    <div className="list-item">
      {renderItem ? (
        renderItem(data, {
          onChange: handleOnChange,
          onBlur
        })
      ) : (
        <HintInput
          value={value}
          onChange={handleOnChange}
          onBlur={onBlur}
          label={label}
          sourceOptions={options}
          trim={trim}
          placeholder={props.placeholder}
        />
      )}
      {!required && (
        <Button
          size="small"
          className="btn"
          type="default"
          shape="circle"
          icon={<MinusOutlined />}
          onClick={onRemove}
        />
      )}
    </div>
  );
};

export default ListItem;
