import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';

type ModalFooterProps = {
  onOk?: () => void;
  onCancel: () => void;
  cancelText?: string;
  okText?: string;
  htmlType?: 'button' | 'submit';
  okBtnProps?: any;
  cancelBtnProps?: any;
  form?: any;
  loading?: boolean;
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
  form
}) => {
  const intl = useIntl();
  return (
    <Space size={20}>
      <Button onClick={onCancel} style={{ width: '88px' }} {...cancelBtnProps}>
        {cancelText || intl.formatMessage({ id: 'common.button.cancel' })}
      </Button>
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
    </Space>
  );
};

export default ModalFooter;
