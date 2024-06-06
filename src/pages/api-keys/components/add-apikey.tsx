import CopyButton from '@/components/copy-button';
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

const expirationOptions = [
  { label: '1 Month', value: '1m' },
  { label: '6 Months', value: '6m' },
  { label: 'Never', value: 'never' }
];
const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm();
  const Suffix = (
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
      <Form name="addAPIKey" form={form} onFinish={onOk}>
        <Form.Item name="name" rules={[{ required: true }]}>
          <SealInput.Input label="Display Name" required></SealInput.Input>
        </Form.Item>
        <Form.Item name="secretkey" rules={[{ required: true }]}>
          <SealInput.Input
            label="Secret Key"
            addonAfter={
              <CopyButton text={form.getFieldValue('secretKey')}></CopyButton>
            }
          ></SealInput.Input>
        </Form.Item>
        <Form.Item name="expiration" rules={[{ required: true }]}>
          <SealSelect
            label="Expiration"
            required
            options={expirationOptions}
          ></SealSelect>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
