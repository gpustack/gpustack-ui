import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { ProviderValueMap } from '../config';
import {
  CredentialFormData as FormData,
  CredentialListItem as ListItem
} from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  currentData?: ListItem;
  onCancel: () => void;
  provider: string; // 'kubernetes'  | 'digitalocean';
};
const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  currentData,
  provider,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  const handleSumit = () => {
    form.submit();
  };

  const handleOk = async (data: FormData) => {
    onOk(data);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };
  useEffect(() => {
    if (currentData) {
      form.setFieldsValue(currentData);
    }
  }, [currentData]);

  return (
    <ScrollerModal
      title={title}
      open={open}
      centered={true}
      onOk={handleSumit}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={handleCancel}></ModalFooter>
      }
    >
      <Form form={form} onFinish={handleOk} preserve={false}>
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
        {provider === ProviderValueMap.DigitalOcean && (
          <>
            <Form.Item<FormData>
              name="secret"
              rules={[
                {
                  required: action === PageAction.CREATE,
                  message: getRuleMessage('input', 'clusters.credential.token')
                }
              ]}
            >
              <SealInput.Password
                label={intl.formatMessage({ id: 'clusters.credential.token' })}
                required={action === PageAction.CREATE}
              ></SealInput.Password>
            </Form.Item>
          </>
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
