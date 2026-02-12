import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInput from '@/components/seal-form/seal-input';
import useAppUtils from '@/hooks/use-app-utils';
import CategorySelect from '@/pages/_components/category-select';
import DocLink from '@/pages/_components/doc-link';
import { categoryOptions } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { genericReferLink } from '../config';
import { FormData } from '../config/types';

const Basic = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { getRuleMessage } = useAppUtils();
  return (
    <>
      <Form.Item
        name="name"
        data-field="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <SealInput.Input
          required
          label={intl.formatMessage({ id: 'common.table.name' })}
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
            required: false,
            message: getRuleMessage('select', 'models.form.categories')
          }
        ]}
      >
        <CategorySelect
          allowNull
          options={[
            ...categoryOptions,
            {
              label: intl.formatMessage({ id: 'common.option.other' }),
              value: null
            }
          ]}
          label={intl.formatMessage({ id: 'models.form.categories' })}
        ></CategorySelect>
      </Form.Item>
      <Form.Item name="description" style={{ marginBottom: 8 }}>
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
      <Form.Item<FormData>
        name="generic_proxy"
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <CheckboxField
          description={
            <DocLink
              title={intl.formatMessage({
                id: 'models.form.generic_proxy.tips'
              })}
              link={genericReferLink}
            ></DocLink>
          }
          label={intl.formatMessage({
            id: 'models.form.generic_proxy'
          })}
        ></CheckboxField>
      </Form.Item>
    </>
  );
};

export default Basic;
