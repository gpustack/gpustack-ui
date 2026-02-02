import MetadataList from '@/components/metadata-list';
import SealInput from '@/components/seal-form/seal-input';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const AccessToken = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance<FormData>();
  const tokenList = Form.useWatch('api_tokens', form) || [];

  const onAdd = () => {
    const newList = [...tokenList];
    newList.push('');
    form.setFieldValue('api_tokens', newList);
  };

  const onDelete = (index: number) => {
    const newList = [...tokenList];
    newList.splice(index, 1);
    form.setFieldValue('api_tokens', newList);
  };

  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newList = [...tokenList];
    newList[index] = e.target.value;
    form.setFieldValue('api_tokens', newList);
  };

  return (
    <>
      <Form.Item
        name="api_tokens"
        style={{
          marginBottom: 8
        }}
        rules={[
          {
            required: false,
            message: getRuleMessage(
              'input',
              intl.formatMessage({ id: 'providers.form.tokens.title' })
            )
          }
        ]}
      >
        <MetadataList
          dataList={tokenList}
          btnText={intl.formatMessage({ id: 'providers.form.tokens.add' })}
          label={intl.formatMessage({ id: 'providers.form.fallback.token' })}
          onAdd={onAdd}
          onDelete={onDelete}
        >
          {(item, index) => (
            <div style={{ width: '100%' }} key={index}>
              <SealInput.Password
                value={item}
                onChange={(e) => handleInputChange(index, e)}
              ></SealInput.Password>
            </div>
          )}
        </MetadataList>
      </Form.Item>
    </>
  );
};

export default AccessToken;
