import ListInput from '@/components/list-input';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { FormData } from '../config/types';

type AddModalProps = {
  action: PageActionType;
};
const BasicForm: React.FC<AddModalProps> = ({ action }) => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
      <Form.Item<FormData>
        name="backend_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        ></SealInput.Input>
      </Form.Item>

      <Form.Item<FormData>
        name="compatibility_type"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'template', false)
          }
        ]}
      >
        <SealSelect
          label={'Compatibility Template'}
          required
          options={[
            { label: 'Template 1', value: 'tensorflow' },
            { label: 'Template 2', value: 'torchserve' }
          ]}
        ></SealSelect>
      </Form.Item>

      <Form.Item<FormData>
        name="allowed_proxy_uris"
        rules={[{ required: false }]}
      >
        <ListInput
          dataList={form.getFieldValue('allowed_proxy_uris') || []}
          onChange={(data: string[]) => {
            form.setFieldValue('allowed_proxy_uris', data);
          }}
          btnText={'Add Allowed Proxy URI'}
          label={'Proxy URI'}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData> name="description" rules={[{ required: false }]}>
        <SealInput.TextArea
          label={intl.formatMessage({ id: 'common.table.description' })}
        ></SealInput.TextArea>
      </Form.Item>
    </>
  );
};

export default BasicForm;
