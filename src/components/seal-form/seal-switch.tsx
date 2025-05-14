import { Form, Switch, type SwitchProps } from 'antd';
import React from 'react';
import styled from 'styled-components';
import LabelInfo from './components/label-info';
import Wrapper from './wrapper';

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-inline: 14px;
  .ant-switch {
    margin-top: 0 !important;
  }
`;

interface SealSwitchProps extends SwitchProps {
  required?: boolean;
  label?: React.ReactNode;
  labelWidth?: number | string;
  description?: string;
  isInFormItems?: boolean;
  checkStatus?: 'success' | 'error' | 'warning' | '';
}

const SealSlider: React.FC<SealSwitchProps> = (props) => {
  const {
    label,
    value,
    required,
    description,
    isInFormItems = true,
    defaultValue,
    checkStatus,
    labelWidth,
    ...rest
  } = props;

  let status = '';
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = statusData?.status || '';
  }

  const handleChange = (value: boolean, event: any) => {
    props.onChange?.(value, event);
  };

  return (
    <Wrapper
      required={required}
      status={checkStatus || status}
      className="no-focus"
    >
      <Inner>
        <LabelInfo label={label} description={description}></LabelInfo>
        <Switch
          {...rest}
          size="small"
          defaultValue={defaultValue}
          style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
          value={value}
          onChange={handleChange}
        ></Switch>
      </Inner>
    </Wrapper>
  );
};

export default SealSlider;
