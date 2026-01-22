import ListInput from '@/components/list-input';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const AccessToken = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance<FormData>();

  const handleOnChange = (values: string[]) => {};

  return (
    <>
      <Form.Item
        name="tokens"
        rules={[
          {
            required: true,
            message: getRuleMessage(
              'input',
              intl.formatMessage({ id: 'providers.form.tokens.title' })
            )
          }
        ]}
      >
        <ListInput
          required={true}
          btnText={intl.formatMessage({ id: 'providers.form.tokens.add' })}
          label={intl.formatMessage({ id: 'providers.form.tokens.title' })}
          dataList={[]}
          onChange={handleOnChange}
        ></ListInput>
      </Form.Item>
    </>
  );
};

export default AccessToken;
