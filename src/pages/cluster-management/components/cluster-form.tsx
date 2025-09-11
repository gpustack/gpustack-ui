import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import CloudProvider from './cloud-provider-form';

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  provider: ProviderType;
  credentialList: Global.BaseOption<number>[];
  onFinish: (values: FormData) => void;
  ref?: any;
};
const ClusterForm: React.FC<AddModalProps> = forwardRef(
  ({ action, provider, currentData, credentialList, onFinish }, ref) => {
    const [form] = Form.useForm();
    const intl = useIntl();

    useEffect(() => {
      if (currentData) {
        form.setFieldsValue(currentData);
      }
    }, [currentData]);

    useImperativeHandle(ref, () => ({
      resetFields: () => {
        form.resetFields();
      },
      submit: () => {
        form.submit();
      },
      setFieldsValue: (values: any) => {
        form.setFieldsValue(values);
      },
      getFieldsValue: () => {
        return form.getFieldsValue();
      },
      validateFields: async () => {
        return await form.validateFields();
      }
    }));

    return (
      <Form
        name="clusterForm"
        form={form}
        onFinish={onFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={currentData}
      >
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
          <CloudProvider
            provider={provider}
            action={action}
            credentialID={currentData?.credential_id}
            credentialList={credentialList}
          ></CloudProvider>
        )}
        <Form.Item<FormData> name="description" rules={[{ required: false }]}>
          <SealInput.TextArea
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></SealInput.TextArea>
        </Form.Item>
      </Form>
    );
  }
);

export default ClusterForm;
