import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Input as CInput, FormDrawer, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { isCloudProvider, ProviderType } from '../config';
import { getCloudProviderAdapter } from '../config/cloud-providers';
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
  // Shuihua calls its secret an API key, DigitalOcean an access token, and
  // they hand it out on different kinds of page — so both the field label and
  // the hint below it come from the adapter.
  const { tokenDocUrl, secretLabelId } = getCloudProviderAdapter(provider);

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
        <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />
        {isCloudProvider(provider) && (
          <Form.Item<FormData>
            name="secret"
            rules={[
              {
                required: action === PageAction.CREATE,
                message: getRuleMessage('input', secretLabelId)
              }
            ]}
            // Where to get the secret, visible rather than behind the label's
            // `?` tooltip: for a first-time user this link is the first step,
            // and a hint that has to be discovered by hovering an icon is not
            // one. A provider with no documented page shows nothing rather
            // than linking nowhere.
            extra={
              tokenDocUrl ? (
                <span
                  className="font-size-12"
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage(
                      { id: 'clusters.credential.signinToCreate' },
                      {
                        link: tokenDocUrl,
                        name: intl.formatMessage({ id: secretLabelId })
                      }
                    )
                  }}
                ></span>
              ) : undefined
            }
          >
            <CInput.Password
              label={intl.formatMessage({
                id: secretLabelId
              })}
              required={action === PageAction.CREATE}
            ></CInput.Password>
          </Form.Item>
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
