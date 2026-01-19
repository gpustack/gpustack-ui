import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Endpoints = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  return (
    <>
      <Form.Item name="name" data-field="endpoints">
        <SealInput.Input
          required
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
        />
      </Form.Item>
      <Form.Item name="provider" hidden>
        <SealInput.Input
          label={intl.formatMessage({
            id: 'providers.table.providerName'
          })}
        />
      </Form.Item>
      <Form.Item name="description">
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
    </>
  );
};

export default Endpoints;
