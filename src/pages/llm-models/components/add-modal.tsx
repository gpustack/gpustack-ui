import ModalFooter from '@/components/modal-footer';
import FieldWrapper from '@/components/seal-form/field-wrapper';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { Form, Modal, Slider } from 'antd';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const sourceOptions = [
  { label: 'Huggingface', value: 'huggingface' },
  { label: 'S3', value: 's3' }
];
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
        <Form.Item name="name" rules={[{ required: true }]}>
          <SealInput.Input
            label="Name"
            required
            description="description info"
          ></SealInput.Input>
        </Form.Item>
        <Form.Item name="source" rules={[{ required: true }]}>
          <SealSelect label="Model Source" options={sourceOptions}></SealSelect>
        </Form.Item>
        <Form.Item name="id" rules={[{ required: true }]}>
          <SealSelect label="Huggingface ID" showSearch></SealSelect>
        </Form.Item>
        <Form.Item name="tokenPers" rules={[{ required: true }]}>
          <FieldWrapper
            label="tokenPers"
            required
            description="description info"
          >
            <Slider defaultValue={30} style={{ width: '100%' }} />
          </FieldWrapper>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
