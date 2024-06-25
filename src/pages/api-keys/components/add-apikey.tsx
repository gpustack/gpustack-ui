import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import { expirationOptions } from '../config';
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
  const [form] = Form.useForm();
  const intl = useIntl();
  const Suffix = (
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
      <Form name="addAPIKey" form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData>
          name="name"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: intl.formatMessage({ id: 'common.table.name' })
                }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData>
          name="expires_in"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.select' },
                {
                  name: intl.formatMessage({ id: 'apikeys.form.expiretime' })
                }
              )
            }
          ]}
        >
          <SealSelect
            label={intl.formatMessage({ id: 'apikeys.form.expiretime' })}
            required
            options={expirationOptions}
          ></SealSelect>
        </Form.Item>
        <Form.Item<FormData> name="description" rules={[{ required: false }]}>
          <SealInput.TextArea
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></SealInput.TextArea>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
