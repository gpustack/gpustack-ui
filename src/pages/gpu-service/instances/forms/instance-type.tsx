import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import NumberSelection from '@/pages/_components/number-selection';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import InstanceTypeItem from '../components/instance-type-item';
import { InstanceTypePhaseValueMap } from '../config';
import {
  FormData,
  InstanceTypeItem as InstanceTypeItemModel
} from '../config/types';
import useQueryInstanceTypes from '../services/use-query-instance-types';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const SelectedCard = styled.div`
  padding: 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius-lg);
  background: var(--ant-color-bg-container);
`;

interface InstanceTypePickerProps {
  value?: string;
  dataList: InstanceTypeItemModel[];
}

const InstanceTypePicker: React.FC<InstanceTypePickerProps> = ({
  value,
  dataList
}) => {
  const selected = useMemo(() => {
    return (
      dataList.find((item) => (item.metadata?.name || '') === value) ||
      ({} as InstanceTypeItemModel)
    );
  }, [value, dataList]);

  return (
    <SelectedCard>
      <InstanceTypeItem item={selected} showStatus={false} />
    </SelectedCard>
  );
};

interface InstanceTypeFormItemProps {
  action: PageActionType;
}

const InstanceTypeFormItem: React.FC<InstanceTypeFormItemProps> = ({
  action
}) => {
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
    const onceMaxRequest =
      selectedInstanceType?.status?.accelerator?.onceMaxRequest;
    const num = onceMaxRequest ? Number(onceMaxRequest) : 0;
    return num;
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
          <NumberSelection
            min={1}
            max={maxGpuCount}
            step={1}
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'gpuservice.instance.gpuCount' })}
          />
        </Form.Item>
      )}
    </div>
  );
};

export default InstanceTypeFormItem;
