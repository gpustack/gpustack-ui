import { GPUsConfigs } from '@/pages/resources/config/gpu-driver';
import {
  Input as CInput,
  InputNumber as CInputNumber,
  LabelSelector,
  Select as SealSelect,
  Textarea
} from '@gpustack/core-ui';
import { Form, Select } from 'antd';
import { FormData } from '../config/types';
import Ports from './ports';

const Basic = () => {
  const form = Form.useFormInstance<FormData>();
  const envs = Form.useWatch('env', form);
  const gpuVendorOptions = Object.values(GPUsConfigs);

  const handleEnvChange = (labels: Record<string, any>) => {
    form.setFieldValue('env', labels);
  };

  return (
    <>
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
      <Form.Item<FormData>
        name="vendor"
        rules={[
          {
            required: true,
            message: '请选择适用设备厂商'
          }
        ]}
      >
        <SealSelect label="适用设备厂商" required>
          {gpuVendorOptions.map((item) => (
            <Select.Option value={item.value} key={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </SealSelect>
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
      {/* <Form.Item<FormData> name="image_pull_policy">
        <SealSelect
          allowClear
          label="镜像拉取策略"
          options={[
            { label: 'IfNotPresent', value: 'IfNotPresent' },
            { label: 'Always', value: 'Always' },
            { label: 'Never', value: 'Never' }
          ]}
        ></SealSelect>
      </Form.Item> */}
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
      {/* <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name="volume_size_gb">
            <CInputNumber min={1} precision={0} label="存储卷大小 (GB)" />
          </Form.Item>
        </div>
        <div style={{ flex: 2 }}>
          <Form.Item<FormData> name="volume_mount_path">
            <CInput.Input label="存储卷挂载路径" placeholder="例如：/data" />
          </Form.Item>
        </div>
      </div> */}
      <Ports />
      <Form.Item<FormData> name="env">
        <LabelSelector
          label="环境变量"
          labels={envs || {}}
          btnText="添加变量"
          onChange={handleEnvChange}
        />
      </Form.Item>
    </>
  );
};

export default Basic;
