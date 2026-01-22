import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { modelCategories } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
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
          value: Array.isArray(value) ? value[0] : value
        })}
      >
        <SealSelect
          options={modelCategories}
          label={intl.formatMessage({ id: 'models.form.categories' })}
          allowNull
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
