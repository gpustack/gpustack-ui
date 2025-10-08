import { Checkbox, Form, type CheckboxProps } from 'antd';
import React from 'react';
import styled from 'styled-components';
import LabelInfo from './components/label-info';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-inline: 14px;
  cursor: pointer;
  .ant-checkbox-wrapper {
    margin-top: 0 !important;
  }
`;

interface SealCheckboxProps extends CheckboxProps, SealFormItemProps {}

const SealCheckbox: React.FC<SealCheckboxProps> = (props) => {
  const {
    label,
    checked,
    required,
    description,
    isInFormItems = true,
    defaultChecked,
    checkStatus,
    ...rest
  } = props;

  let status = '';
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = statusData?.status || '';
  }

  const handleChange = (e: any) => {
    props.onChange?.(e);
  };

  const handleContainerClick = () => {
    // Create a synthetic event to toggle the checkbox
    const syntheticEvent = {
      target: {
        checked: !checked
      }
    };
    handleChange(syntheticEvent);
  };

  return (
    <Wrapper
      required={required}
      status={checkStatus || status}
      className="no-focus"
    >
      <Inner onClick={handleContainerClick}>
        <LabelInfo label={label} description={description}></LabelInfo>
        <Checkbox
          {...rest}
          defaultChecked={defaultChecked}
          style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
          checked={checked}
          onChange={handleChange}
        />
      </Inner>
    </Wrapper>
  );
};

export default SealCheckbox;
