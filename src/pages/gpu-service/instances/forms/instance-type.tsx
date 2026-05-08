import {
  AutoTooltip,
  Input as CInput,
  InputNumber as CInputNumber
} from '@gpustack/core-ui';
import { Flex, Form, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { InstanceTypePhaseValueMap } from '../config';
import { FormData, InstanceTypeItem } from '../config/types';
import useQueryInstanceTypes from '../services/use-query-instance-types';
import InstanceTypeOverlay from './instance-type-overlay';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const SelectedCard = styled.div`
  display: grid;
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
  gap: 4px;
  color: var(--ant-color-text-secondary);
  font-size: 13px;
`;

interface InstanceTypePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  dataList: InstanceTypeItem[];
}

const InstanceTypePicker: React.FC<InstanceTypePickerProps> = ({
  value,
  onChange,
  dataList
}) => {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    return dataList.find(
      (item) => (item.metadata?.name || item.name) === value
    );
  }, [value, dataList]);

  const handleChange = (item: InstanceTypeItem) => {
    onChange?.(item.metadata?.name || item.name);
  };

  return (
    <>
      <SelectedCard>
        <div>
          <SummaryTitle>
            <Flex gap={16} align="center">
              <AutoTooltip ghost minWidth={20}>
                {(selected?.metadata?.name || selected?.name) ??
                  '请选择实例类型'}
              </AutoTooltip>
              {selected && (
                <Tag
                  style={{
                    fontWeight: 400,
                    color: 'var(--ant-color-text-tertiary)'
                  }}
                >
                  库存 {selected?.status?.accelerator?.remaining ?? '-'}
                </Tag>
              )}
            </Flex>
          </SummaryTitle>
          <SummaryMeta>
            <span>显存 {selected?.spec?.memory ?? '-'}</span>
            <Flex gap={16}>
              <span>内存 {selected?.status?.ram?.capacity ?? '-'}</span>
              <span>vCPU {selected?.status?.cpu?.capacity ?? '-'}</span>
            </Flex>
          </SummaryMeta>
        </div>
      </SelectedCard>
      <InstanceTypeOverlay
        open={open}
        value={value}
        dataList={dataList}
        onCancel={() => setOpen(false)}
        onChange={handleChange}
      />
    </>
  );
};

const InstanceTypeFormItem = () => {
  const form = Form.useFormInstance<
    FormData & { type?: string; gpu_count?: number }
  >();
  const typeName = Form.useWatch('type', form) as string | undefined;

  const { detailData, fetchData } = useQueryInstanceTypes();

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const dataList = detailData?.items || [];

  const selectedInstanceType = useMemo(() => {
    return dataList.find(
      (item) => (item.metadata?.name || item.name) === typeName
    );
  }, [dataList, typeName]);

  const maxGpuCount = useMemo(() => {
    const remaining = selectedInstanceType?.status?.accelerator?.remaining;
    const num = remaining ? Number(remaining) : NaN;
    return Number.isFinite(num) && num > 0 ? num : 1;
  }, [selectedInstanceType]);

  useEffect(() => {
    if (!typeName && dataList.length > 0) {
      const defaultType = dataList.find(
        (item) => item.status?.phase === InstanceTypePhaseValueMap.Available
      );
      if (defaultType) {
        form.setFieldValue(
          'type',
          defaultType.metadata?.name || defaultType.name
        );
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
  }, [form, typeName, maxGpuCount, dataList]);

  return (
    <>
      <FieldBlock data-field="instanceType">
        <Form.Item
          name="type"
          rules={[
            {
              required: true,
              message: '请选择实例类型'
            }
          ]}
        >
          <InstanceTypePicker dataList={dataList} />
        </Form.Item>
      </FieldBlock>
      <Form.Item
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
          label="GPU 数量"
          required
        />
      </Form.Item>
      <Form.Item name="type_display" hidden>
        <CInput.Input />
      </Form.Item>
    </>
  );
};

export const useSelectedInstanceType = () => {
  const form = Form.useFormInstance<FormData & { type?: string }>();
  const typeName = Form.useWatch('type', form) as string | undefined;
  const { detailData } = useQueryInstanceTypes();
  const dataList = detailData?.items || [];

  return useMemo(() => {
    return dataList.find(
      (item) => (item.metadata?.name || item.name) === typeName
    );
  }, [dataList, typeName]);
};

export default InstanceTypeFormItem;
