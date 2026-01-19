import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { categoryOptions } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  return (
    <>
      <Form.Item name="name" data-field="name">
        <SealInput.Input required label={'Model Name'} />
      </Form.Item>
      <Form.Item name="category">
        <SealSelect options={categoryOptions} label="Category"></SealSelect>
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

export default Basic;
