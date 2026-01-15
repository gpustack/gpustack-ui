import LabelInfo from '@/components/seal-form/components/label-info';
import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

interface WrapperProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
  btnText?: string;
  disabled?: boolean;
  onAdd?: () => void;
  button?: React.ReactNode;
}

const Container = styled.div`
  position: relative;
  padding: 14px;
  padding-top: 34px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--border-radius-base);
  display: flex;
  width: 100%;
  flex-direction: column;
  .label {
    position: absolute;
    left: 16px;
    line-height: 1;
    top: 12px;
    color: var(--ant-color-text-tertiary);
  }
`;

const ButtonWrapper = styled.div`
  margin-top: 8px;
`;

const Wrapper: React.FC<WrapperProps> = ({
  children,
  label,
  description,
  labelExtra,
  onAdd,
  btnText,
  disabled,
  button
}) => {
  const intl = useIntl();
  return (
    <Container>
      {label && (
        <span className="label">
          <LabelInfo
            label={label}
            description={description}
            labelExtra={labelExtra}
          ></LabelInfo>
        </span>
      )}
      {children}
      {!disabled && (
        <ButtonWrapper>
          {button || (
            <Button variant="filled" color="default" block onClick={onAdd}>
              <PlusOutlined className="font-size-14" />
              {btnText ||
                intl.formatMessage({
                  id: 'common.button.addSelector'
                })}
            </Button>
          )}
        </ButtonWrapper>
      )}
    </Container>
  );
};

export default Wrapper;
