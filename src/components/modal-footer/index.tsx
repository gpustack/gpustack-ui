import { Button, Space } from 'antd';

type ModalFooterProps = {
  onOk: () => void;
  onCancel: () => void;
  cancelText?: string;
  okText?: string;
};
const ModalFooter: React.FC<ModalFooterProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText
}) => {
  return (
    <Space size={20}>
      <Button onClick={onCancel} style={{ width: '88px' }}>
        {cancelText || '取消'}
      </Button>
      <Button type="primary" onClick={onOk} style={{ width: '88px' }}>
        {okText || '保存'}
      </Button>
    </Space>
  );
};

export default ModalFooter;
