import SealInputNumber from '@/components/seal-form/input-number';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import GPUCard from '../components/gpu-card';
import { gpusCountTypeMap, scheduleList, ScheduleValueMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';

const scheduleTypeTips = [
  {
    title: {
      text: 'models.form.scheduletype.auto',
      locale: true
    },
    tips: 'models.form.scheduletype.auto.tips'
  },
  {
    title: {
      text: 'models.form.scheduletype.manual',
      locale: true
    },
    tips: 'models.form.scheduletype.manual.tips'
  }
];

const gpuAllocateTypeTips = [
  {
    title: {
      text: 'models.form.gpusAllocationType.auto',
      locale: true
    },
    tips: 'models.form.gpusAllocationType.auto.tips'
  },
  {
    title: {
      text: 'models.form.gpusAllocationType.custom',
      locale: true
    },
    tips: 'models.form.gpusAllocationType.custom.tips'
  }
];

const ScheduleTypeForm: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange, gpuOptions } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const scheduleType = Form.useWatch('scheduleType', form);
  const gpusCountType = Form.useWatch('gpusCountType', form);
  const gpuSelectorIds = Form.useWatch(['gpu_selector', 'gpu_ids'], form);

  const handleScheduleTypeChange = (value: string) => {
    if (value === ScheduleValueMap.Auto) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleGpusCountTypeChange = (val: string) => {
    if (val === 'custom') {
      form.setFieldValue(['gpu_selector', 'gpus_per_replica'], 2);
    }
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleBeforeGpuSelectorChange = (gpuIds: any[]) => {};

  const handleGpuSelectorChange = (value: any[]) => {
    handleBeforeGpuSelectorChange(value);
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleOnStepReplicaStep = (
    value: number,
    info: { offset: number; type: 'up' | 'down' }
  ) => {
    let newValue = value;
    const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0; // check power of two
    if (!isPowerOfTwo(value)) {
      if (info.type === 'up') {
        newValue = Math.pow(2, Math.ceil(Math.log2(value)));
      } else {
        newValue = Math.pow(2, Math.floor(Math.log2(value)));
      }
    }
    form.setFieldValue(['gpu_selector', 'gpus_per_replica'], newValue);
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <>
      <Form.Item name="scheduleType">
        <SealSelect
          onChange={handleScheduleTypeChange}
          label={intl.formatMessage({ id: 'models.form.scheduletype' })}
          description={<TooltipList list={scheduleTypeTips}></TooltipList>}
          options={scheduleList}
        ></SealSelect>
      </Form.Item>
      {scheduleType === ScheduleValueMap.SpecificGPUType && (
        <>
          <Form.Item name={['gpu_selector', 'gpu_type']}>
            <SealSelect
              label={intl.formatMessage({ id: 'models.form.gpuType' })}
              options={[]}
            ></SealSelect>
          </Form.Item>
          <Form.Item name={['gpu_selector', 'gpu_count']}>
            <SealSelect
              label={intl.formatMessage({ id: 'models.form.gpuCount' })}
              options={[]}
            ></SealSelect>
          </Form.Item>
        </>
      )}
      {scheduleType === ScheduleValueMap.Manual &&
        !form.getFieldValue('fix_gpu_type') && (
          <>
            <Form.Item
              name={['gpu_selector', 'gpu_ids']}
              rules={[
                {
                  required: true,
                  message: getRuleMessage('select', 'models.form.gpuselector')
                }
              ]}
            >
              <SealCascader
                required
                showSearch
                expandTrigger="hover"
                multiple={
                  form.getFieldValue('backend') !== backendOptionsMap.voxBox
                }
                classNames={{
                  popup: {
                    root: 'cascader-popup-wrapper gpu-selector'
                  }
                }}
                maxTagCount={1}
                label={intl.formatMessage({ id: 'models.form.gpuselector' })}
                options={gpuOptions}
                showCheckedStrategy="SHOW_CHILD"
                value={form.getFieldValue(['gpu_selector', 'gpu_ids'])}
                optionNode={GPUCard}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                notFoundContent={intl.formatMessage({
                  id: 'models.form.gpus.notfound'
                })}
                onChange={handleGpuSelectorChange}
              ></SealCascader>
            </Form.Item>
            <Form.Item name="gpusCountType">
              <SealSelect
                onChange={handleGpusCountTypeChange}
                label={intl.formatMessage({
                  id: 'models.form.gpusAllocationType'
                })}
                description={
                  <TooltipList list={gpuAllocateTypeTips}></TooltipList>
                }
                options={[
                  {
                    label: intl.formatMessage({
                      id: 'models.form.gpusAllocationType.auto'
                    }),
                    value: gpusCountTypeMap.Auto
                  },
                  {
                    label: intl.formatMessage({
                      id: 'models.form.gpusAllocationType.custom'
                    }),
                    value: gpusCountTypeMap.Custom
                  }
                ]}
              ></SealSelect>
            </Form.Item>
            {gpusCountType === gpusCountTypeMap.Custom && (
              <Form.Item name={['gpu_selector', 'gpus_per_replica']}>
                <SealInputNumber
                  label={intl.formatMessage({
                    id: 'models.form.gpusperreplica'
                  })}
                  min={1}
                  step={1}
                  onStep={handleOnStepReplicaStep}
                />
              </Form.Item>
            )}
          </>
        )}
    </>
  );
};

export default ScheduleTypeForm;
