import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form, Modal } from 'antd';
import { useEffect } from 'react';
import { FormData } from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const sourceOptions = [
  { label: 'Huggingface', value: 'huggingface', key: 'huggingface' },
  { label: 'S3', value: 's3', key: 's3' }
];

const AddModal: React.FC<AddModalProps> = (props) => {
  const { title, action, open, onOk, onCancel } = props || {};
  if (!open) {
    return null;
  }
  const [form] = Form.useForm();
  const modelSource = Form.useWatch('source', form);

  const initFormValue = () => {
    if (action === PageAction.CREATE && open) {
      form.setFieldsValue({
        source: 'huggingface'
      });
    }
  };

  useEffect(() => {
    initFormValue();
  }, [open]);

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="huggingface_repo_id"
          rules={[{ required: true }]}
        >
          <SealInput.Input label="Huggingface ID" required></SealInput.Input>
        </Form.Item>
        {/* <Form.Item<FormData>
          name="huggingface_filename"
          rules={[{ required: true }]}
        >
          <SealInput.Input
            label="Huggingface File Name"
            required
          ></SealInput.Input>
        </Form.Item> */}
      </>
    );
  };

  const renderS3Fields = () => {
    return (
      <>
        <Form.Item<FormData> name="s3_address" rules={[{ required: true }]}>
          <SealInput.Input label="S3 Address" required></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const handleSourceChange = (value: string) => {
    console.log('source change', value);
  };
  const handleSumit = () => {
    form.submit();
  };
  const handleOnFinish = (values: FormData) => {
    console.log('onFinish', values);
    onOk(values);
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
        <ModalFooter onCancel={onCancel} onOk={handleSumit}></ModalFooter>
      }
    >
      <Form name="addModalForm" form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData> name="name" rules={[{ required: true }]}>
          <SealInput.Input
            label="Name"
            required
            description="description info"
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData> name="source" rules={[{ required: true }]}>
          <SealSelect
            label="Source"
            options={sourceOptions}
            required
            onChange={handleSourceChange}
          ></SealSelect>
        </Form.Item>
        {modelSource === 's3' ? renderS3Fields() : renderHuggingfaceFields()}
        <Form.Item<FormData> name="description">
          <SealInput.TextArea label="Description"></SealInput.TextArea>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
