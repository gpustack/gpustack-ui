import { QuestionCircleOutlined } from '@ant-design/icons';
import { Checkbox, CheckboxProps, Tooltip } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import React from 'react';

const CheckboxField: React.FC<
  {
    description?: React.ReactNode;
    label: React.ReactNode;
    checked?: boolean;
    onChange?: (e: CheckboxChangeEvent) => void;
  } & CheckboxProps
> = ({ description, label, checked, onChange, ...rest }) => {
  return (
    <Checkbox className="p-l-6" checked={checked} onChange={onChange} {...rest}>
      <Tooltip title={description || false}>
        <span style={{ color: 'var(--ant-color-text-tertiary)' }}>{label}</span>
        {!!description && (
          <QuestionCircleOutlined
            className="m-l-4"
            style={{ color: 'var(--ant-color-text-tertiary)' }}
          />
        )}
      </Tooltip>
    </Checkbox>
  );
};

export default CheckboxField;
