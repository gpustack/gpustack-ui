import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import ProviderLogo from '../components/provider-logo';
import { maasProviderOptions } from '../config/providers';
import { FormData } from '../config/types';

const Basic = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();

  const optionRender = (option: any) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ProviderLogo provider={option.value} />
        <span style={{ marginLeft: 8 }}>{option.label}</span>
      </div>
    );
  };

  return (
    <>
      <Form.Item<FormData> name="name" data-field="name">
        <SealInput.Input
          required
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['config', 'type']}>
        <SealSelect
          showSearch
          options={maasProviderOptions}
          optionRender={optionRender}
          labelRender={optionRender}
          label={intl.formatMessage({
            id: 'providers.table.providerName'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name="description">
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
