import { ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import { useOnlineModelStepNav } from './online-model-step-context';

export const onlineModelModalFooterStyle = {
  wrapper: {
    padding: '16px 24px 8px'
  }
};

export const onlineModelMobileConfigFooterStyle = {
  wrapper: {
    padding: '12px 16px',
    borderTop: '1px solid var(--ant-color-split)',
    background: 'var(--ant-color-bg-elevated)'
  }
};

type OnlineModelModalFooterProps = {
  onCancel: () => void;
  onOk?: () => void;
  loading?: boolean;
  showOkBtn?: boolean;
  showCancelBtn?: boolean;
  okText?: string;
  cancelText?: string;
  okBtnProps?: Record<string, unknown>;
  cancelBtnProps?: Record<string, unknown>;
  extra?: React.ReactNode;
};

const OnlineModelModalFooter: React.FC<OnlineModelModalFooterProps> = ({
  onCancel,
  onOk,
  loading,
  showOkBtn = true,
  showCancelBtn = true,
  okText,
  cancelText,
  okBtnProps,
  cancelBtnProps,
  extra
}) => {
  const intl = useIntl();
  const stepNav = useOnlineModelStepNav();
  const isMobileConfigStep =
    stepNav?.isMobileWizard && stepNav.step === 'config';

  if (isMobileConfigStep) {
    return (
      <ModalFooter
        onCancel={onCancel}
        onOk={onOk}
        loading={loading}
        showOkBtn={showOkBtn}
        showCancelBtn={false}
        okText={okText}
        description={
          <Button style={{ width: 88 }} onClick={onCancel} {...cancelBtnProps}>
            {cancelText || intl.formatMessage({ id: 'common.button.cancel' })}
          </Button>
        }
        extra={
          <>
            <Button style={{ width: 88 }} onClick={stepNav.goToDetail}>
              {intl.formatMessage({ id: 'common.button.prev' })}
            </Button>
            {extra}
          </>
        }
        okBtnProps={okBtnProps}
        styles={onlineModelMobileConfigFooterStyle}
      />
    );
  }

  return (
    <ModalFooter
      onCancel={onCancel}
      onOk={onOk}
      loading={loading}
      showOkBtn={showOkBtn}
      showCancelBtn={showCancelBtn}
      okText={okText}
      cancelText={cancelText}
      okBtnProps={okBtnProps}
      cancelBtnProps={cancelBtnProps}
      extra={extra}
      styles={onlineModelModalFooterStyle}
    />
  );
};

export default OnlineModelModalFooter;
