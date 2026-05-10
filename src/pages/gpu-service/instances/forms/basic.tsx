import { Input as CInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  const intl = useIntl();
  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name={['metadata', 'name']}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'gpuservice.instance.name.required'
            })
          }
        ]}
      >
        <CInput.Input
          label={intl.formatMessage({ id: 'gpuservice.instance.name' })}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'description']}>
        <CInput.TextArea
          label={intl.formatMessage({ id: 'common.table.description' })}
          scaleSize
        />
      </Form.Item>
    </>
  );
};

export default Basic;
