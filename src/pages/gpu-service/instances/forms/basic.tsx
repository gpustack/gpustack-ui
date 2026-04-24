import {
  Input as CInput,
  InputNumber as CInputNumber
} from '@gpustack/core-ui';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = () => {
  return (
    <>
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
      <Form.Item<FormData>
        name="image"
        rules={[
          {
            required: true,
            message: '请输入镜像'
          }
        ]}
      >
        <CInput.Input label="镜像" required />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name="gpu_count"
            rules={[
              {
                required: true,
                message: '请输入 GPU 数量'
              }
            ]}
          >
            <CInputNumber min={0} precision={0} label="GPU 数量" required />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name="replicas"
            rules={[
              {
                required: true,
                message: '请输入副本数'
              }
            ]}
          >
            <CInputNumber min={1} precision={0} label="副本数" required />
          </Form.Item>
        </div>
      </div>
      <Form.Item<FormData> name="description">
        <CInput.TextArea label="描述" scaleSize />
      </Form.Item>
    </>
  );
};

export default Basic;
