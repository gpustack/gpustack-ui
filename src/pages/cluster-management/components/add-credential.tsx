import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import FormDrawer from '@/pages/_components/form-drawer';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ProviderType, ProviderValueMap } from '../config';
import {
  CredentialFormData as FormData,
  CredentialListItem as ListItem
} from '../config/types';

const ExtraContent = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: absolute;
  bottom: 6px;
  right: 32px;
  z-index: 1;
  background: var(--ant-color-bg-container);
  padding-inline: 8px;
`;
type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  currentData?: ListItem;
  onCancel: () => void;
  provider: ProviderType;
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
    <FormDrawer
      title={title}
      open={open}
      onSubmit={handleSumit}
      onCancel={handleCancel}
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
                label={intl.formatMessage({
                  id: 'clusters.credential.token'
                })}
                required={action === PageAction.CREATE}
                description={
                  <span
                    dangerouslySetInnerHTML={{
                      __html: intl.formatMessage(
                        {
                          id: 'clusters.button.genToken'
                        },
                        {
                          link: 'https://cloud.digitalocean.com/account/api/tokens'
                        }
                      )
                    }}
                  ></span>
                }
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
    </FormDrawer>
  );
};

export default AddModal;
