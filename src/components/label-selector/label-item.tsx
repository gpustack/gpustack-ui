import SealInput from '@/components/seal-form/seal-input';
import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import './styles/label-item.less';

interface LabelItemProps {
  label: {
    key: string;
    value: string;
  };
  labelKey?: string;
  labelValue?: string;
  keyAddon?: React.ReactNode;
  valueAddon?: React.ReactNode;
  seperator?: string;
  onDelete?: () => void;
  onChange?: (params: { key: string; value: string }) => void;
}
const LabelItem: React.FC<LabelItemProps> = ({
  label,
  seperator,
  keyAddon,
  valueAddon,
  onChange,
  onDelete
}) => {
  const handleOnValueChange = (e: any) => {
    const value = e.target.value;
    onChange?.({
      key: label.key,
      value: value
    });
  };

  const handleOnKeyChange = (e: any) => {
    const key = e.target.value;
    onChange?.({
      key: key,
      value: label.value
    });
  };

  return (
    <div className="label-item">
      <div className="label-key">
        {keyAddon ?? (
          <SealInput.Input
            label="Key"
            value={label.key}
            onChange={handleOnKeyChange}
          ></SealInput.Input>
        )}
      </div>
      {seperator && <span className="seprator">{seperator}</span>}
      <div className="label-value">
        {valueAddon ?? (
          <SealInput.Input
            label="Value"
            value={label.value}
            onChange={handleOnValueChange}
          ></SealInput.Input>
        )}
      </div>
      <Button
        size="small"
        className="btn"
        type="default"
        shape="circle"
        onClick={onDelete}
      >
        <MinusOutlined />
      </Button>
    </div>
  );
};

export default LabelItem;
