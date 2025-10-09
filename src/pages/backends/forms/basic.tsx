import ListInput from '@/components/list-input';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
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
          trim
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData>
        name="health_check_path"
        rules={[{ required: false }]}
      >
        <SealInput.Input trim label={'Health Check Path'}></SealInput.Input>
      </Form.Item>

      <Form.Item name="default_run_command">
        <SealInput.TextArea label="Default Execution Command"></SealInput.TextArea>
      </Form.Item>

      <Form.Item<FormData>
        name="default_backend_param"
        rules={[{ required: false }]}
      >
        <ListInput
          dataList={form.getFieldValue('default_backend_param') || []}
          onChange={(data: string[]) => {
            form.setFieldValue('default_backend_param', data);
          }}
          btnText={'Add Backend Parameter'}
          label={'Default Backend Parameters'}
        ></ListInput>
      </Form.Item>

      <Form.Item<FormData> name="description" rules={[{ required: false }]}>
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({ id: 'common.table.description' })}
        ></SealInput.TextArea>
      </Form.Item>
    </>
  );
};

export default BasicForm;
