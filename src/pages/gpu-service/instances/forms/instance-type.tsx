import {
  AutoTooltip,
  Input as CInput,
  InputNumber as CInputNumber
} from '@gpustack/core-ui';
import { Button, Flex, Form, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { instanceTypeOptions, InstanceTypeStatusValueMap } from '../config';
import { FormData } from '../config/types';
import InstanceTypeOverlay from './instance-type-overlay';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const SelectedCard = styled.div`
  display: grid;
  height: 102px;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius-lg);
  background: var(--ant-color-bg-container);
`;

const SummaryTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--ant-color-text);
  font-weight: 500;
`;

const SummaryMeta = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 4px;
  color: var(--ant-color-text-secondary);
  font-size: 13px;
`;

interface InstanceTypePickerProps {
  value?: number;
  onChange?: (value: number) => void;
}

const InstanceTypePicker: React.FC<InstanceTypePickerProps> = ({
  value,
  onChange
}) => {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    return instanceTypeOptions.find((item) => item.id === value);
  }, [value]);

  return (
    <>
      <SelectedCard>
        <div>
          <SummaryTitle>
            <Flex gap={16}>
              <AutoTooltip ghost minWidth={20}>
                {selected?.name || '请选择实例类型'}
              </AutoTooltip>
              <Tag
                style={{
                  fontWeight: 400,
                  color: 'var(--ant-color-text-tertiary)'
                }}
              >
                库存 {selected?.gpu_count}
              </Tag>
            </Flex>
            {/* {selected && (
              <Tag color="success" style={{ margin: 0 }}>
                可用
              </Tag>
            )} */}
          </SummaryTitle>
          <SummaryMeta>
            <span>显存 {selected?.vram ?? '-'} GiB</span>
            <Flex gap={16}>
              <span>内存 {selected?.ram ?? '-'} GiB</span>
              <span>CPU {selected?.vCPU ?? '-'}</span>
            </Flex>
          </SummaryMeta>
        </div>
        <Button onClick={() => setOpen(true)}>更换</Button>
      </SelectedCard>
      <InstanceTypeOverlay
        open={open}
        value={value}
        onCancel={() => setOpen(false)}
        onChange={onChange}
      />
    </>
  );
};

const InstanceTypeFormItem = () => {
  const form = Form.useFormInstance<FormData>();
  const instanceTypeId = Form.useWatch('instance_type_id', form);

  const selectedInstanceType = useMemo(() => {
    return instanceTypeOptions.find((item) => item.id === instanceTypeId);
  }, [instanceTypeId]);

  const maxGpuCount = selectedInstanceType?.gpu_count ?? 1;

  useEffect(() => {
    if (!instanceTypeId) {
      const defaultType = instanceTypeOptions.find(
        (item) => item.status === InstanceTypeStatusValueMap.Available
      );
      if (defaultType) {
        form.setFieldValue('instance_type_id', defaultType.id);
      }
      return;
    }

    const currentGpuCount = form.getFieldValue('gpu_count') ?? 1;
    if (currentGpuCount > maxGpuCount) {
      form.setFieldValue('gpu_count', maxGpuCount);
    }

    if (currentGpuCount < 1) {
      form.setFieldValue('gpu_count', 1);
    }

    if (selectedInstanceType) {
      form.setFieldValue('instance_type', selectedInstanceType.name);
    }
  }, [form, instanceTypeId, maxGpuCount, selectedInstanceType]);

  return (
    <>
      <FieldBlock data-field="instanceType">
        <Form.Item<FormData>
          name="instance_type_id"
          rules={[
            {
              required: true,
              message: '请选择实例类型'
            }
          ]}
        >
          <InstanceTypePicker />
        </Form.Item>
      </FieldBlock>
      <Form.Item<FormData>
        name="gpu_count"
        rules={[
          {
            required: true,
            message: '请输入 GPU 数量'
          },
          {
            validator: (_, value) => {
              if (value > maxGpuCount) {
                return Promise.reject(
                  new Error(`当前实例类型最多支持 ${maxGpuCount} 个 GPU`)
                );
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <CInputNumber
          min={1}
          max={maxGpuCount}
          precision={0}
          label={`GPU 数量`}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name="instance_type" hidden>
        <CInput.Input />
      </Form.Item>
    </>
  );
};

export const useSelectedInstanceType = () => {
  const form = Form.useFormInstance<FormData>();
  const instanceTypeId = Form.useWatch('instance_type_id', form);

  return useMemo(() => {
    return instanceTypeOptions.find((item) => item.id === instanceTypeId);
  }, [instanceTypeId]);
};

export default InstanceTypeFormItem;
