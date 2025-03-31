import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';

type ModalFooterProps = {
  onOk?: () => void;
  onCancel: () => void;
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
};
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
  extra,
  form
}) => {
  const intl = useIntl();
  return (
    <Space size={20} style={{ ...style }}>
      <Button onClick={onCancel} style={{ width: '88px' }} {...cancelBtnProps}>
        {cancelText || intl.formatMessage({ id: 'common.button.cancel' })}
      </Button>
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
  );
};

export default ModalFooter;
