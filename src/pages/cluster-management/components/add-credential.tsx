import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction, PasswordReg } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { FormData, ListItem } from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem;
  onCancel: () => void;
  provider: string; // 'kubernetes'  | 'digitalocean';
};
const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  provider,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleSumit = () => {
    form.submit();
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      centered={true}
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
      <Form form={form} onFinish={onOk} preserve={false}>
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
        {/* <Form.Item<FormData>
          name="provider"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: 'Provider'
                }
              )
            }
          ]}
        >
          <SealSelect
            label="Provider"
            required
            options={['Digital Ocean', 'Kubernetes', 'Custom'].map((item) => ({
              label: item,
              value: item
            }))}
          ></SealSelect>
        </Form.Item> */}
        {provider === 'digital_ocean' && (
          <>
            <Form.Item<FormData>
              name="access_key"
              rules={[
                {
                  required: action === PageAction.CREATE,
                  pattern: PasswordReg,
                  message: intl.formatMessage({
                    id: 'users.form.rule.password'
                  })
                }
              ]}
            >
              <SealInput.Password
                label="Access Key"
                required={action === PageAction.CREATE}
              ></SealInput.Password>
            </Form.Item>
            <Form.Item<FormData>
              name="secret_key"
              rules={[
                {
                  required: action === PageAction.CREATE,
                  pattern: PasswordReg,
                  message: intl.formatMessage({
                    id: 'users.form.rule.password'
                  })
                }
              ]}
            >
              <SealInput.Password
                label="Secret Key"
                required={action === PageAction.CREATE}
              ></SealInput.Password>
            </Form.Item>
          </>
        )}
        {provider === 'kubernetes' && (
          <Form.Item<FormData> name="kubeconfig" rules={[{ required: false }]}>
            <SealInput.TextArea label="Kubeconfig"></SealInput.TextArea>
          </Form.Item>
        )}
        <Form.Item<FormData> name="description" rules={[{ required: false }]}>
          <SealInput.TextArea
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></SealInput.TextArea>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default AddModal;
