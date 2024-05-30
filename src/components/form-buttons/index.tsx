import { Button, Space } from 'antd';

type FormButtonsProps = {
  onOk: () => void;
  onCancel: () => void;
  cancelText?: string;
  okText?: string;
};
const FormButtons: React.FC<FormButtonsProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText
}) => {
  return (
    <Space size={40} style={{ marginTop: '80px' }}>
      <Button type="primary" onClick={onOk} style={{ width: '120px' }}>
        {okText || '保存'}
      </Button>
      <Button onClick={onCancel} style={{ width: '98px' }}>
        {cancelText || '取消'}
      </Button>
    </Space>
  );
};

export default FormButtons;
