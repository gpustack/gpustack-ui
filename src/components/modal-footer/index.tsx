import { Button, Space } from 'antd';

type ModalFooterProps = {
  onOk?: () => void;
  onCancel: () => void;
  cancelText?: string;
  okText?: string;
  htmlType?: 'button' | 'submit';
  form?: any;
  loading?: boolean;
};
const ModalFooter: React.FC<ModalFooterProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText,
  loading,
  htmlType = 'button',
  form
}) => {
  return (
    <Space size={20}>
      <Button onClick={onCancel} style={{ width: '88px' }} loading={loading}>
        {cancelText || '取消'}
      </Button>
      <Button
        type="primary"
        onClick={onOk}
        style={{ width: '88px' }}
        loading={loading}
        htmlType={htmlType}
      >
        {okText || '保存'}
      </Button>
    </Space>
  );
};

export default ModalFooter;
