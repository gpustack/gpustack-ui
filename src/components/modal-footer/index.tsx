import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';
import styled from 'styled-components';

type ModalFooterProps = {
  onOk?: () => void;
  onCancel?: () => void;
  cancelText?: string;
  okText?: string;
  htmlType?: 'button' | 'submit';
  okBtnProps?: any;
  cancelBtnProps?: any;
  loading?: boolean;
  style?: React.CSSProperties;
  showOkBtn?: boolean;
  showCancelBtn?: boolean;
  extra?: React.ReactNode;
  form?: any;
  description?: React.ReactNode;
  styles?: {
    wrapper?: React.CSSProperties;
  };
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const ModalFooter: React.FC<ModalFooterProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText,
  okBtnProps,
  cancelBtnProps,
  loading,
  htmlType = 'button',
  style,
  showOkBtn = true,
  styles,
  description,
  extra,
  showCancelBtn = true,
  form
}) => {
  const intl = useIntl();
  return (
    <Wrapper style={{ ...styles?.wrapper }}>
      <div>{description}</div>
      <Space size={20} style={{ ...style }}>
        {showCancelBtn && (
          <Button
            onClick={onCancel}
            style={{ width: '88px' }}
            {...cancelBtnProps}
          >
            {cancelText || intl.formatMessage({ id: 'common.button.cancel' })}
          </Button>
        )}
        {extra}
        {showOkBtn && (
          <Button
            type="primary"
            onClick={onOk}
            style={{ width: '88px' }}
            loading={loading}
            htmlType={htmlType}
            {...okBtnProps}
          >
            {okText || intl.formatMessage({ id: 'common.button.save' })}
          </Button>
        )}
      </Space>
    </Wrapper>
  );
};

export default ModalFooter;
