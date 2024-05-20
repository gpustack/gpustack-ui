import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { SyncOutlined } from '@ant-design/icons';
import { Form, Modal } from 'antd';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
};
const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm();
  const suffix = (
    <SyncOutlined
      style={{
        fontSize: 16,
        color: '#1677ff'
      }}
    />
  );
  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={<ModalFooter onOk={onOk} onCancel={onCancel}></ModalFooter>}
    >
      <Form name="addUserForm" form={form} onFinish={onOk}>
        <Form.Item name="name" rules={[{ required: true }]}>
          <SealInput.Input label="Name"></SealInput.Input>
        </Form.Item>
        <Form.Item name="role" rules={[{ required: true }]}>
          <SealSelect label="Role"></SealSelect>
        </Form.Item>
        <Form.Item name="email" rules={[{ required: true }]}>
          <SealInput.Input label="Email"></SealInput.Input>
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true }]}>
          <SealInput.Input label="Password"></SealInput.Input>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
