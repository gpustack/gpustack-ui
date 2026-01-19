import ListInput from '@/components/list-input';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const AccessToken = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();

  const handleOnChange = (values: string[]) => {};

  return (
    <>
      <Form.Item name="tokens">
        <ListInput
          btnText="Add Token"
          label="Access Tokens"
          dataList={[]}
          onChange={handleOnChange}
        ></ListInput>
      </Form.Item>
    </>
  );
};

export default AccessToken;
