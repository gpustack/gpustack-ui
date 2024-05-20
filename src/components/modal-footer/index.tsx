import { Button, Space } from 'antd';

type ModalFooterProps = {
  onOk: () => void;
  onCancel: () => void;
};
const ModalFooter: React.FC<ModalFooterProps> = ({ onOk, onCancel }) => {
  return (
    <Space size={20}>
      <Button onClick={onCancel} style={{ width: '88px' }}>
        取消
      </Button>
      <Button type="primary" onClick={onOk} style={{ width: '88px' }}>
        确定
      </Button>
    </Space>
  );
};

export default ModalFooter;
