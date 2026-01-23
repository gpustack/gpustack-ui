import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { categoryOptions } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { getRuleMessage } = useAppUtils();
  return (
    <>
      <Form.Item name="name" data-field="name">
        <SealInput.Input
          required
          label={intl.formatMessage({ id: 'models.table.name' })}
        />
      </Form.Item>
      <Form.Item
        name="categories"
        normalize={(value) => (value ? [value] : [])}
        getValueProps={(value) => ({
          value: Array.isArray(value) ? value[0] || null : value
        })}
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'models.form.categories')
          }
        ]}
      >
        <SealSelect
          required
          options={categoryOptions}
          label={intl.formatMessage({ id: 'models.form.categories' })}
        ></SealSelect>
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
