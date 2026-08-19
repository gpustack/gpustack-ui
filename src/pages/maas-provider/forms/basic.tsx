import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction } from '@/config';
import {
  Input as CInput,
  Password,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import ProviderLogo from '../components/provider-logo';
import { useFormContext } from '../config/form-context';
import { maasProviderOptions } from '../config/providers';
import { FormData } from '../config/types';
import providerTypeStyles from '../styles/provider-type.less';
import ProviderConfigs from './provider-configs';

const Basic: React.FC<{
  onAPIKeyBlur?: (e: any) => void;
}> = ({ onAPIKeyBlur }) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { action, resetCustomConfig } = useFormContext();
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
    console.log('filterOption input, option: ', input, option);
    return (
      option?.label?.toLowerCase().includes(input.toLowerCase()) ||
      option?.value?.toLowerCase().includes(input.toLowerCase()) ||
      option?.description?.toLowerCase().includes(input.toLowerCase())
    );
  };

  // config fields (claudeCustomUrl, awsRegion, ...), credentials and models all
  // belong to the provider they were entered for — carrying them over would
  // submit one provider's models under another, and fire get-models / test-model
  // against the new upstream with the previous provider's key
  const handleProviderTypeChange = (value: string) => {
    // setFieldValue replaces the value at the path; setFieldsValue would deep
    // merge and leave the previous type's config fields behind
    form.setFieldValue('config', { type: value });
    form.setFieldValue('models', []);
    form.setFieldValue('api_key', '');
    form.setFieldValue('api_tokens', []);
    resetCustomConfig?.();
  };

  const renderLogoPrefix = () => {
    const hasProvider = maasProviderOptions.some(
      (option) => option.value === providerType
    );
    if (hasProvider) {
      return (
        <div style={{ display: 'flex', alignItems: 'end', height: '100%' }}>
          <ProviderLogo provider={providerType as string} />
        </div>
      );
    }
    return null;
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
        <CInput.Input
          required
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
        />
      </Form.Item>
      <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />
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
          className={providerTypeStyles.providerType}
          prefix={renderLogoPrefix()}
          options={maasProviderOptions}
          optionRender={optionRender}
          onChange={handleProviderTypeChange}
          label={intl.formatMessage({
            id: 'common.table.type'
          })}
        />
      </Form.Item>
      <ProviderConfigs />
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
        <CInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></CInput.TextArea>
      </Form.Item>
    </>
  );
};

export default Basic;
