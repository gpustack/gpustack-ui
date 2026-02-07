import Password from '@/components/seal-form/password';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import ProviderLogo from '../components/provider-logo';
import { useFormContext } from '../config/form-context';
import { maasProviderOptions, ProviderEnum } from '../config/providers';
import { FormData } from '../config/types';

const Basic: React.FC<{
  onAPIKeyBlur?: (e: any) => void;
}> = ({ onAPIKeyBlur }) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { action } = useFormContext();
  const providerType = Form.useWatch(['config', 'type'], form);
  const { getRuleMessage } = useAppUtils();

  const optionRender = (option: any) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ProviderLogo provider={option.value} />
        <span style={{ marginLeft: 8 }}>{option.label}</span>
      </div>
    );
  };

  const filterOption = (input: string, option?: any) => {
    return (
      option?.label?.toLowerCase().includes(input.toLowerCase()) ||
      option?.value?.toLowerCase().includes(input.toLowerCase())
    );
  };

  return (
    <>
      <Form.Item<FormData>
        name="name"
        data-field="name"
        required
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <SealInput.Input
          required
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
        />
      </Form.Item>
      <Form.Item<FormData>
        name={['config', 'type']}
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'common.table.type')
          }
        ]}
      >
        <SealSelect
          showSearch={{
            filterOption: filterOption
          }}
          required
          options={maasProviderOptions}
          optionRender={optionRender}
          labelRender={optionRender}
          label={intl.formatMessage({
            id: 'common.table.type'
          })}
        />
      </Form.Item>
      {providerType === ProviderEnum.OPENAI && (
        <Form.Item<FormData> name={['config', 'openaiCustomUrl']}>
          <SealInput.Input
            placeholder="http://<your-inference-server>/v1"
            label={intl.formatMessage({
              id: 'providers.form.custombeckendUrl'
            })}
          />
        </Form.Item>
      )}
      <Form.Item<FormData>
        name="api_key"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'providers.form.tokens.title')
          }
        ]}
      >
        <Password
          required
          visibilityToggle={action !== PageAction.EDIT}
          onBlur={onAPIKeyBlur}
          label={intl.formatMessage({
            id: 'providers.form.tokens.title'
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
