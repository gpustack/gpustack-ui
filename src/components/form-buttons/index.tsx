import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';

type FormButtonsProps = {
  onOk?: () => void;
  onCancel?: () => void;
  cancelText?: string;
  okText?: string;
  showOk?: boolean;
  showCancel?: boolean;
  htmlType?: 'submit' | 'button';
};
const FormButtons: React.FC<FormButtonsProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText,
  showCancel = true,
  showOk = true,
  htmlType = 'button'
}) => {
  const intl = useIntl();
  return (
    <Space size={40} style={{ marginTop: '80px' }}>
      {showOk && (
        <Button
          type="primary"
          onClick={onOk}
          style={{ width: '120px' }}
          htmlType={htmlType}
        >
          {okText || intl.formatMessage({ id: 'common.button.save' })}
        </Button>
      )}
      {showCancel && (
        <Button onClick={onCancel} style={{ width: '98px' }}>
          {cancelText || intl.formatMessage({ id: 'common.button.cancel' })}
        </Button>
      )}
    </Space>
  );
};

export default FormButtons;
