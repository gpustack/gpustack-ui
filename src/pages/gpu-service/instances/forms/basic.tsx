import { Input as CInput } from '@gpustack/core-ui';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name={['metadata', 'name']}
        rules={[
          {
            required: true,
            message: '请输入实例名称'
          }
        ]}
      >
        <CInput.Input label="实例名称" required />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'description']}>
        <CInput.TextArea label="描述" scaleSize />
      </Form.Item>
    </>
  );
};

export default Basic;
