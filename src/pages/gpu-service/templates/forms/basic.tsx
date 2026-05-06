import { GPUsConfigs } from '@/pages/resources/config/gpu-driver';
import {
  Input as CInput,
  InputNumber as CInputNumber,
  LabelSelector,
  Select as SealSelect,
  Textarea
} from '@gpustack/core-ui';
import { Form } from 'antd';
import { FormData } from '../config/types';
import Ports from './ports';

interface BasicProps {
  page: 'template' | 'instance';
}

const Basic: React.FC<BasicProps> = ({ page = 'template' }) => {
  const form = Form.useFormInstance<FormData>();
  const gpuVendorOptions = Object.values(GPUsConfigs);

  return (
    <>
      {page === 'template' && (
        <Form.Item<FormData>
          name="name"
          rules={[
            {
              required: true,
              message: '请输入模板名称'
            }
          ]}
        >
          <CInput.Input label="名称" required />
        </Form.Item>
      )}
      <Form.Item<FormData>
        name="vendor"
        data-field="vendor"
        rules={[
          {
            required: true,
            message: '请选择适用设备厂商'
          }
        ]}
      >
        <SealSelect
          label="适用设备厂商"
          required
          options={[...gpuVendorOptions, { label: 'CPU', value: 'cpu' }]}
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="image"
        rules={[
          {
            required: true,
            message: '请输入容器镜像'
          }
        ]}
      >
        <CInput.Input label="容器镜像" required />
      </Form.Item>
      <Form.Item<FormData> name="run_command">
        <Textarea
          label="容器启动命令"
          placeholder={'例如：/bin/bash -c "your command"'}
          trim={false}
          alwaysFocus
          scaleSize
        />
      </Form.Item>
      <Form.Item<FormData> name="boot_disk_size_gb">
        <CInputNumber min={1} precision={0} label="容器启动盘大小 (GB)" />
      </Form.Item>
      <Ports />
      <Form.Item<FormData> name="env">
        <LabelSelector label="环境变量" btnText="添加变量" />
      </Form.Item>
    </>
  );
};

export default Basic;
