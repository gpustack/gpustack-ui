import { Input as CInput } from '@gpustack/core-ui';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  return (
    <div data-field="name">
      <Form.Item<FormData>
        name="name"
        rules={[
          {
            required: true,
            message: '请输入实例名称'
          }
        ]}
      >
        <CInput.Input label="实例名称" required />
      </Form.Item>
      <Form.Item<FormData> name="description">
        <CInput.TextArea label="描述" scaleSize />
      </Form.Item>
    </div>
  );
};

export default Basic;
