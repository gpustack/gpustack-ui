import { Button, Space } from 'antd';

type FormButtonsProps = {
  onOk?: () => void;
  onCancel?: () => void;
  cancelText?: string;
  okText?: string;
  htmlType?: 'submit' | 'button';
};
const FormButtons: React.FC<FormButtonsProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText,
  htmlType = 'button'
}) => {
  return (
    <Space size={40} style={{ marginTop: '80px' }}>
      <Button
        type="primary"
        onClick={onOk}
        style={{ width: '120px' }}
        htmlType={htmlType}
      >
        {okText || '保存'}
      </Button>
      <Button onClick={onCancel} style={{ width: '98px' }}>
        {cancelText || '取消'}
      </Button>
    </Space>
  );
};

export default FormButtons;
