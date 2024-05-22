import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { Form, Modal } from 'antd';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
};
const AddModal: React.FC<AddModalProps> = (props) => {
  const { title, action, open, onOk, onCancel } = props || {};
  if (!open) {
    return null;
  }
  console.log('modal open', open);
  const [form] = Form.useForm();
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
      <Form name="addModalForm" form={form} onFinish={onOk}>
        <Form.Item name="displayName" rules={[{ required: true }]}>
          <SealInput.Input label="Display Name"></SealInput.Input>
        </Form.Item>
        <Form.Item name="catagory" rules={[{ required: true }]}>
          <SealSelect label="Catagory"></SealSelect>
        </Form.Item>
        <Form.Item name="name" rules={[{ required: true }]}>
          <SealInput.Input label="Model Name"></SealInput.Input>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
