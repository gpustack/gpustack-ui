import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { SyncOutlined } from '@ant-design/icons';
import { Form, Modal } from 'antd';
import { UserRolesOptions } from '../config';
import { FormData } from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  onCancel
}) => {
  if (!open) {
    return null;
  }

  const [form] = Form.useForm();
  const suffix = (
    <SyncOutlined
      style={{
        fontSize: 16,
        color: '#1677ff'
      }}
    />
  );

  const handleSumit = () => {
    form.submit();
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleSumit}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <Form name="addUserForm" form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData> name="name" rules={[{ required: true }]}>
          <SealInput.Input label="Name"></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData> name="full_name" rules={[{ required: true }]}>
          <SealInput.Input label="FullName"></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData> name="is_admin" rules={[{ required: true }]}>
          <SealSelect label="Role" options={UserRolesOptions}></SealSelect>
        </Form.Item>

        <Form.Item<FormData> name="password" rules={[{ required: true }]}>
          <SealInput.Input label="Password"></SealInput.Input>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
