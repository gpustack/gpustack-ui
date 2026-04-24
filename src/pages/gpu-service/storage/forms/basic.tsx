import {
  Input as CInput,
  InputNumber as CInputNumber,
  Select as SealSelect
} from '@gpustack/core-ui';
import { Form } from 'antd';
import { StorageAccessModeOptions } from '../config';
import { FormData } from '../config/types';

const Basic = () => {
  const form = Form.useFormInstance<FormData>();
  const parameters = Form.useWatch('parameters', form);

  const handleParametersChange = (value: Record<string, any>) => {
    form.setFieldValue('parameters', value);
  };

  return (
    <>
      <Form.Item<FormData>
        name="name"
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
            name="type"
            rules={[
              {
                required: true,
                message: '请选择存储类型'
              }
            ]}
          >
            <SealSelect label="存储类型" required options={[]}></SealSelect>
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name="capacity_gb"
            rules={[
              {
                required: true,
                message: '请输入容量'
              }
            ]}
          >
            <CInputNumber min={1} precision={0} label="容量 (GB)" required />
          </Form.Item>
        </div>
      </div>
      <Form.Item<FormData> name="access_modes">
        <SealSelect
          label="存储卷访问方式"
          allowClear
          options={StorageAccessModeOptions}
        ></SealSelect>
      </Form.Item>
      {/* <Form.Item<FormData> name="parameters">
        <LabelSelector
          label="存储卷配置参数"
          labels={parameters || {}}
          btnText="添加参数"
          onChange={handleParametersChange}
        />
      </Form.Item> */}
      <Form.Item<FormData> name="description">
        <CInput.TextArea label="描述" scaleSize />
      </Form.Item>
    </>
  );
};

export default Basic;
