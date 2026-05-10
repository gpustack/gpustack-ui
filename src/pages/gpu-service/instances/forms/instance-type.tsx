import { AutoTooltip, InputNumber as CInputNumber } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Tag } from 'antd';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { InstanceTypePhaseValueMap } from '../config';
import { FormData, InstanceTypeItem } from '../config/types';
import useQueryInstanceTypes from '../services/use-query-instance-types';

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
  dataList: InstanceTypeItem[];
}

const InstanceTypePicker: React.FC<InstanceTypePickerProps> = ({
  value,
  dataList
}) => {
  const intl = useIntl();
  const selected = useMemo(() => {
    return dataList.find((item) => (item.metadata?.name || '') === value);
  }, [value, dataList]);

  return (
    <>
      <SelectedCard>
        <div>
          <SummaryTitle>
            <Flex gap={16} align="center">
              <AutoTooltip ghost minWidth={20}>
                {selected?.metadata?.name || '-'}
              </AutoTooltip>
              {selected && selected.spec?.acceleratable && (
                <Tag
                  style={{
                    fontWeight: 400,
                    color: 'var(--ant-color-text-tertiary)'
                  }}
                >
                  {intl.formatMessage({ id: 'gpuservice.instance.stock' })}{' '}
                  {selected?.status?.accelerator?.remaining ?? '-'}
                </Tag>
              )}
            </Flex>
          </SummaryTitle>
          <SummaryMeta>
            {selected?.spec?.acceleratable && (
              <span>
                {intl.formatMessage({ id: 'gpuservice.instance.memory' })}{' '}
                {selected?.spec?.memory ?? '-'}
              </span>
            )}
            <Flex gap={16}>
              <span>
                {intl.formatMessage({ id: 'gpuservice.instance.ram' })}{' '}
                {selected?.status?.ram?.capacity ?? '-'}
              </span>
              <span>vCPU {selected?.status?.cpu?.capacity ?? '-'}</span>
            </Flex>
          </SummaryMeta>
        </div>
      </SelectedCard>
    </>
  );
};

const InstanceTypeFormItem = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const typeName = Form.useWatch(['spec', 'type'], form) as string | undefined;

  const { detailData, fetchData } = useQueryInstanceTypes();

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const dataList = detailData?.items || [];

  const selectedInstanceType = useMemo(() => {
    return dataList.find((item) => (item.metadata?.name || '') === typeName);
  }, [dataList, typeName]);

  const maxGpuCount = useMemo(() => {
    const remaining = selectedInstanceType?.status?.accelerator?.remaining;
    const num = remaining ? Number(remaining) : NaN;
    return Number.isFinite(num) && num > 0 ? num : 1;
  }, [selectedInstanceType]);

  useEffect(() => {
    if (!typeName && dataList.length > 0) {
      const defaultType = dataList.find(
        (item) => item.status?.phase === InstanceTypePhaseValueMap.Active
      );
      if (defaultType) {
        form.setFieldValue(['spec', 'type'], defaultType.metadata?.name || '');
      }
      return;
    }

    const currentAccelerator =
      Number(form.getFieldValue(['spec', 'resources', 'accelerator'])) || 1;
    if (currentAccelerator > maxGpuCount) {
      form.setFieldValue(['spec', 'resources', 'accelerator'], maxGpuCount);
    }

    if (currentAccelerator < 1) {
      form.setFieldValue(['spec', 'resources', 'accelerator'], 1);
    }
  }, [form, typeName, maxGpuCount, dataList]);

  return (
    <div data-field="instanceType">
      <FieldBlock>
        <Form.Item
          name={['spec', 'type']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'gpuservice.instance.type.required'
              })
            }
          ]}
        >
          <InstanceTypePicker dataList={dataList} value={typeName} />
        </Form.Item>
      </FieldBlock>
      {selectedInstanceType?.spec?.acceleratable && (
        <Form.Item
          name={['spec', 'resources', 'accelerator']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'gpuservice.instance.gpuCount.required'
              })
            },
            {
              validator: (_, value) => {
                if (value > maxGpuCount) {
                  return Promise.reject(
                    new Error(
                      intl.formatMessage(
                        { id: 'gpuservice.instance.gpuCount.max' },
                        { count: maxGpuCount }
                      )
                    )
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
            label={intl.formatMessage({ id: 'gpuservice.instance.gpuCount' })}
            required
          />
        </Form.Item>
      )}
    </div>
  );
};

export default InstanceTypeFormItem;
