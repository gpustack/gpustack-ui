import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { Input as CInput, FormDrawer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
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
          <CInput.Input
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
          ></CInput.Input>
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
              <CInput.Password
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
              ></CInput.Password>
            </Form.Item>
          </>
        )}
        <Form.Item<FormData> name="description" rules={[{ required: false }]}>
          <CInput.TextArea
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></CInput.TextArea>
        </Form.Item>
      </Form>
    </FormDrawer>
  );
};

export default AddModal;
