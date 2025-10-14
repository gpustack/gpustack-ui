import SealCascader from '@/components/seal-form/seal-cascader';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import GPUCard from '../components/gpu-card';
import { scheduleList, ScheduleValueMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useCatalogFormContext, useFormContext } from '../config/form-context';

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

const ScheduleTypeForm: React.FC = () => {
  const intl = useIntl();
  const { onValuesChange, gpuOptions } = useFormContext();
  const { onQuantizationChange } = useCatalogFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const scheduleType = Form.useWatch('scheduleType', form);

  const handleScheduleTypeChange = (value: string) => {
    if (value === ScheduleValueMap.Auto) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleOnQuantizationChange = (val: any) => {
    onQuantizationChange?.(val);
  };

  const handleBeforeGpuSelectorChange = (gpuIds: any[]) => {};

  const handleGpuSelectorChange = (value: any[]) => {
    handleBeforeGpuSelectorChange(value);
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
          </>
        )}
    </>
  );
};

export default ScheduleTypeForm;
