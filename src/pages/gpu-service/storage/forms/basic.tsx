import { Input as CInput, Select as SealSelect } from '@gpustack/core-ui';
import { Form } from 'antd';
import { AccessModeOptions, StorageTypeOptions } from '../config';
import { FormData } from '../config/types';

const Basic = () => {
  return (
    <>
      <Form.Item<FormData>
        name={['metadata', 'name']}
        rules={[
          {
            required: true,
            message: '请输入存储名称'
          }
        ]}
      >
        <CInput.Input label="名称" required />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'type']}
            rules={[
              {
                required: true,
                message: '请选择存储类型'
              }
            ]}
          >
            <SealSelect
              label="存储类型"
              required
              options={StorageTypeOptions}
            ></SealSelect>
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'capacity']}
            rules={[
              {
                required: true,
                message: '请输入容量'
              }
            ]}
          >
            <CInput.Input label="容量" required placeholder="例如：10Gi" />
          </Form.Item>
        </div>
      </div>
      <Form.Item<FormData>
        name={['spec', 'accessMode']}
        rules={[
          {
            required: true,
            message: '请选择访问模式'
          }
        ]}
      >
        <SealSelect
          label="存储卷访问方式"
          required
          options={AccessModeOptions}
        ></SealSelect>
      </Form.Item>
    </>
  );
};

export default Basic;
