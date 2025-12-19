import { Switch, Tooltip } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';
import LabelInfo from '../seal-form/components/label-info';

const SwitchContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  padding: 12px 14px;
  min-height: 54px;
`;

const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface SwitchInputProps {
  label?: React.ReactNode;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  alwaysShowChildren?: boolean;
  btnTips?: React.ReactNode;
  size?: 'small' | 'default';
}

const SwitchInput: React.FC<SwitchInputProps> = (props) => {
  const {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    children,
    style,
    alwaysShowChildren = true,
    size,
    btnTips
  } = props;
  const [internalChecked, setInternalChecked] = useState<boolean>(
    defaultChecked || false
  );

  const handleChange = (checked: boolean) => {
    setInternalChecked(checked);
    onChange?.(checked);
  };

  return (
    <SwitchContainer style={style}>
      <LabelContainer>
        <LabelInfo label={label} description={description} />
        <Tooltip title={btnTips}>
          <Switch
            size={size}
            checked={checked !== undefined ? checked : internalChecked}
            onChange={handleChange}
          />
        </Tooltip>
      </LabelContainer>
      {(alwaysShowChildren || internalChecked) && children}
    </SwitchContainer>
  );
};

export default SwitchInput;
