import { Input as CInput, Password } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
const ProviderConfigs = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { providerFields } = useFormContext();

  const renderLabel = (item: any) => {
    return item.label.locale
      ? intl.formatMessage({ id: item.label.text })
      : item.label.text;
  };

  const renderDescription = (item: any) => {
    return item.description
      ? item.description.locale
        ? intl.formatMessage({ id: item.description.text })
        : item.description.text
      : undefined;
  };

  return (
    <>
      {providerFields && providerFields.length > 0
        ? providerFields?.map((item) => {
            return (
              <Form.Item
                name={['config', item.name]}
                rules={item.rules}
                key={item.name}
              >
                {item.type === 'Input' && (
                  <CInput.Input
                    required={item.required}
                    description={renderDescription(item)}
                    label={renderLabel(item)}
                    placeholder={item.placeholder}
                  ></CInput.Input>
                )}
                {item.type === 'Password' && (
                  <Password
                    required={item.required}
                    label={renderLabel(item)}
                    description={renderDescription(item)}
                    placeholder={item.placeholder}
                  ></Password>
                )}
              </Form.Item>
            );
          })
        : null}
    </>
  );
};

export default ProviderConfigs;
